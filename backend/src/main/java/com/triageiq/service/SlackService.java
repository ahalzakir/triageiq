package com.triageiq.service;

import com.triageiq.model.Ticket;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.format.DateTimeFormatter;
import java.util.Map;

@Service
@Slf4j
public class SlackService {

    @Value("${slack.bot-token:}")
    private String botToken;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String SLACK_POST_MESSAGE_URL = "https://slack.com/api/chat.postMessage";
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm:ss 'UTC'");

    public void sendAlert(Ticket ticket, String channel, String actionPrefix) {
        if (botToken == null || botToken.isBlank() || botToken.startsWith("xoxb-...") || botToken.equals("xoxb-your-slack-bot-token")) {
            log.info("[SLACK SIMULATOR] Token not set. Simulated Slack alert to channel {}: {} [{}] {}",
                    channel, actionPrefix, ticket.getPriority(), ticket.getTitle());
            return;
        }

        try {
            String deadlineStr = ticket.getSlaDeadline() != null
                ? ticket.getSlaDeadline().format(FORMATTER)
                : "None";

            String message = String.format(
                "🚨 *[%s] %s: %s*\nCategory: %s | Assigned: %s\nSLA Deadline: %s\nSubmitted by: %s",
                ticket.getPriority(),
                actionPrefix != null ? actionPrefix : "New Ticket",
                ticket.getTitle(),
                ticket.getCategory(),
                ticket.getAssignedAgentName() != null ? ticket.getAssignedAgentName() : "Unassigned",
                deadlineStr,
                ticket.getSubmittedBy()
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(botToken);

            Map<String, Object> payload = Map.of(
                "channel", channel,
                "text", message
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(SLACK_POST_MESSAGE_URL, entity, String.class);

            log.info("Posted Slack alert to {} with response: {}", channel, response.getStatusCode());
        } catch (Exception e) {
            log.error("Failed to post Slack alert to {}: {}", channel, e.getMessage());
        }
    }
}
