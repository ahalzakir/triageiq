package com.triageiq.service;

import com.triageiq.model.Agent;
import com.triageiq.model.Team;
import com.triageiq.model.Ticket;
import com.triageiq.model.TicketEvent;
import com.triageiq.repository.AgentRepository;
import com.triageiq.repository.TeamRepository;
import com.triageiq.repository.TicketEventRepository;
import com.triageiq.repository.TicketRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketEventRepository ticketEventRepository;
    private final TeamRepository teamRepository;
    private final AgentRepository agentRepository;
    private final GeminiTriageService geminiTriageService;
    private final SlackService slackService;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TicketCreateRequest {
        private String title;
        private String body;
        private String submitted_by;
        private String source;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TicketDetailDto {
        private Ticket ticket;
        private List<TicketEvent> events;
    }

    @Transactional
    public Ticket createTicket(TicketCreateRequest request) {
        String source = (request.getSource() != null && !request.getSource().isBlank())
            ? request.getSource().toLowerCase()
            : "web";

        // 1. Call Gemini AI Triage
        GeminiTriageService.TriageResponse triage = geminiTriageService.triageTicket(request.getTitle(), request.getBody());
        String priority = triage.getPriority() != null ? triage.getPriority().toUpperCase() : "P2";
        String category = triage.getCategory() != null ? triage.getCategory().toLowerCase() : "other";

        // 2. Compute SLA Deadline
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime slaDeadline = computeSlaDeadline(now, priority);

        // 3. Find matching team
        Team assignedTeam = teamRepository.findByCategorySpecialtyIgnoreCase(category)
            .orElseGet(() -> teamRepository.findByNameIgnoreCase("General IT")
                .orElseGet(() -> teamRepository.findAll().stream().findFirst().orElse(null)));

        // 4. Assign lowest-load agent in matching team
        Agent assignedAgent = null;
        if (assignedTeam != null) {
            List<Agent> agents = agentRepository.findByTeamIdOrderByCurrentLoadAsc(assignedTeam.getId());
            if (!agents.isEmpty()) {
                assignedAgent = agents.get(0);
            }
        }
        if (assignedAgent == null) {
            // Global lowest load agent fallback
            List<Agent> fallbackAgents = agentRepository.findAllByOrderByCurrentLoadAsc();
            if (!fallbackAgents.isEmpty()) {
                assignedAgent = fallbackAgents.get(0);
                if (assignedTeam == null) {
                    assignedTeam = assignedAgent.getTeam();
                }
            }
        }

        if (assignedAgent != null) {
            assignedAgent.setCurrentLoad(assignedAgent.getCurrentLoad() + 1);
            agentRepository.save(assignedAgent);
        }

        // 5. Persist Ticket
        Ticket ticket = Ticket.builder()
            .title(request.getTitle())
            .body(request.getBody())
            .submittedBy(request.getSubmitted_by())
            .source(source)
            .status("open")
            .priority(priority)
            .category(category)
            .assignedTeam(assignedTeam)
            .assignedAgent(assignedAgent)
            .aiConfidence(triage.getConfidence())
            .aiReasoning(triage.getReasoning())
            .slaDeadline(slaDeadline)
            .build();

        Ticket savedTicket = ticketRepository.save(ticket);

        // 6. Write 'created' and 'assigned' ticket events
        TicketEvent createdEvent = TicketEvent.builder()
            .ticket(savedTicket)
            .eventType("created")
            .actor("system")
            .notes(String.format("Ticket submitted via %s by %s. AI Triage: %s (%s, %.0f%% conf)",
                source, request.getSubmitted_by(), priority, category, (triage.getConfidence() != null ? triage.getConfidence() * 100 : 0)))
            .build();
        ticketEventRepository.save(createdEvent);

        if (assignedAgent != null) {
            TicketEvent assignedEvent = TicketEvent.builder()
                .ticket(savedTicket)
                .eventType("assigned")
                .actor("system")
                .notes(String.format("Auto-routed to %s (%s) based on lowest load queue",
                    assignedAgent.getName(), assignedTeam != null ? assignedTeam.getName() : "IT"))
                .build();
            ticketEventRepository.save(assignedEvent);
        }

        // 7. If P0 or P1, fire Slack Alert
        if ("P0".equalsIgnoreCase(priority) || "P1".equalsIgnoreCase(priority)) {
            String slackChannel = (assignedTeam != null && assignedTeam.getSlackChannel() != null)
                ? assignedTeam.getSlackChannel()
                : "#it-general";
            slackService.sendAlert(savedTicket, slackChannel, "High-Priority Incident Alert");
        }

        return savedTicket;
    }

    @Transactional(readOnly = true)
    public Page<Ticket> getTickets(String status, String priority, String category, String team, int page, int size) {
        // Enforce default sorting: Priority ASC, CreatedAt DESC
        Sort sort = Sort.by(Sort.Order.asc("priority"), Sort.Order.desc("createdAt"));
        Pageable pageable = PageRequest.of(page, size, sort);

        boolean hasFilter = (status != null && !status.isBlank()) ||
            (priority != null && !priority.isBlank()) ||
            (category != null && !category.isBlank()) ||
            (team != null && !team.isBlank());

        if (hasFilter) {
            String statusParam = (status != null && !status.isBlank()) ? status : null;
            String priorityParam = (priority != null && !priority.isBlank()) ? priority : null;
            String categoryParam = (category != null && !category.isBlank()) ? category : null;
            String teamParam = (team != null && !team.isBlank()) ? team : null;
            return ticketRepository.findFilteredWithAgentAndTeam(statusParam, priorityParam, categoryParam, teamParam, pageable);
        }

        return ticketRepository.findAllWithAgentAndTeam(pageable);
    }

    @Transactional(readOnly = true)
    public TicketDetailDto getTicketWithHistory(UUID ticketId) {
        Ticket ticket = ticketRepository.findByIdWithAgentAndTeam(ticketId)
            .orElseThrow(() -> new NoSuchElementException("Ticket not found with id: " + ticketId));
        List<TicketEvent> events = ticketEventRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
        return new TicketDetailDto(ticket, events);
    }

    @Transactional
    public Ticket reassignTicket(UUID ticketId, UUID newAgentId) {
        Ticket ticket = ticketRepository.findByIdWithAgentAndTeam(ticketId)
            .orElseThrow(() -> new NoSuchElementException("Ticket not found with id: " + ticketId));

        Agent oldAgent = ticket.getAssignedAgent();
        Agent newAgent = agentRepository.findById(newAgentId)
            .orElseThrow(() -> new NoSuchElementException("Agent not found with id: " + newAgentId));

        // Decrement old agent load
        if (oldAgent != null && (ticket.getStatus() == null || !ticket.getStatus().equalsIgnoreCase("resolved"))) {
            oldAgent.setCurrentLoad(Math.max(0, oldAgent.getCurrentLoad() - 1));
            agentRepository.save(oldAgent);
        }

        // Increment new agent load
        if (ticket.getStatus() == null || !ticket.getStatus().equalsIgnoreCase("resolved")) {
            newAgent.setCurrentLoad(newAgent.getCurrentLoad() + 1);
            agentRepository.save(newAgent);
        }

        ticket.setAssignedAgent(newAgent);
        if (newAgent.getTeam() != null) {
            ticket.setAssignedTeam(newAgent.getTeam());
        }
        Ticket saved = ticketRepository.save(ticket);

        TicketEvent event = TicketEvent.builder()
            .ticket(saved)
            .eventType("reassigned")
            .actor("agent")
            .notes(String.format("Reassigned from %s to %s",
                oldAgent != null ? oldAgent.getName() : "Unassigned", newAgent.getName()))
            .build();
        ticketEventRepository.save(event);

        return saved;
    }

    @Transactional
    public Ticket updateStatus(UUID ticketId, String newStatus, String notes, String actor) {
        Ticket ticket = ticketRepository.findByIdWithAgentAndTeam(ticketId)
            .orElseThrow(() -> new NoSuchElementException("Ticket not found with id: " + ticketId));

        String prevStatus = ticket.getStatus();
        ticket.setStatus(newStatus);

        if ("resolved".equalsIgnoreCase(newStatus) && !"resolved".equalsIgnoreCase(prevStatus)) {
            Agent agent = ticket.getAssignedAgent();
            if (agent != null) {
                agent.setCurrentLoad(Math.max(0, agent.getCurrentLoad() - 1));
                agentRepository.save(agent);
            }
            ticket.setResolvedAt(OffsetDateTime.now());
        }

        Ticket saved = ticketRepository.save(ticket);

        String eventType = "resolved".equalsIgnoreCase(newStatus) ? "resolved" : "commented";
        TicketEvent event = TicketEvent.builder()
            .ticket(saved)
            .eventType(eventType)
            .actor(actor != null && !actor.isBlank() ? actor : "system")
            .notes(notes != null && !notes.isBlank() ? notes : ("Status updated to " + newStatus))
            .build();
        ticketEventRepository.save(event);

        return saved;
    }

    @Transactional
    public Ticket escalateTicket(UUID ticketId, String actor, String escalationReason) {
        Ticket ticket = ticketRepository.findByIdWithAgentAndTeam(ticketId)
            .orElseThrow(() -> new NoSuchElementException("Ticket not found with id: " + ticketId));

        String oldPriority = ticket.getPriority() != null ? ticket.getPriority() : "P2";
        String newPriority = switch (oldPriority.toUpperCase()) {
            case "P3" -> "P2";
            case "P2" -> "P1";
            case "P1", "P0" -> "P0";
            default -> "P1";
        };

        ticket.setPriority(newPriority);
        ticket.setStatus("escalated");
        // Recompute SLA from current moment
        ticket.setSlaDeadline(computeSlaDeadline(OffsetDateTime.now(), newPriority));

        Ticket saved = ticketRepository.save(ticket);

        TicketEvent event = TicketEvent.builder()
            .ticket(saved)
            .eventType("escalated")
            .actor(actor != null && !actor.isBlank() ? actor : "system")
            .notes(escalationReason != null && !escalationReason.isBlank()
                ? escalationReason
                : String.format("Escalated from %s to %s", oldPriority, newPriority))
            .build();
        ticketEventRepository.save(event);

        // Fire Slack Alert
        String channel = (ticket.getAssignedTeam() != null && ticket.getAssignedTeam().getSlackChannel() != null)
            ? ticket.getAssignedTeam().getSlackChannel()
            : "#it-general";
        slackService.sendAlert(saved, channel, "ESCALATION: " + (escalationReason != null ? escalationReason : "Priority Bump"));

        return saved;
    }

    public static OffsetDateTime computeSlaDeadline(OffsetDateTime baseTime, String priority) {
        if (priority == null) return baseTime.plusHours(24);
        return switch (priority.toUpperCase()) {
            case "P0" -> baseTime.plusMinutes(15);
            case "P1" -> baseTime.plusHours(2);
            case "P2" -> baseTime.plusHours(24);
            case "P3" -> baseTime.plusHours(72);
            default -> baseTime.plusHours(24);
        };
    }
}
