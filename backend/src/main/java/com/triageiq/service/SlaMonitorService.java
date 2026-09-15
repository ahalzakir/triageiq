package com.triageiq.service;

import com.triageiq.model.Ticket;
import com.triageiq.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SlaMonitorService {

    private final TicketRepository ticketRepository;
    private final TicketService ticketService;

    /**
     * Runs every 5 minutes to detect SLA breaches and auto-escalate idempotently.
     */
    @Scheduled(fixedRate = 300000)
    public void monitorSlaBreaches() {
        OffsetDateTime now = OffsetDateTime.now();
        List<Ticket> breachedTickets = ticketRepository.findBreachedTickets(now);

        if (breachedTickets.isEmpty()) {
            log.debug("SLA Monitor check completed: 0 breached tickets.");
            return;
        }

        log.warn("SLA Monitor: detected {} breached tickets. Auto-escalating...", breachedTickets.size());

        for (Ticket ticket : breachedTickets) {
            try {
                ticketService.escalateTicket(ticket.getId(), "system", "Auto-escalated: SLA breach");
                log.info("Successfully escalated breached ticket id: {}", ticket.getId());
            } catch (Exception e) {
                log.error("Failed to auto-escalate breached ticket id {}: {}", ticket.getId(), e.getMessage());
            }
        }
    }
}
