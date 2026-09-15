package com.triageiq.service;

import com.triageiq.repository.TicketRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MetricsService {

    private final TicketRepository ticketRepository;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MetricsDto {
        private long total_tickets;
        private long open_count;
        private long resolved_count;
        private long escalated_count;
        private double avg_resolution_minutes;
        private long p0_count;
        private long p1_count;
        private long p2_count;
        private long p3_count;
        private String top_category;
        private double ai_confidence_avg;
    }

    @Transactional(readOnly = true)
    public MetricsDto getMetrics() {
        long total = ticketRepository.count();
        long open = ticketRepository.countByStatus("open") + ticketRepository.countByStatus("in_progress");
        long resolved = ticketRepository.countByStatus("resolved");
        long escalated = ticketRepository.countByStatus("escalated");

        long p0 = ticketRepository.countByPriority("P0");
        long p1 = ticketRepository.countByPriority("P1");
        long p2 = ticketRepository.countByPriority("P2");
        long p3 = ticketRepository.countByPriority("P3");

        Double avgConfidence = null;
        try {
            avgConfidence = ticketRepository.getAverageAiConfidence();
        } catch (Exception ignored) {}

        Double avgResMin = null;
        try {
            avgResMin = ticketRepository.getAverageResolutionMinutes();
        } catch (Exception ignored) {}

        String topCat = null;
        try {
            topCat = ticketRepository.getTopCategory();
        } catch (Exception ignored) {}

        return MetricsDto.builder()
            .total_tickets(total)
            .open_count(open)
            .resolved_count(resolved)
            .escalated_count(escalated)
            .avg_resolution_minutes(avgResMin != null ? Math.round(avgResMin * 10.0) / 10.0 : 0.0)
            .p0_count(p0)
            .p1_count(p1)
            .p2_count(p2)
            .p3_count(p3)
            .top_category(topCat != null ? topCat : "None")
            .ai_confidence_avg(avgConfidence != null ? Math.round(avgConfidence * 100.0) / 100.0 : 0.0)
            .build();
    }
}
