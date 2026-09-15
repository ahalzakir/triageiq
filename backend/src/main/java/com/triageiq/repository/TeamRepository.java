package com.triageiq.repository;

import com.triageiq.model.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeamRepository extends JpaRepository<Team, UUID> {
    Optional<Team> findByCategorySpecialtyIgnoreCase(String categorySpecialty);
    Optional<Team> findByNameIgnoreCase(String name);
}
