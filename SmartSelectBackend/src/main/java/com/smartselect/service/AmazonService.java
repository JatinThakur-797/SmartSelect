package com.smartselect.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartselect.dto.ProductDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.*;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class AmazonService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.rapidapi.key}")
    private String rapidApiKey;

    @Value("${app.rapidapi.host}")
    private String rapidApiHost;

    @Value("${app.rapidapi.base-url}")
    private String rapidApiBaseUrl;

    /**
     * Fetches all 5 products in parallel using CompletableFuture.
     * Each call is @Async so they run concurrently in the thread pool.
     */
    public List<ProductDto> fetchProductsInParallel(
            List<Map<String, String>> geminiProducts,
            String category,
            Integer minBudget,
            Integer maxBudget
    ) {
        List<CompletableFuture<ProductDto>> futures = geminiProducts.stream()
                .map(gp -> fetchProductAsync(gp, category, minBudget, maxBudget))
                .toList();

        // Wait for all to complete and collect results
        List<ProductDto> results = futures.stream()
                .map(f -> {
                    try {
                        return f.get();
                    } catch (Exception e) {
                        log.warn("Async product fetch failed: {}", e.getMessage());
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .toList();

        // Deduplicate products by ASIN (or title/name if ASIN is empty)
        Set<String> seenIdentifiers = new HashSet<>();
        List<ProductDto> uniqueProducts = new ArrayList<>();
        for (ProductDto p : results) {
            String identifier = (p.getAsin() != null && !p.getAsin().isBlank()) ? p.getAsin() : p.getName();
            if (seenIdentifiers.add(identifier)) {
                uniqueProducts.add(p);
            }
        }
        return uniqueProducts;
    }

    @Async("taskExecutor")
    public CompletableFuture<ProductDto> fetchProductAsync(
            Map<String, String> geminiProduct,
            String category,
            Integer minBudget,
            Integer maxBudget
    ) {
        for(String key : geminiProduct.keySet()){
            System.out.println("Key :" + key + "value :" + geminiProduct.get(key) );
        }
        String name   = geminiProduct.get("name");
        String reason = geminiProduct.get("reason");
        String specs  = geminiProduct.get("specs");
        System.out.println(category);
        System.out.println(name + " " + reason + " " + specs);
        try {
            ProductDto product = searchAmazonProduct(name, category, minBudget, maxBudget);
            if (product != null) {
                product.setAiReason(reason);
                product.setSpecs(parseSpecs(specs));
                return CompletableFuture.completedFuture(product);
            }
            return CompletableFuture.completedFuture(null);

        } catch (Exception e) {
            log.warn("Amazon fetch failed for '{}': {}", name, e.getMessage());
            return CompletableFuture.completedFuture(null);
        }
    }

    // ── Amazon Search ─────────────────────────────────────────────────────────

    private ProductDto searchAmazonProduct(String productName, String category, Integer minBudget, Integer maxBudget) {

        try {
            String safeSearchQuery = productName;

            // If the category (like "laptop") isn't already in the name, add it!
            if ("laptop".equalsIgnoreCase(category) && !safeSearchQuery.toLowerCase().contains("laptop")) {
                safeSearchQuery = safeSearchQuery + " laptop";
            }
            URI uri = UriComponentsBuilder
                    .fromUriString(rapidApiBaseUrl + "/search")
                    .queryParam("query", safeSearchQuery)
                    .queryParam("page", "1")
                    .queryParam("country", "IN")
                    .queryParam("sort_by", "RELEVANCE")
                    .queryParam("product_condition", "ALL")
                    .build()
                    .toUri();
            System.out.println(uri.toString());

            ResponseEntity<String> response = restTemplate.exchange(
                    uri, HttpMethod.GET,
                    new HttpEntity<>(buildRapidApiHeaders()),
                    String.class
            );

            return parseSearchResult(response.getBody(), productName, category, minBudget, maxBudget);

        } catch (Exception e) {
            log.warn("RapidAPI search failed: {}", e.getMessage());
            return null;
        }

    }

    private static final List<String> ACCESSORY_KEYWORDS = Arrays.asList(
            "cover", "case", "tempered glass", "glass guard", "screen protector", "screen guard",
            "lens protector", "pouch", "sleeve", "back cover", "flip cover", "shield", "charger",
            "adapter", "cable", "wire", "strap", "band", "pen", "stylus", "stand", "holder",
            "ring", "tripod", "mount", "bag", "backpack", "skins", "sticker", "decal", "cleaner",
            "dust plug", "replacement battery", "keychain", "key chain", "keyboard cover"
    );

    private boolean isAccessory(String title) {
        if (title == null || title.isBlank()) return false;
        String lowerTitle = title.toLowerCase();
        for (String keyword : ACCESSORY_KEYWORDS) {
            if (lowerTitle.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private int parsePriceToInt(String priceStr) {
        if (priceStr == null || priceStr.isBlank()) return -1;
        String noDecimals = priceStr.split("\\.")[0];
        String clean = noDecimals.replaceAll("[^0-9]", "");
        if (clean.isEmpty()) return -1;
        try {
            return Integer.parseInt(clean);
        } catch (NumberFormatException e) {
            return -1;
        }
    }

    private ProductDto parseSearchResult(String body, String targetName, String category, Integer minBudget, Integer maxBudget) {
        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode products = root.path("data").path("products");

            if (products.isEmpty()) return null;

            List<ProductDto> candidates = new ArrayList<>();

            // Loop and find all non-accessory, price-valid products
            for (JsonNode node : products) {
                String title = node.path("product_title").asText("");
                String priceStr = extractPrice(node);
                
                // 1. Skip accessories
                if (isAccessory(title)) {
                    log.info("Skipping accessory: '{}'", title);
                    continue;
                }

                // 1.5. Skip products that do not match the target title key terms (e.g. sponsored ads for different models)
                if (!isTitleMatch(title, targetName)) {
                    log.info("Skipping mismatch: '{}' does not match target '{}'", title, targetName);
                    continue;
                }
                
                // 2. Skip products with price significantly below or above the user's budget
                int priceVal = parsePriceToInt(priceStr);
                if (priceVal > 0) {
                    if (minBudget != null && priceVal < minBudget) {
                        log.info("Skipping '{}' because price (₹{}) is below min budget (₹{})", title, priceVal, minBudget);
                        continue;
                    }
                    if (maxBudget != null && priceVal > maxBudget * 1.3) {
                        log.info("Skipping '{}' because price (₹{}) is too high for max budget (₹{})", title, priceVal, maxBudget);
                        continue;
                    }
                }
                
                // Match found!
                String image = node.path("product_photo").asText(null);
                if (image == null) image = node.path("thumbnail").asText("");

                String url   = node.path("product_url").asText("");
                String asin  = node.path("asin").asText("");
                String rating = node.path("product_star_rating").asText("N/A");
                int reviewCount = node.path("product_num_ratings").asInt(0);

                candidates.add(ProductDto.builder()
                        .name(title)
                        .price(priceStr)
                        .imageUrl(image)
                        .amazonUrl(url)
                        .asin(asin)
                        .rating(rating)
                        .reviewCount(reviewCount)
                        .build());
            }

            if (candidates.isEmpty()) return null;

            // Sort candidates to find the cheapest one
            candidates.sort((p1, p2) -> {
                int price1 = parsePriceToInt(p1.getPrice());
                int price2 = parsePriceToInt(p2.getPrice());
                if (price1 <= 0 && price2 <= 0) return 0;
                if (price1 <= 0) return 1;
                if (price2 <= 0) return -1;
                return Integer.compare(price1, price2);
            });

            return candidates.get(0);

        } catch (Exception e) {
            log.warn("Failed to parse Amazon response: {}", e.getMessage());
            return null;
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private HttpHeaders buildRapidApiHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("x-rapidapi-host", rapidApiHost);
        headers.set("x-rapidapi-key", rapidApiKey);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        return headers;
    }

    private String extractPrice(JsonNode product) {
        // Try multiple price fields
        String price = product.path("product_price").asText(null);
        if (price == null || price.isBlank()) {
            price = product.path("product_minimum_offer_price").asText(null);
        }
        if (price == null || price.isBlank()) {
            price = "Price on Amazon";
        }
        // Ensure rupee symbol
        if (!price.contains("₹") && !price.startsWith("Price")) {
            price = "₹" + price;
        }
        return price;
    }

    private List<String> parseSpecs(String specsPipe) {
        if (specsPipe == null || specsPipe.isBlank()) return List.of();
        return Arrays.asList(specsPipe.split("\\|"));
    }

    private static final Set<String> IGNORED_WORDS = new HashSet<>(Arrays.asList(
        "apple", "iphone", "samsung", "galaxy", "oneplus", "realme", "poco", "iqoo", "vivo", "oppo", "motorola", "nothing",
        "hp", "dell", "lenovo", "asus", "acer", "msi", "phone", "smartphone", "laptop", "pc", "notebook", "computer", "brand"
    ));

    private String cleanText(String text) {
        if (text == null) return "";
        String t = text.toLowerCase();
        t = t.replaceAll("[^a-z0-9.\\s]", " ");
        t = t.replaceAll("(?<!\\d)\\.|\\.(?!\\d)", " ");
        return t.replaceAll("\\s+", " ").trim();
    }

    private boolean isTitleMatch(String title, String targetName) {
        if (title == null || targetName == null) return false;
        String cleanTitle = cleanText(title);
        String cleanTarget = cleanText(targetName);
        
        Set<String> titleWords = new HashSet<>(Arrays.asList(cleanTitle.split(" ")));
        String[] keywords = cleanTarget.split(" ");
        for (String word : keywords) {
            if (word.length() <= 1 || IGNORED_WORDS.contains(word)) {
                continue;
            }
            if (!titleWords.contains(word)) {
                return false;
            }
        }
        return true;
    }

    public List<ProductDto> searchAmazonProductsGeneral(String query, String category, Integer minBudget, Integer maxBudget) {
        try {
            URI uri = UriComponentsBuilder
                    .fromUriString(rapidApiBaseUrl + "/search")
                    .queryParam("query", query)
                    .queryParam("page", "1")
                    .queryParam("country", "IN")
                    .queryParam("sort_by", "RELEVANCE")
                    .queryParam("product_condition", "ALL")
                    .build()
                    .toUri();
            System.out.println("General Search URI: " + uri.toString());

            ResponseEntity<String> response = restTemplate.exchange(
                    uri, HttpMethod.GET,
                    new HttpEntity<>(buildRapidApiHeaders()),
                    String.class
            );

            return parseGeneralSearchResults(response.getBody(), query, category, minBudget, maxBudget);

        } catch (Exception e) {
            log.warn("General search failed for query '{}': {}", query, e.getMessage());
            return List.of();
        }
    }

    private List<ProductDto> parseGeneralSearchResults(String body, String query, String category, Integer minBudget, Integer maxBudget) {
        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode products = root.path("data").path("products");

            if (products.isEmpty()) return List.of();

            List<ProductDto> list = new ArrayList<>();
            for (JsonNode node : products) {
                String title = node.path("product_title").asText("");
                String priceStr = extractPrice(node);

                if (isAccessory(title)) continue;

                // Check basic brand match to filter out irrelevant cross-brand results
                String lowerTitle = title.toLowerCase();
                String lowerQuery = query.toLowerCase();
                if (lowerQuery.contains("apple") && !lowerTitle.contains("apple") && !lowerTitle.contains("iphone")) {
                    continue;
                }
                if (lowerQuery.contains("samsung") && !lowerTitle.contains("samsung")) {
                    continue;
                }
                if (lowerQuery.contains("oneplus") && !lowerTitle.contains("oneplus")) {
                    continue;
                }

                int priceVal = parsePriceToInt(priceStr);
                if (priceVal > 0) {
                    if (minBudget != null && priceVal < minBudget) continue;
                    if (maxBudget != null && priceVal > maxBudget * 1.3) continue;
                }

                String image = node.path("product_photo").asText(null);
                if (image == null) image = node.path("thumbnail").asText("");

                String url   = node.path("product_url").asText("");
                String asin  = node.path("asin").asText("");
                String rating = node.path("product_star_rating").asText("N/A");
                int reviewCount = node.path("product_num_ratings").asInt(0);

                list.add(ProductDto.builder()
                        .name(title)
                        .price(priceStr)
                        .imageUrl(image)
                        .amazonUrl(url)
                        .asin(asin)
                        .rating(rating)
                        .reviewCount(reviewCount)
                        .build());
            }
            return list;
        } catch (Exception e) {
            log.warn("Failed to parse general search response: {}", e.getMessage());
            return List.of();
        }
    }
}