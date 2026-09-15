package com.triageiq.repository;

import com.triageiq.model.Ticket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, UUID> {

    @Query(
        value = "SELECT t FROM Ticket t LEFT JOIN FETCH t.assignedAgent LEFT JOIN FETCH t.assignedTeam",
        countQuery = "SELECT count(t) FROM Ticket t"
    )
    Page<Ticket> findAllWithAgentAndTeam(Pageable pageable);

    @Query(
        value = "SELECT t FROM Ticket t " +
                "LEFT JOIN FETCH t.assignedAgent " +
                "LEFT JOIN FETCH t.assignedTeam " +
                "WHERE (:status IS NULL OR t.status = :status) " +
                "AND (:priority IS NULL OR t.priority = :priority) " +
                "AND (:category IS NULL OR t.category = :category) " +
                "AND (:teamName IS NULL OR LOWER(t.assignedTeam.name) = LOWER(:teamName) OR LOWER(t.assignedTeam.categorySpecialty) = LOWER(:teamName))",
        countQuery = "SELECT count(t) FROM Ticket t " +
                     "WHERE (:status IS NULL OR t.status = :status) " +
                     "AND (:priority IS NULL OR t.priority = :priority) " +
                     "AND (:category IS NULL OR t.category = :category) " +
                     "AND (:teamName IS NULL OR LOWER(t.assignedTeam.name) = LOWER(:teamName) OR LOWER(t.assignedTeam.categorySpecialty) = LOWER(:teamName))"
    )
    Page<Ticket> findFilteredWithAgentAndTeam(
        @Param("status") String status,
        @Param("priority") String priority,
        @Param("category") String category,
        @Param("teamName") String teamName,
        Pageable pageable
    );

    @Query("SELECT t FROM Ticket t LEFT JOIN FETCH t.assignedAgent LEFT JOIN FETCH t.assignedTeam WHERE t.id = :id")
    Optional<Ticket> findByIdWithAgentAndTeam(@Param("id") UUID id);

    @Query("SELECT t FROM Ticket t LEFT JOIN FETCH t.assignedAgent LEFT JOIN FETCH t.assignedTeam " +
           "WHERE t.status IN ('open', 'in_progress') " +
           "AND t.slaDeadline < :now " +
           "AND t.status != 'escalated'")
    List<Ticket> findBreachedTickets(@Param("now") OffsetDateTime now);

    long countByStatus(String status);

    long countByPriority(String priority);

    @Query("SELECT AVG(t.aiConfidence) FROM Ticket t WHERE t.aiConfidence IS NOT NULL")
    Double getAverageAiConfidence();

    @Query(value = "SELECT category FROM tickets WHERE category IS NOT NULL GROUP BY category ORDER BY count(*) DESC LIMIT 1", nativeQuery = true)
    String getTopCategory();

    @Query(value = "SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/60) FROM tickets WHERE resolved_at IS NOT NULL", nativeQuery = true)
    Double getAverageResolutionMinutes();
}
