import { apiClient } from './client';
import { Ticket, TicketDetail, Agent, Team, Metrics, CreateTicketPayload } from '../types/ticket';

export const ticketApi = {
  createTicket: async (payload: CreateTicketPayload): Promise<Ticket> => {
    const res = await apiClient.post<Ticket>('/api/tickets', payload);
    return res.data;
  },

  getTickets: async (params: {
    status?: string;
    priority?: string;
    category?: string;
    team?: string;
    page?: number;
    size?: number;
  } = {}) => {
    const res = await apiClient.get('/api/tickets', { params });
    return res.data;
  },

  getTicketById: async (id: string): Promise<TicketDetail> => {
    const res = await apiClient.get<TicketDetail>(`/api/tickets/${id}`);
    return res.data;
  },

  assignTicket: async (ticketId: string, agentId: string): Promise<Ticket> => {
    const res = await apiClient.put<Ticket>(`/api/tickets/${ticketId}/assign`, {
      agent_id: agentId,
    });
    return res.data;
  },

  updateStatus: async (
    ticketId: string,
    status: string,
    notes?: string,
    actor?: string
  ): Promise<Ticket> => {
    const res = await apiClient.put<Ticket>(`/api/tickets/${ticketId}/status`, {
      status,
      notes,
      actor: actor || 'agent',
    });
    return res.data;
  },

  escalateTicket: async (
    ticketId: string,
    notes?: string,
    actor?: string
  ): Promise<Ticket> => {
    const res = await apiClient.put<Ticket>(`/api/tickets/${ticketId}/escalate`, {
      notes: notes || 'Manual escalation',
      actor: actor || 'agent',
    });
    return res.data;
  },

  getAgents: async (): Promise<Agent[]> => {
    const res = await apiClient.get<Agent[]>('/api/agents');
    return res.data;
  },

  getTeams: async (): Promise<Team[]> => {
    const res = await apiClient.get<Team[]>('/api/teams');
    return res.data;
  },

  getMetrics: async (): Promise<Metrics> => {
    const res = await apiClient.get<Metrics>('/api/metrics');
    return res.data;
  },
};
