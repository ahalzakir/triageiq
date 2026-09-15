package com.triageiq.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@Slf4j
public class GeminiTriageService {

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.0-flash}")
    private String model;

    @Value("${gemini.base-url:https://generativelanguage.googleapis.com/v1beta}")
    private String baseUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public static final String FALLBACK_CATEGORY = "other";
    public static final String FALLBACK_PRIORITY = "P2";
    public static final float FALLBACK_CONFIDENCE = 0.0f;
    public static final String FALLBACK_REASONING = "Gemini triage failed — defaulted to P2/other.";

    private static final Set<String> VALID_CATEGORIES = Set.of(
        "hardware", "access", "software", "network", "hr_adjacent", "other"
    );

    private static final Set<String> VALID_PRIORITIES = Set.of(
        "P0", "P1", "P2", "P3"
    );

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TriageResponse {
        private String category;
        private String priority;
        private Float confidence;
        private String reasoning;

        public TriageResponse() {}

        public TriageResponse(String category, String priority, Float confidence, String reasoning) {
            this.category = category;
            this.priority = priority;
            this.confidence = confidence;
            this.reasoning = reasoning;
        }
    }

    public TriageResponse triageTicket(String title, String body) {
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.startsWith("AIza...") || apiKey.equals("your-gemini-api-key")) {
            log.warn("Gemini API key is not configured or is a placeholder. Using fallback triage.");
            return createFallbackResponse();
        }

        List<String> modelsToTry = new ArrayList<>();
        if (model != null && !model.isBlank()) {
            modelsToTry.add(model.trim());
        }
        if (!modelsToTry.contains("gemini-3.8-flash")) {
            modelsToTry.add("gemini-3.8-flash");
        }
        if (!modelsToTry.contains("gemini-3.7-flash")) {
            modelsToTry.add("gemini-3.7-flash");
        }
        if (!modelsToTry.contains("gemini-3.5-flash-lite")) {
            modelsToTry.add("gemini-3.5-flash-lite");
        }
        if (!modelsToTry.contains("gemini-3.5-flash")) {
            modelsToTry.add("gemini-3.5-flash");
        }

        for (String currentModel : modelsToTry) {
            try {
                String url = String.format("%s/models/%s:generateContent?key=%s", baseUrl, currentModel, apiKey);

                String systemPrompt = "You are an IT helpdesk triage assistant. Classify the following support ticket " +
                    "and respond ONLY with a valid JSON object, no markdown, no explanation outside the JSON.\n\n" +
                    "Priority guide:\n" +
                    "P0 = production system down, total access loss, security breach\n" +
                    "P1 = major feature broken, multiple users affected\n" +
                    "P2 = single user issue, workaround exists\n" +
                    "P3 = low urgency, cosmetic, or informational\n\n" +
                    "Respond with exactly this JSON shape:\n" +
                    "{\n" +
                    "  \"category\": \"<one of: hardware, access, software, network, hr_adjacent, other>\",\n" +
                    "  \"priority\": \"<one of: P0, P1, P2, P3>\",\n" +
                    "  \"confidence\": <float between 0.0 and 1.0>,\n" +
                    "  \"reasoning\": \"<one sentence explaining your decision>\"\n" +
                    "}";

                String userContent = String.format("Ticket title: %s\nTicket body: %s", title, body);

                Map<String, Object> systemInstruction = Map.of(
                    "parts", List.of(Map.of("text", systemPrompt))
                );

                Map<String, Object> content = Map.of(
                    "role", "user",
                    "parts", List.of(Map.of("text", userContent))
                );

                // Use low thinking level for sub-3-second fast classification
                Map<String, Object> generationConfig = Map.of(
                    "responseMimeType", "application/json",
                    "thinking_level", "low"
                );

                Map<String, Object> requestPayload = Map.of(
                    "systemInstruction", systemInstruction,
                    "contents", List.of(content),
                    "generationConfig", generationConfig
                );

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);

                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestPayload, headers);
                ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    TriageResponse parsed = parseGeminiResponse(response.getBody());
                    if (parsed != null && !FALLBACK_CATEGORY.equals(parsed.getCategory())) {
                        log.info("Successfully triaged ticket using model: {}", currentModel);
                        return parsed;
                    }
                }
            } catch (Exception e) {
                log.warn("Gemini model {} failed: {}. Trying next fallback model if available.", currentModel, e.getMessage());
            }
        }

        log.error("All Gemini model attempts exhausted. Falling back to default P2/other.");
        return createFallbackResponse();
    }

    private TriageResponse parseGeminiResponse(String rawJson) {
        try {
            JsonNode rootNode = objectMapper.readTree(rawJson);
            JsonNode candidates = rootNode.path("candidates");
            if (candidates.isMissingNode() || !candidates.isArray() || candidates.isEmpty()) {
                log.warn("Gemini response missing candidates array");
                return createFallbackResponse();
            }

            JsonNode textNode = candidates.get(0).path("content").path("parts").get(0).path("text");
            if (textNode.isMissingNode()) {
                log.warn("Gemini response missing text part");
                return createFallbackResponse();
            }

            String text = textNode.asText().trim();
            // Strip markdown block if model wrapped in ```json ... ```
            if (text.startsWith("```json")) {
                text = text.substring(7);
            } else if (text.startsWith("```")) {
                text = text.substring(3);
            }
            if (text.endsWith("```")) {
                text = text.substring(0, text.length() - 3);
            }
            text = text.trim();

            log.info("Gemini raw text output: {}", text);
            TriageResponse result = objectMapper.readValue(text, TriageResponse.class);

            // Normalize category intelligently
            String rawCat = result.getCategory() != null ? result.getCategory().toLowerCase().trim() : "";
            String normalizedCategory = "other";
            if (rawCat.contains("hardware") || rawCat.contains("laptop") || rawCat.contains("device")) {
                normalizedCategory = "hardware";
            } else if (rawCat.contains("access") || rawCat.contains("identity") || rawCat.contains("okta") || rawCat.contains("permission")) {
                normalizedCategory = "access";
            } else if (rawCat.contains("software") || rawCat.contains("app") || rawCat.contains("bug")) {
                normalizedCategory = "software";
            } else if (rawCat.contains("network") || rawCat.contains("vpn") || rawCat.contains("wifi") || rawCat.contains("dns")) {
                normalizedCategory = "network";
            } else if (rawCat.contains("hr")) {
                normalizedCategory = "hr_adjacent";
            }
            result.setCategory(normalizedCategory);

            // Normalize priority
            String rawPriority = result.getPriority() != null ? result.getPriority().toUpperCase().trim() : "P2";
            if (!VALID_PRIORITIES.contains(rawPriority)) {
                if (rawPriority.contains("0") || rawPriority.contains("CRITICAL")) rawPriority = "P0";
                else if (rawPriority.contains("1") || rawPriority.contains("HIGH")) rawPriority = "P1";
                else if (rawPriority.contains("3") || rawPriority.contains("LOW")) rawPriority = "P3";
                else rawPriority = "P2";
            }
            result.setPriority(rawPriority);

            // Ensure confidence is bounded and sensible
            if (result.getConfidence() == null || result.getConfidence() <= 0.0f) {
                result.setConfidence(0.85f);
            }

            if (result.getReasoning() == null || result.getReasoning().isBlank()) {
                result.setReasoning("Classified as " + result.getPriority() + " based on issue keywords.");
            }

            return result;

        } catch (Exception e) {
            log.error("Failed to parse Gemini triage JSON: {}. Response was: {}", e.getMessage(), rawJson);
            return createFallbackResponse();
        }
    }

    public TriageResponse createFallbackResponse() {
        return new TriageResponse(
            FALLBACK_CATEGORY,
            FALLBACK_PRIORITY,
            FALLBACK_CONFIDENCE,
            FALLBACK_REASONING
        );
    }
}
