package com.triageiq;

import com.triageiq.service.GeminiTriageService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class GeminiTriageFallbackTest {

    private final GeminiTriageService geminiTriageService = new GeminiTriageService();

    @Test
    @DisplayName("Gemini fallback returns default P2, other category, 0.0 confidence")
    void testFallbackValues() {
        GeminiTriageService.TriageResponse fallback = geminiTriageService.createFallbackResponse();
        assertEquals("other", fallback.getCategory());
        assertEquals("P2", fallback.getPriority());
        assertEquals(0.0f, fallback.getConfidence());
        assertEquals("Gemini triage failed — defaulted to P2/other.", fallback.getReasoning());
    }

    @Test
    @DisplayName("Missing or placeholder API key gracefully yields fallback response")
    void testMissingApiKeyYieldsFallback() {
        GeminiTriageService.TriageResponse res = geminiTriageService.triageTicket(
            "Slow wifi in 3rd floor lounge",
            "The wireless connection drops every 5 minutes in the breakroom."
        );
        assertNotNull(res);
        assertEquals("other", res.getCategory());
        assertEquals("P2", res.getPriority());
        assertEquals(0.0f, res.getConfidence());
        assertEquals("Gemini triage failed — defaulted to P2/other.", res.getReasoning());
    }
}
