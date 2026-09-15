package com.triageiq.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@Service
@Slf4j
public class GmailService {

    @Value("${gmail.client-id:}")
    private String clientId;

    @Value("${gmail.client-secret:}")
    private String clientSecret;

    @Value("${gmail.refresh-token:}")
    private String refreshToken;

    @Value("${gmail.watch-email:it-support@yourdomain.com}")
    private String watchEmail;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public record ParsedEmail(String sender, String subject, String body) {}

    public ParsedEmail parsePubSubNotification(String rawPayload) {
        try {
            JsonNode root = objectMapper.readTree(rawPayload);
            JsonNode message = root.path("message");
            if (message.isMissingNode()) {
                log.warn("Pub/Sub payload missing 'message' object");
                return null;
            }

            String dataBase64 = message.path("data").asText();
            if (dataBase64 != null && !dataBase64.isEmpty()) {
                byte[] decodedBytes = Base64.getDecoder().decode(dataBase64);
                String decodedJson = new String(decodedBytes, StandardCharsets.UTF_8);
                JsonNode decodedNode = objectMapper.readTree(decodedJson);

                String emailAddress = decodedNode.path("emailAddress").asText(watchEmail);
                String historyId = decodedNode.path("historyId").asText();

                log.info("Received Gmail Pub/Sub push for: {} (historyId: {})", emailAddress, historyId);

                // In live production, fetch latest message via Gmail API using historyId
                // For demonstration or sandbox payload, parse embedded subject/body or return structured ticket:
                String subject = decodedNode.path("subject").asText("IT Support Request via Gmail");
                String body = decodedNode.path("body").asText("Employee requested support via email to " + emailAddress);
                return new ParsedEmail(emailAddress, subject, body);
            }
        } catch (Exception e) {
            log.error("Failed to parse Gmail Pub/Sub message: {}", e.getMessage());
        }
        return null;
    }
}
