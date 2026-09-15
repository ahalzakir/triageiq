package com.triageiq.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tickets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @Column(name = "submitted_by", nullable = false)
    private String submittedBy;

    @Column(nullable = false)
    @Builder.Default
    private String source = "web";

    @Column(nullable = false)
    @Builder.Default
    private String status = "open";

    private String priority;

    private String category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_team_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Team assignedTeam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_agent_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Agent assignedAgent;

    @Column(name = "ai_confidence")
    private Float aiConfidence;

    @Column(name = "ai_reasoning", columnDefinition = "TEXT")
    private String aiReasoning;

    @Column(name = "sla_deadline")
    private OffsetDateTime slaDeadline;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @Column(name = "resolved_at")
    private OffsetDateTime resolvedAt;

    @JsonProperty("assigned_agent")
    public String getAssignedAgentName() {
        return assignedAgent != null ? assignedAgent.getName() : null;
    }

    @JsonProperty("assigned_agent_id")
    public UUID getAssignedAgentId() {
        return assignedAgent != null ? assignedAgent.getId() : null;
    }

    @JsonProperty("assigned_team")
    public String getAssignedTeamName() {
        return assignedTeam != null ? assignedTeam.getName() : null;
    }

    @JsonProperty("assigned_team_id")
    public UUID getAssignedTeamId() {
        return assignedTeam != null ? assignedTeam.getId() : null;
    }
}
