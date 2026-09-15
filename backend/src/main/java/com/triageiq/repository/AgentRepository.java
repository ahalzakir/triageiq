package com.triageiq.repository;

import com.triageiq.model.Agent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AgentRepository extends JpaRepository<Agent, UUID> {
    List<Agent> findByTeamIdOrderByCurrentLoadAsc(UUID teamId);

    List<Agent> findAllByOrderByCurrentLoadAsc();

    @Query("SELECT a FROM Agent a LEFT JOIN FETCH a.team ORDER BY a.currentLoad ASC")
    List<Agent> findAllWithTeamOrderByCurrentLoadAsc();

    Optional<Agent> findByNameIgnoreCase(String name);
}
