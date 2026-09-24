-- ==========================================================
-- Flyway Migration: V3__enable_rls.sql
-- Enables Row Level Security to resolve Supabase security alerts
-- ==========================================================

-- By enabling RLS without adding any permissive policies, we default to "Deny All" 
-- for the public anonymous Supabase Data API.
-- Our Spring Boot backend connects via JDBC using the privileged database role,
-- which automatically bypasses RLS, so our app will continue to function normally.

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_events ENABLE ROW LEVEL SECURITY;
