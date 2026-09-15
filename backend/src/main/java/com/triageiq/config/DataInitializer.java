package com.triageiq.config;

import com.triageiq.model.Agent;
import com.triageiq.model.Team;
import com.triageiq.repository.AgentRepository;
import com.triageiq.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
@Profile("local")
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final TeamRepository teamRepository;
    private final AgentRepository agentRepository;

    @Override
    public void run(String... args) {
        if (teamRepository.count() > 0) {
            return;
        }

        log.info("Initializing in-memory seed data for local development...");

        Team hw = teamRepository.save(Team.builder()
            .name("Hardware Support")
            .categorySpecialty("hardware")
            .slackChannel("#it-hardware")
            .build());

        Team access = teamRepository.save(Team.builder()
            .name("Access & Identity")
            .categorySpecialty("access")
            .slackChannel("#it-access")
            .build());

        Team sw = teamRepository.save(Team.builder()
            .name("Software Support")
            .categorySpecialty("software")
            .slackChannel("#it-software")
            .build());

        Team net = teamRepository.save(Team.builder()
            .name("Network Operations")
            .categorySpecialty("network")
            .slackChannel("#it-network")
            .build());

        Team gen = teamRepository.save(Team.builder()
            .name("General IT")
            .categorySpecialty("other")
            .slackChannel("#it-general")
            .build());

        agentRepository.saveAll(List.of(
            Agent.builder().name("Alex Chen").email("alex.chen@company.internal").team(hw).currentLoad(0).build(),
            Agent.builder().name("Priya Patel").email("priya.patel@company.internal").team(hw).currentLoad(0).build(),
            Agent.builder().name("Jordan Miller").email("jordan.miller@company.internal").team(access).currentLoad(0).build(),
            Agent.builder().name("Fatima Al-Zahra").email("fatima.al-zahra@company.internal").team(access).currentLoad(0).build(),
            Agent.builder().name("Marcus Vance").email("marcus.vance@company.internal").team(sw).currentLoad(0).build(),
            Agent.builder().name("Elena Rostova").email("elena.rostova@company.internal").team(sw).currentLoad(0).build(),
            Agent.builder().name("David Kim").email("david.kim@company.internal").team(net).currentLoad(0).build(),
            Agent.builder().name("Sarah Jenkins").email("sarah.jenkins@company.internal").team(net).currentLoad(0).build(),
            Agent.builder().name("Liam O'Connor").email("liam.oconnor@company.internal").team(gen).currentLoad(0).build(),
            Agent.builder().name("Maya Lin").email("maya.lin@company.internal").team(gen).currentLoad(0).build()
        ));

        log.info("In-memory seed data initialized: 5 teams, 10 agents.");
    }
}
