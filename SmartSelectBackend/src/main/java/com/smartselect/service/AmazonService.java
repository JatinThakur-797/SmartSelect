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
            Integer budget
    ) {
        List<CompletableFuture<ProductDto>> futures = geminiProducts.stream()
                .map(gp -> fetchProductAsync(gp, category, budget))
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
            Integer budget
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
            ProductDto product = searchAmazonProduct(name, category, budget);
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

    private ProductDto searchAmazonProduct(String productName, String category, Integer budget) {

        try {
            String safeSearchQuery = productName;

            // If the category (like "laptop") isn't already in the name, add it!
            if (!safeSearchQuery.toLowerCase().contains(category.toLowerCase())) {
                safeSearchQuery = safeSearchQuery + " " + category;
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

            return parseSearchResult(response.getBody(), productName, category, budget);

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

    private ProductDto parseSearchResult(String body, String targetName, String category, Integer budget) {
        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode products = root.path("data").path("products");

            if (products.isEmpty()) return null;

            // Loop and find the first non-accessory, price-valid product
            for (JsonNode node : products) {
                String title = node.path("product_title").asText("");
                String priceStr = extractPrice(node);
                
                // 1. Skip accessories
                if (isAccessory(title)) {
                    log.info("Skipping accessory: '{}'", title);
                    continue;
                }
                
                // 2. Skip products with price significantly below or above the user's budget
                if (budget != null) {
                    int priceVal = parsePriceToInt(priceStr);
                    if (priceVal > 0) {
                        if (priceVal < budget * 0.3) {
                            log.info("Skipping '{}' because price (₹{}) is too low for budget (₹{})", title, priceVal, budget);
                            continue;
                        }
                        if (priceVal > budget * 1.3) {
                            log.info("Skipping '{}' because price (₹{}) is too high for budget (₹{})", title, priceVal, budget);
                            continue;
                        }
                    }
                }
                
                // Match found!
                String image = node.path("product_photo").asText(null);
                if (image == null) image = node.path("thumbnail").asText("");

                String url   = node.path("product_url").asText("");
                String asin  = node.path("asin").asText("");
                String rating = node.path("product_star_rating").asText("N/A");
                int reviewCount = node.path("product_num_ratings").asInt(0);

                return ProductDto.builder()
                        .name(title)
                        .price(priceStr)
                        .imageUrl(image)
                        .amazonUrl(url)
                        .asin(asin)
                        .rating(rating)
                        .reviewCount(reviewCount)
                        .build();
            }

            // No valid product found in search results matching the criteria
            return null;

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
}