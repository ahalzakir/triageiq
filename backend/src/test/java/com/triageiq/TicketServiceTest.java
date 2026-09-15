package com.triageiq;

import com.triageiq.model.Agent;
import com.triageiq.model.Team;
import com.triageiq.model.Ticket;
import com.triageiq.repository.AgentRepository;
import com.triageiq.repository.TeamRepository;
import com.triageiq.repository.TicketEventRepository;
import com.triageiq.repository.TicketRepository;
import com.triageiq.service.GeminiTriageService;
import com.triageiq.service.SlackService;
import com.triageiq.service.TicketService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TicketServiceTest {

    @Mock
    private TicketRepository ticketRepository;
    @Mock
    private TicketEventRepository ticketEventRepository;
    @Mock
    private TeamRepository teamRepository;
    @Mock
    private AgentRepository agentRepository;
    @Mock
    private GeminiTriageService geminiTriageService;
    @Mock
    private SlackService slackService;

    @InjectMocks
    private TicketService ticketService;

    private Team hardwareTeam;
    private Agent agent1;
    private Agent agent2;

    @BeforeEach
    void setUp() {
        hardwareTeam = Team.builder()
            .id(UUID.randomUUID())
            .name("Hardware Support")
            .categorySpecialty("hardware")
            .slackChannel("#it-hardware")
            .build();

        agent1 = Agent.builder()
            .id(UUID.randomUUID())
            .name("Alex Chen")
            .team(hardwareTeam)
            .currentLoad(0)
            .build();

        agent2 = Agent.builder()
            .id(UUID.randomUUID())
            .name("Priya Patel")
            .team(hardwareTeam)
            .currentLoad(2)
            .build();
    }

    @Test
    @DisplayName("SLA calculation should accurately add offsets for P0, P1, P2, P3")
    void testComputeSlaDeadline() {
        OffsetDateTime base = OffsetDateTime.now();
        OffsetDateTime p0 = TicketService.computeSlaDeadline(base, "P0");
        OffsetDateTime p1 = TicketService.computeSlaDeadline(base, "P1");
        OffsetDateTime p2 = TicketService.computeSlaDeadline(base, "P2");
        OffsetDateTime p3 = TicketService.computeSlaDeadline(base, "P3");

        assertEquals(base.plusMinutes(15), p0);
        assertEquals(base.plusHours(2), p1);
        assertEquals(base.plusHours(24), p2);
        assertEquals(base.plusHours(72), p3);
    }

    @Test
    @DisplayName("Ticket creation assigns to lowest-load agent and increments load")
    void testCreateTicketAssignsLowestLoadAgent() {
        when(geminiTriageService.triageTicket(any(), any())).thenReturn(
            new GeminiTriageService.TriageResponse("hardware", "P1", 0.95f, "Hardware issue detected.")
        );
        when(teamRepository.findByCategorySpecialtyIgnoreCase("hardware")).thenReturn(Optional.of(hardwareTeam));
        when(agentRepository.findByTeamIdOrderByCurrentLoadAsc(hardwareTeam.getId())).thenReturn(List.of(agent1, agent2));
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TicketService.TicketCreateRequest req = TicketService.TicketCreateRequest.builder()
            .title("MacBook battery swollen")
            .body("My laptop battery has swollen and trackpad is popping out.")
            .submitted_by("employee@company.com")
            .source("web")
            .build();

        Ticket created = ticketService.createTicket(req);

        assertNotNull(created);
        assertEquals("P1", created.getPriority());
        assertEquals("hardware", created.getCategory());
        assertEquals(agent1, created.getAssignedAgent());
        assertEquals(1, agent1.getCurrentLoad(), "Agent currentLoad should be incremented to 1");
        verify(agentRepository).save(agent1);
        verify(ticketEventRepository, times(2)).save(any());
        verify(slackService).sendAlert(any(), eq("#it-hardware"), any());
    }

    @Test
    @DisplayName("Resolving a ticket decrements agent load with Math.max(0, load - 1)")
    void testResolveTicketDecrementsAgentLoad() {
        agent1.setCurrentLoad(3);
        Ticket ticket = Ticket.builder()
            .id(UUID.randomUUID())
            .title("Issue")
            .body("Description")
            .submittedBy("emp")
            .status("open")
            .assignedAgent(agent1)
            .build();

        when(ticketRepository.findByIdWithAgentAndTeam(ticket.getId())).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Ticket resolved = ticketService.updateStatus(ticket.getId(), "resolved", "Fixed problem", "agent");

        assertEquals("resolved", resolved.getStatus());
        assertNotNull(resolved.getResolvedAt());
        assertEquals(2, agent1.getCurrentLoad(), "Agent load should decrement from 3 to 2");
        verify(agentRepository).save(agent1);
    }

    @Test
    @DisplayName("Resolving a ticket when agent load is 0 never becomes negative")
    void testResolveTicketNeverGoesBelowZero() {
        agent1.setCurrentLoad(0);
        Ticket ticket = Ticket.builder()
            .id(UUID.randomUUID())
            .title("Issue")
            .body("Description")
            .submittedBy("emp")
            .status("open")
            .assignedAgent(agent1)
            .build();

        when(ticketRepository.findByIdWithAgentAndTeam(ticket.getId())).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ticketService.updateStatus(ticket.getId(), "resolved", "Fixed", "agent");

        assertEquals(0, agent1.getCurrentLoad(), "Agent load should remain bounded at 0");
    }

    @Test
    @DisplayName("Reassigning updates both old and new agent loads")
    void testReassignTicketUpdatesLoads() {
        agent1.setCurrentLoad(2);
        agent2.setCurrentLoad(1);

        Ticket ticket = Ticket.builder()
            .id(UUID.randomUUID())
            .title("Issue")
            .body("Description")
            .submittedBy("emp")
            .status("open")
            .assignedAgent(agent1)
            .build();

        when(ticketRepository.findByIdWithAgentAndTeam(ticket.getId())).thenReturn(Optional.of(ticket));
        when(agentRepository.findById(agent2.getId())).thenReturn(Optional.of(agent2));
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ticketService.reassignTicket(ticket.getId(), agent2.getId());

        assertEquals(1, agent1.getCurrentLoad(), "Old agent load should decrement from 2 to 1");
        assertEquals(2, agent2.getCurrentLoad(), "New agent load should increment from 1 to 2");
        verify(agentRepository).save(agent1);
        verify(agentRepository).save(agent2);
    }
}
