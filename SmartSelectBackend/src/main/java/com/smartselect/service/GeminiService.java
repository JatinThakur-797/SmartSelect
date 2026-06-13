package com.smartselect.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.smartselect.dto.RecommendationRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.groq.api-key}")
    private String apiKey;

    @Value("${app.groq.base-url}")
    private String baseUrl;

    /**
     * Calls Gemini 1.5 Flash and returns a list of:
     * { "name": "...", "reason": "..." } objects for top 5 products.
     */
    public List<Map<String, String>> getProductSuggestions(RecommendationRequest req, int dynamicMin) {
        String prompt = buildPrompt(req, dynamicMin);
        String url    = baseUrl;
//
//        // Build Gemini request body
//        Map<String, Object> body = Map.of(
//                "contents", List.of(
//                        Map.of("parts", List.of(Map.of("text", prompt)))
//                ),
//                "generationConfig", Map.of(
//                        "temperature", 0.3,
//                        // FIX 1: Increased token limit so the AI doesn't cut off mid-sentence
//                        "maxOutputTokens", 1500,
//                        "topP", 0.8,
//                        "responseMimeType", "application/json"
//                )
//        );
        String systemMessage = "You are an expert Indian tech reviewer in 2026. You suggest highly relevant, modern " 
                + (req.getCategory().equals("laptop") ? "laptops" : "smartphones") + ". You only output valid JSON.";

        Map<String, Object> body = Map.of(
                "model", "llama-3.3-70b-versatile",
                "messages", List.of(
                        Map.of("role", "system", "content", systemMessage),
                        Map.of("role", "user", "content", prompt)
                ),
                // This forces Groq to guarantee a valid JSON response
                "response_format", Map.of("type", "json_object"),
                "temperature", 0.3
        );
        System.out.println(prompt);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    String.class
            );

            return parseGeminiResponse(response.getBody());

        } catch (Exception e) {
            log.error("Gemini / Groq API call failed: {}", e.getMessage());
            throw new RuntimeException("AI service unavailable. Please try again.", e);
        }
    }

    // ── Prompt Builder ────────────────────────────────────────────────────────

    private String buildPrompt(RecommendationRequest req, int dynamicMin) {
        int maxBudget = req.getBudget();
        int minBudget = Math.max(dynamicMin, (int) (maxBudget * 0.5));
        StringBuilder sb = new StringBuilder();
        sb.append("You are a smart product recommendation AI for Indian consumers.\n\n");
        sb.append("A user wants to buy a ").append(req.getCategory()).append(".\n");

        // Inject modern model context for 2026
        sb.append("\nCONTEXT FOR CURRENT YEAR 2026:\n");
        sb.append("You must only suggest modern, active models that are in stock on Amazon India in 2026. Do NOT suggest older discontinued models. Here is a list of active models for each brand:\n");
        sb.append("- Apple: iPhone 16 Pro Max, iPhone 16 Pro, iPhone 16 Plus, iPhone 16, iPhone 15 Pro Max, iPhone 15 Pro, iPhone 15 Plus, iPhone 15, iPhone 16e, iPhone Air.\n");
        sb.append("- Samsung: Galaxy S26 Ultra, Galaxy S26, Galaxy S25 Ultra, Galaxy S25, Galaxy S24 Ultra, Galaxy S24, Galaxy S23 FE, Galaxy A55, Galaxy A35.\n");
        sb.append("- OnePlus: OnePlus 13, OnePlus 13R, OnePlus 12, OnePlus 12R, OnePlus Nord 4.\n");
        sb.append("- Laptop: Recommend modern laptops with recent processors (e.g. Intel Core Ultra, Intel 13th/14th Gen, AMD Ryzen 7000/8000/9000 series, Apple M2/M3/M4 chips). Avoid older 10th/11th Gen Intel processors.\n\n");

// Tell the AI to use a RANGE, not just a max budget
        sb.append("Target Price Range: ₹").append(minBudget).append(" to ₹").append(maxBudget).append("\n");
        sb.append("Profession: ").append(req.getProfession()).append("\n");
        sb.append("Usage/Needs: ").append(req.getUsage()).append("\n");

// Price constraints
        sb.append("CRITICAL RULES:\n");
        sb.append("1. ALL recommended products MUST have a current market price strictly between ₹").append(minBudget).append(" and ₹").append(maxBudget).append(".\n");
        sb.append("2. DO NOT suggest products under ₹").append(minBudget).append(". The user wants premium features for their budget.\n");
        sb.append("3. DO NOT exceed ₹").append(maxBudget).append(".\n");
        // Optional specs
        if (notBlank(req.getBrandPreference()))
            sb.append("Brand preference: ").append(req.getBrandPreference()).append("\n");

        if ("laptop".equals(req.getCategory())) {
            if (notBlank(req.getRam()))         sb.append("RAM: ").append(req.getRam()).append("\n");
            if (notBlank(req.getStorage()))     sb.append("Storage: ").append(req.getStorage()).append("\n");
            if (notBlank(req.getProcessor()))   sb.append("Processor: ").append(req.getProcessor()).append("\n");
            if (notBlank(req.getGraphicsCard())) sb.append("Graphics: ").append(req.getGraphicsCard()).append("\n");
            if (notBlank(req.getDisplaySize())) sb.append("Display: ").append(req.getDisplaySize()).append("\n");
        } else {
            if (notBlank(req.getSmartphoneRam()))     sb.append("RAM: ").append(req.getSmartphoneRam()).append("\n");
            if (notBlank(req.getSmartphoneStorage())) sb.append("Storage: ").append(req.getSmartphoneStorage()).append("\n");
            if (notBlank(req.getCameraPriority()))    sb.append("Camera priority: ").append(req.getCameraPriority()).append("\n");
            if (notBlank(req.getBattery()))           sb.append("Battery: ").append(req.getBattery()).append("\n");
            if (notBlank(req.getFiveGPreference()))   sb.append("5G: ").append(req.getFiveGPreference()).append("\n");
        }

        // FIX 2: Strict instruction added to stop Gemini from breaking JSON with internal quotes
        sb.append("""
 
Respond with ONLY a valid JSON array of exactly 8 objects. No markdown, no explanation.

IMPORTANT JSON FORMATTING RULES:
1. You MUST wrap all JSON keys and string values in standard double quotes (e.g., "name": "Value").
2. Do NOT use internal double quotes representing inches inside the text itself (e.g., write 15.6-inch instead of 15.6").

Each object must have exactly these fields:
- "name": Popular product name as sold on Amazon India. DO NOT include specific alphanumeric SKU codes (e.g., instead of 'HP Envy x360 15-ew0021nr', just write 'HP Envy x360 13th Gen').
- "reason": 2-3 sentences explaining why this product fits the user's specific needs. Do NOT include the specific product model or brand name in this text. Instead, refer to it generically as "this laptop" or "this smartphone" (e.g. say "This laptop is perfect for your programming needs..." rather than "The HP Pavilion is perfect..."). This is to prevent a text mismatch if a slightly different variant or updated version is matched on Amazon.
- "specs": array of 4-5 key spec strings (e.g. "16GB RAM", "Intel i5 13th Gen", "512GB NVMe SSD")

Format MUST be exactly like this:
        {
          "products": [
            {
              "name": "Exact product name as sold on Amazon India",
              "reason": "2-3 sentences why this fits the user.",
              "specs": ["Spec 1", "Spec 2", "Spec 3", "Spec 4"]
            }
          ]
        }
        """);

        return sb.toString();
    }

    // ── Response Parser ───────────────────────────────────────────────────────

    private List<Map<String, String>> parseGeminiResponse(String responseBody) {
        System.out.println(responseBody);
        try {
            System.out.println("enter");
            JsonNode root = objectMapper.readTree(responseBody);
            System.out.println("read tree");
            String text = root.path("choices").get(0).path("message").path("content").asText();

            System.out.println("Extracted Text  : " + text);
            // Strip markdown code fences if present
            text = text.replaceAll("```json", "").replaceAll("```", "").trim();
            System.out.println("text replace all ");

            // Parse the JSON array
            JsonNode arr = objectMapper.readTree(text).path("products");
//            JsonNode arr = objectMapper.readTree(text);
            System.out.println("read tree for text ");
            List<Map<String, String>> results = new ArrayList<>();

            for (JsonNode item : arr) {
                Map<String, String> product = new HashMap<>();
                product.put("name",   item.path("name").asText());
                product.put("reason", item.path("reason").asText());

                // Convert specs array to pipe-separated string for easy transport
                List<String> specs = new ArrayList<>();
                item.path("specs").forEach(s -> specs.add(s.asText()));
                product.put("specs", String.join("|", specs));

                results.add(product);
            }

            log.info("Gemini returned {} product suggestions", results.size());
            return results;

        } catch (Exception e) {
            log.error("Failed to parse Gemini response: {}", e.getMessage());
            log.error("e: ", e);
            log.error(String.valueOf(e.getCause()));
            throw new RuntimeException("Failed to parse AI response", e);
        }
    }

    private boolean notBlank(String s) {
        return s != null && !s.isBlank() && !"Any".equalsIgnoreCase(s);
    }
}