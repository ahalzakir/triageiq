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
        if (!modelsToTry.contains("gemini-3.6-flash")) {
            modelsToTry.add("gemini-3.6-flash");
        }
        if (!modelsToTry.contains("gemini-2.5-flash")) {
            modelsToTry.add("gemini-2.5-flash");
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

                // For gemini-3.6-flash, do not specify temperature; use responseMimeType only
                Map<String, Object> generationConfig = Map.of(
                    "responseMimeType", "application/json"
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

            TriageResponse result = objectMapper.readValue(text, TriageResponse.class);

            // Validation: check category, priority, and confidence threshold
            if (result.getCategory() == null || !VALID_CATEGORIES.contains(result.getCategory().toLowerCase())) {
                log.warn("Invalid category received from Gemini: {}", result.getCategory());
                return createFallbackResponse();
            }
            if (result.getPriority() == null || !VALID_PRIORITIES.contains(result.getPriority().toUpperCase())) {
                log.warn("Invalid priority received from Gemini: {}", result.getPriority());
                return createFallbackResponse();
            }
            if (result.getConfidence() == null || result.getConfidence() < 0.6f) {
                log.info("Gemini confidence too low: {}. Falling back to default.", result.getConfidence());
                return createFallbackResponse();
            }

            result.setCategory(result.getCategory().toLowerCase());
            result.setPriority(result.getPriority().toUpperCase());
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
