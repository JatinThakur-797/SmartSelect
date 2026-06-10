package com.smartselect.service;

import com.smartselect.dto.HistoryItemDto;
import com.smartselect.dto.ProductDto;
import com.smartselect.dto.RecommendationRequest;
import com.smartselect.dto.RecommendationResponse;
import com.smartselect.entity.RecommendationHistory;
import com.smartselect.entity.SharedRecommendationCache;
import com.smartselect.entity.User;
import com.smartselect.repository.RecommendationHistoryRepository;
import com.smartselect.repository.SharedRecommendationCacheRepository;
import com.smartselect.repository.UserRepository;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.ConcurrentHashMap;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    private final GeminiService geminiService;
    private final AmazonService amazonService;
    private final RecommendationHistoryRepository historyRepo;
    private final SharedRecommendationCacheRepository cacheRepo;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.cache.ttl-hours:24}")
    private int cacheTtlHours;

    @Value("${app.rate-limit.recommendations-per-hour:10}")
    private int rateLimitPerHour;

    /** Per-user rate limiters stored in memory (Bucket4j). */
    private final Map<Long, Bucket> rateLimitBuckets = new ConcurrentHashMap<>();

    // ══════════════════════════════════════════════════════════════════════════
    // MAIN RECOMMENDATION FLOW
    // ══════════════════════════════════════════════════════════════════════════

    @Transactional
    public RecommendationResponse recommend(RecommendationRequest req, String userEmail) {

        // Dynamic spec-based budget validation
        int dynamicMin = calculateMinBudget(req);
        if (req.getBudget() < dynamicMin) {
            throw new IllegalArgumentException("For your selected specifications, the minimum realistic budget is ₹" + String.format("%,d", dynamicMin) + ".");
        }

        // 1. Identify user
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        System.out.println(req.getCategory() + "reach to service");

        // 2. Rate-limit check
        checkRateLimit(user.getId());

        // 3. Compute deterministic cache key for this request
        String cacheKey = computeCacheKey(req);
        log.info("Cache key computed: {}", cacheKey);

        // 4. Try shared cache (cross-user, 24-hour TTL)
        Optional<SharedRecommendationCache> cachedEntry = findFreshCache(cacheKey);

        List<ProductDto> products;
        boolean fromCache;
        LocalDateTime cachedAt = null;

        if (cachedEntry.isPresent()) {
            // ── CACHE HIT ── serve instantly, increment hit counter
            SharedRecommendationCache entry = cachedEntry.get();
            log.info("✅ Cache HIT for key={} (hits={})", cacheKey, entry.getHitCount() + 1);
            System.out.println(req.getCategory() + "reach to if block");
            products   = deserializeProducts(entry.getProductsJson());
            fromCache  = true;
            cachedAt   = entry.getCreatedAt();

            // Increment hit count asynchronously
            entry.setHitCount(entry.getHitCount() + 1);
            cacheRepo.save(entry);

        } else {
            // ── CACHE MISS ── generate fresh recommendations
            log.info("❌ Cache MISS for key={} — generating fresh...", cacheKey);
            System.out.println(req.getCategory() + "reach to else block for new generation");
            // Delete any stale entry for this key
            cacheRepo.findByCacheKey(cacheKey).ifPresent(cacheRepo::delete);

            // Call Gemini for product names + reasons
            List<Map<String, String>> geminiProducts = geminiService.getProductSuggestions(req);

            // Fetch real Amazon data in parallel
            products  = amazonService.fetchProductsInParallel(geminiProducts, req.getCategory(), req.getBudget());
            fromCache = false;

            // Persist to shared cache so next users benefit
            persistToSharedCache(cacheKey, req, products);
        }

        if (products == null || products.size() < 3) {
            throw new IllegalArgumentException("No products found within your budget range (₹" + String.format("%,d", req.getBudget()) + "). Devices matching your specifications generally start around ₹" + String.format("%,d", dynamicMin) + ". Please consider increasing your budget to find matching products.");
        }

        // 5. Always save to user's personal history (dashboard)
        saveUserHistory(user.getId(), req, products);
        System.out.println(req.getCategory() + "Generated");
        // 6. Build and return response
        return buildResponse(req, products, fromCache, cachedAt);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // HISTORY
    // ══════════════════════════════════════════════════════════════════════════

    public List<HistoryItemDto> getUserHistory(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return historyRepo.findTop3ByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toHistoryItemDto)
                .toList();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // CACHE KEY COMPUTATION
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Generates a deterministic, normalized cache key.
     *
     * Format: {category}_{budgetBucket}_{normalizedProfession}_{usageMd5Prefix}
     * Example: "laptop_25k-40k_student_a3f8bc12"
     *
     * Budget is bucketed into ranges so users with ₹38k and ₹40k budgets
     * get the same results — they're effectively the same market segment.
     */
    String computeCacheKey(RecommendationRequest req) {
        String budgetBucket      = getBudgetBucket(req.getBudget());
        String professionNorm    = req.getProfession().toLowerCase().trim().replaceAll("\\s+", "_");
        String usageHash         = md5Prefix(req.getUsage().toLowerCase().trim());
        String categoryNorm      = req.getCategory().toLowerCase().trim();

        // Optional extras that meaningfully change recommendations
        String extras = buildExtrasKey(req);

        String key = String.join("_", categoryNorm, budgetBucket, professionNorm, usageHash, extras)
                .replaceAll("[^a-z0-9_\\-]", "");

        return key.substring(0, Math.min(key.length(), 100)); // keep under DB column length
    }

    /**
     * Budget bands — coarse enough to maximize cache hits,
     * fine enough to give meaningful recommendations.
     */
    private String getBudgetBucket(int budget) {
        if      (budget <= 10000)  return "u10k";
        else if (budget <= 15000)  return "10k-15k";
        else if (budget <= 20000)  return "15k-20k";
        else if (budget <= 25000)  return "20k-25k";
        else if (budget <= 35000)  return "25k-35k";
        else if (budget <= 50000)  return "35k-50k";
        else if (budget <= 60000)  return "50k-60k"; // Tighter
        else if (budget <= 70000)  return "60k-70k"; // Tighter
        else if (budget <= 85000)  return "70k-85k"; // Tighter
        else if (budget <= 100000) return "85k-1L";  // Tighter (98k will safely live here)
        else if (budget <= 125000) return "1L-1.25L";
        else if (budget <= 150000) return "1.25L-1.5L";
        else                       return "1.5L-plus";
    }

    /** Includes key optional specs that change which products are recommended. */
    private String buildExtrasKey(RecommendationRequest req) {
        List<String> parts = new ArrayList<>();
        if (notBlank(req.getBrandPreference()) && !"Any".equalsIgnoreCase(req.getBrandPreference()))
            parts.add(req.getBrandPreference().toLowerCase().replaceAll("\\s+", ""));
        if (notBlank(req.getProcessor()))
            parts.add(req.getProcessor().toLowerCase().replaceAll("\\s+", ""));
        if (notBlank(req.getFiveGPreference()) && "Yes".equalsIgnoreCase(req.getFiveGPreference()))
            parts.add("5g");
        return parts.isEmpty() ? "std" : String.join("-", parts);
    }

    private String md5Prefix(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.substring(0, 8); // First 8 hex chars (32-bit) is enough
        } catch (Exception e) {
            return String.valueOf(Math.abs(input.hashCode()));
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // CACHE OPERATIONS
    // ══════════════════════════════════════════════════════════════════════════

    private Optional<SharedRecommendationCache> findFreshCache(String cacheKey) {
        LocalDateTime expiryThreshold = LocalDateTime.now().minusHours(cacheTtlHours);
        return cacheRepo.findFreshByCacheKey(cacheKey, expiryThreshold);
    }

    private void persistToSharedCache(
            String cacheKey, RecommendationRequest req, List<ProductDto> products) {
        try {
            String json = objectMapper.writeValueAsString(products);
            SharedRecommendationCache entry = SharedRecommendationCache.builder()
                    .cacheKey(cacheKey)
                    .category(req.getCategory())
                    .budgetBucket(getBudgetBucket(req.getBudget()))
                    .profession(req.getProfession())
                    .productsJson(json)
                    .hitCount(0)
                    .build();
            cacheRepo.save(entry);
            log.info("✅ Saved new shared cache entry: {}", cacheKey);
        } catch (Exception e) {
            log.warn("Failed to persist shared cache: {}", e.getMessage());
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SCHEDULED CACHE CLEANUP — runs every hour
    // ══════════════════════════════════════════════════════════════════════════

    @Scheduled(fixedRate = 3_600_000) // Every 1 hour
    @Transactional
    public void cleanupExpiredCache() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(cacheTtlHours);
        int deleted = cacheRepo.deleteExpiredEntries(threshold);
        if (deleted > 0) {
            log.info("🗑️ Cleaned up {} expired shared cache entries", deleted);
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // RATE LIMITING (Bucket4j, in-memory per user)
    // ══════════════════════════════════════════════════════════════════════════

    private void checkRateLimit(Long userId) {
        Bucket bucket = rateLimitBuckets.computeIfAbsent(userId, id ->
                Bucket.builder()
                        .addLimit(Bandwidth.builder()
                                .capacity(rateLimitPerHour)
                                .refillIntervally(rateLimitPerHour, Duration.ofHours(1))
                                .build())
                        .build()
        );

        if (!bucket.tryConsume(1)) {
            throw new RuntimeException(
                    "Rate limit exceeded. You can make " + rateLimitPerHour +
                            " recommendations per hour. Please try again later.");
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // HISTORY HELPERS
    // ══════════════════════════════════════════════════════════════════════════

    private void saveUserHistory(Long userId, RecommendationRequest req, List<ProductDto> products) {
        try {
            String json = objectMapper.writeValueAsString(products);
            RecommendationHistory history = RecommendationHistory.builder()
                    .userId(userId)
                    .category(req.getCategory())
                    .budget(req.getBudget())
                    .profession(req.getProfession())
                    .usage(req.getUsage())
                    .productsJson(json)
                    .build();
            historyRepo.save(history);

            // Keep only the 3 most recent records per user
            historyRepo.deleteOldHistoryKeepLatest3(userId);
        } catch (Exception e) {
            log.warn("Failed to save recommendation history: {}", e.getMessage());
        }
    }

    private List<ProductDto> deserializeProducts(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<List<ProductDto>>() {});
        } catch (Exception e) {
            log.error("Failed to deserialize products JSON: {}", e.getMessage());
            return List.of();
        }
    }

    private HistoryItemDto toHistoryItemDto(RecommendationHistory h) {
        return HistoryItemDto.builder()
                .id(h.getId())
                .category(h.getCategory())
                .budget(h.getBudget())
                .profession(h.getProfession())
                .usage(h.getUsage())
                .products(deserializeProducts(h.getProductsJson()))
                .createdAt(h.getCreatedAt())
                .build();
    }

    private RecommendationResponse buildResponse(
            RecommendationRequest req,
            List<ProductDto> products,
            boolean fromCache,
            LocalDateTime cachedAt
    ) {
        String cacheAgeLabel = null;
        if (fromCache && cachedAt != null) {
            long hoursAgo = ChronoUnit.HOURS.between(cachedAt, LocalDateTime.now());
            long minsAgo  = ChronoUnit.MINUTES.between(cachedAt, LocalDateTime.now());
            cacheAgeLabel = hoursAgo > 0
                    ? hoursAgo + " hour" + (hoursAgo > 1 ? "s" : "") + " ago"
                    : minsAgo + " minute" + (minsAgo > 1 ? "s" : "") + " ago";
        }

        return RecommendationResponse.builder()
                .products(products)
                .category(req.getCategory())
                .budget(req.getBudget())
                .profession(req.getProfession())
                .servedFromCache(fromCache)
                .cachedAt(cachedAt)
                .cacheAgeLabel(cacheAgeLabel)
                .generatedAt(LocalDateTime.now())
                .build();
    }

    public int calculateMinBudget(RecommendationRequest req) {
        if ("smartphone".equalsIgnoreCase(req.getCategory())) {
            int min = 7000;
            if ("Apple".equalsIgnoreCase(req.getBrandPreference())) {
                min = Math.max(min, 45000);
            } else if ("OnePlus".equalsIgnoreCase(req.getBrandPreference())) {
                min = Math.max(min, 20000);
            } else if ("Samsung".equalsIgnoreCase(req.getBrandPreference())) {
                min = Math.max(min, 12000);
            }
            return min;
        } else {
            int min = 20000;
            if ("Apple".equalsIgnoreCase(req.getBrandPreference()) || "Apple M-series".equalsIgnoreCase(req.getProcessor())) {
                min = Math.max(min, 70000);
            } else if ("Samsung".equalsIgnoreCase(req.getBrandPreference())) {
                min = Math.max(min, 45000);
            } else if ("MSI".equalsIgnoreCase(req.getBrandPreference())) {
                min = Math.max(min, 40000);
            } else if ("Dell".equalsIgnoreCase(req.getBrandPreference())) {
                min = Math.max(min, 32000);
            } else if ("HP".equalsIgnoreCase(req.getBrandPreference())) {
                min = Math.max(min, 28000);
            } else if ("Lenovo".equalsIgnoreCase(req.getBrandPreference())) {
                min = Math.max(min, 25000);
            } else if ("Asus".equalsIgnoreCase(req.getBrandPreference())) {
                min = Math.max(min, 24000);
            } else if ("Acer".equalsIgnoreCase(req.getBrandPreference())) {
                min = Math.max(min, 22000);
            }

            if ("32GB+".equalsIgnoreCase(req.getRam())) {
                min = Math.max(min, 80000);
            } else if ("16GB".equalsIgnoreCase(req.getRam())) {
                min = Math.max(min, 35000);
            }
            if ("RTX 3060+".equalsIgnoreCase(req.getGraphicsCard())) {
                min = Math.max(min, 70000);
            } else if ("Dedicated NVIDIA".equalsIgnoreCase(req.getGraphicsCard()) || "Dedicated AMD".equalsIgnoreCase(req.getGraphicsCard())) {
                min = Math.max(min, 50000);
            }
            if ("1TB SSD".equalsIgnoreCase(req.getStorage())) {
                min = Math.max(min, 45000);
            }
            return min;
        }
    }

    private boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }
}