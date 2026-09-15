export type Priority = 'P0' | 'P1' | 'P2' | 'P3';
export type TicketStatus = 'open' | 'in_progress' | 'escalated' | 'resolved';
export type Category = 'hardware' | 'access' | 'software' | 'network' | 'hr_adjacent' | 'other';
export type Source = 'web' | 'slack' | 'gmail';

export interface Team {
  id: string;
  name: string;
  category_specialty?: string;
  categorySpecialty?: string;
  slack_channel?: string;
  slackChannel?: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  team?: Team;
  current_load?: number;
  currentLoad?: number;
}

export interface Ticket {
  id: string;
  title: string;
  body: string;
  submitted_by?: string;
  submittedBy?: string;
  source: Source;
  status: TicketStatus;
  priority: Priority;
  category: Category;
  assigned_team?: string;
  assigned_team_id?: string;
  assignedTeam?: Team;
  assigned_agent?: string;
  assigned_agent_id?: string;
  assignedAgent?: Agent;
  ai_confidence?: number;
  aiConfidence?: number;
  ai_reasoning?: string;
  aiReasoning?: string;
  sla_deadline?: string;
  slaDeadline?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  resolved_at?: string | null;
  resolvedAt?: string | null;
}

export interface TicketEvent {
  id: string;
  ticket_id?: string;
  event_type: 'created' | 'assigned' | 'reassigned' | 'escalated' | 'commented' | 'resolved';
  actor: string;
  notes: string;
  created_at?: string;
  createdAt?: string;
}

export interface TicketDetail {
  ticket: Ticket;
  events: TicketEvent[];
}

export interface Metrics {
  total_tickets: number;
  open_count: number;
  resolved_count: number;
  escalated_count: number;
  avg_resolution_minutes: number;
  p0_count: number;
  p1_count: number;
  p2_count: number;
  p3_count: number;
  top_category: string;
  ai_confidence_avg: number;
}

export interface CreateTicketPayload {
  title: string;
  body: string;
  submitted_by: string;
  source?: string;
}
