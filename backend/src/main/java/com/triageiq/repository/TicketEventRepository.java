package com.triageiq.repository;

import com.triageiq.model.TicketEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TicketEventRepository extends JpaRepository<TicketEvent, UUID> {
    List<TicketEvent> findByTicketIdOrderByCreatedAtAsc(UUID ticketId);
}
