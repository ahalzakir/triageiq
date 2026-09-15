package com.triageiq.controller;

import com.triageiq.model.Ticket;
import com.triageiq.service.TicketService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @Data
    public static class AssignRequest {
        private UUID agent_id;
    }

    @Data
    public static class StatusRequest {
        private String status;
        private String notes;
        private String actor;
    }

    @Data
    public static class EscalateRequest {
        private String notes;
        private String actor;
    }

    @PostMapping
    public ResponseEntity<Ticket> createTicket(@RequestBody TicketService.TicketCreateRequest request) {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new IllegalArgumentException("Ticket title cannot be empty");
        }
        if (request.getBody() == null || request.getBody().isBlank()) {
            throw new IllegalArgumentException("Ticket body cannot be empty");
        }
        if (request.getSubmitted_by() == null || request.getSubmitted_by().isBlank()) {
            throw new IllegalArgumentException("Submitted_by cannot be empty");
        }

        Ticket created = ticketService.createTicket(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<Page<Ticket>> getTickets(
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String priority,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String team,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Page<Ticket> result = ticketService.getTickets(status, priority, category, team, page, size);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketService.TicketDetailDto> getTicketById(@PathVariable UUID id) {
        TicketService.TicketDetailDto detail = ticketService.getTicketWithHistory(id);
        return ResponseEntity.ok(detail);
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<Ticket> assignTicket(
        @PathVariable UUID id,
        @RequestBody AssignRequest request
    ) {
        if (request.getAgent_id() == null) {
            throw new IllegalArgumentException("agent_id must be provided");
        }
        Ticket updated = ticketService.reassignTicket(id, request.getAgent_id());
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Ticket> updateStatus(
        @PathVariable UUID id,
        @RequestBody StatusRequest request
    ) {
        if (request.getStatus() == null || request.getStatus().isBlank()) {
            throw new IllegalArgumentException("status must be provided");
        }
        Ticket updated = ticketService.updateStatus(id, request.getStatus(), request.getNotes(), request.getActor());
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/escalate")
    public ResponseEntity<Ticket> escalateTicket(
        @PathVariable UUID id,
        @RequestBody(required = false) EscalateRequest request
    ) {
        String actor = request != null && request.getActor() != null ? request.getActor() : "agent";
        String notes = request != null && request.getNotes() != null ? request.getNotes() : "Manual priority escalation";
        Ticket updated = ticketService.escalateTicket(id, actor, notes);
        return ResponseEntity.ok(updated);
    }
}
