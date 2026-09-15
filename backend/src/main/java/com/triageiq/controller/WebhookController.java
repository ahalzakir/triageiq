package com.triageiq.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.triageiq.model.Ticket;
import com.triageiq.service.GmailService;
import com.triageiq.service.TicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;

@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
@Slf4j
public class WebhookController {

    private final TicketService ticketService;
    private final GmailService gmailService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${slack.signing-secret:}")
    private String slackSigningSecret;

    @Value("${slack.help-channel-id:}")
    private String configuredHelpChannel;

    @PostMapping("/slack")
    public ResponseEntity<?> handleSlackWebhook(
        @RequestBody String rawBody,
        @RequestHeader(value = "X-Slack-Request-Timestamp", required = false) String timestampHeader,
        @RequestHeader(value = "X-Slack-Signature", required = false) String signatureHeader
    ) {
        log.info("Received Slack webhook request");

        // 1. Signature Verification (Correction 4)
        if (slackSigningSecret != null && !slackSigningSecret.isBlank() && !slackSigningSecret.startsWith("...")) {
            if (timestampHeader == null || signatureHeader == null) {
                log.warn("Missing Slack security headers");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing security headers");
            }

            try {
                long timestamp = Long.parseLong(timestampHeader);
                long currentSec = System.currentTimeMillis() / 1000;
                if (Math.abs(currentSec - timestamp) > 300) {
                    log.warn("Slack webhook rejected: timestamp too old (replay attack protection)");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Timestamp too old");
                }

                String baseString = "v0:" + timestamp + ":" + rawBody;
                Mac mac = Mac.getInstance("HmacSHA256");
                SecretKeySpec secretKey = new SecretKeySpec(slackSigningSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
                mac.init(secretKey);
                byte[] hmacBytes = mac.doFinal(baseString.getBytes(StandardCharsets.UTF_8));
                StringBuilder hexString = new StringBuilder();
                for (byte b : hmacBytes) {
                    String hex = Integer.toHexString(0xff & b);
                    if (hex.length() == 1) hexString.append('0');
                    hexString.append(hex);
                }
                String expectedSignature = "v0=" + hexString.toString();

                if (!MessageDigest.isEqual(expectedSignature.getBytes(StandardCharsets.UTF_8), signatureHeader.getBytes(StandardCharsets.UTF_8))) {
                    log.warn("Slack webhook rejected: signature mismatch");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Signature mismatch");
                }
            } catch (Exception e) {
                log.error("Slack signature verification error: {}", e.getMessage());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Verification error");
            }
        }

        // 2. Process payload
        try {
            JsonNode root = objectMapper.readTree(rawBody);

            // Slack URL verification handshake
            if ("url_verification".equals(root.path("type").asText())) {
                String challenge = root.path("challenge").asText();
                return ResponseEntity.ok(Map.of("challenge", challenge));
            }

            // Slack event callback
            if ("event_callback".equals(root.path("type").asText())) {
                JsonNode event = root.path("event");
                String type = event.path("type").asText();
                String channel = event.path("channel").asText();
                String user = event.path("user").asText("Slack User");
                String text = event.path("text").asText();
                String subtype = event.path("subtype").asText();

                // Skip bot messages to prevent feedback loops
                if ("bot_message".equalsIgnoreCase(subtype) || event.has("bot_id")) {
                    return ResponseEntity.ok("Ignored bot message");
                }

                if ("message".equals(type) && text != null && !text.isBlank()) {
                    // If channel filtering is desired
                    if (configuredHelpChannel == null || configuredHelpChannel.isBlank() || channel.equals(configuredHelpChannel)) {
                        String title = text.length() > 60 ? text.substring(0, 57) + "..." : text;
                        TicketService.TicketCreateRequest ticketReq = TicketService.TicketCreateRequest.builder()
                            .title(title)
                            .body(text)
                            .submitted_by(user + " (Slack)")
                            .source("slack")
                            .build();

                        Ticket created = ticketService.createTicket(ticketReq);
                        log.info("Created ticket from Slack message: id={}", created.getId());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse Slack event: {}", e.getMessage());
        }

        return ResponseEntity.ok("Received");
    }

    @PostMapping("/gmail")
    public ResponseEntity<?> handleGmailWebhook(@RequestBody String rawBody) {
        log.info("Received Gmail Pub/Sub push notification");
        try {
            GmailService.ParsedEmail email = gmailService.parsePubSubNotification(rawBody);
            if (email != null) {
                TicketService.TicketCreateRequest ticketReq = TicketService.TicketCreateRequest.builder()
                    .title(email.subject())
                    .body(email.body())
                    .submitted_by(email.sender())
                    .source("gmail")
                    .build();

                Ticket created = ticketService.createTicket(ticketReq);
                log.info("Created ticket from Gmail Pub/Sub: id={}", created.getId());
                return ResponseEntity.status(HttpStatus.CREATED).body(created);
            }
        } catch (Exception e) {
            log.error("Failed to process Gmail push notification: {}", e.getMessage());
        }
        return ResponseEntity.ok("Processed");
    }
}
