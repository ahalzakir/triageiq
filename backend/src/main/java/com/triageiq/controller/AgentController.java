package com.triageiq.controller;

import com.triageiq.model.Agent;
import com.triageiq.model.Team;
import com.triageiq.repository.AgentRepository;
import com.triageiq.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AgentController {

    private final AgentRepository agentRepository;
    private final TeamRepository teamRepository;

    @GetMapping("/agents")
    public ResponseEntity<List<Agent>> getAgents() {
        List<Agent> agents = agentRepository.findAllWithTeamOrderByCurrentLoadAsc();
        return ResponseEntity.ok(agents);
    }

    @GetMapping("/teams")
    public ResponseEntity<List<Team>> getTeams() {
        List<Team> teams = teamRepository.findAll();
        return ResponseEntity.ok(teams);
    }

    @GetMapping("/teams/{teamId}/agents")
    public ResponseEntity<List<Agent>> getAgentsByTeam(@PathVariable UUID teamId) {
        List<Agent> agents = agentRepository.findByTeamIdOrderByCurrentLoadAsc(teamId);
        return ResponseEntity.ok(agents);
    }
}
