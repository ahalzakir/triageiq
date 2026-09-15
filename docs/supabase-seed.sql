-- ==========================================================
-- Supabase Seed Data Setup
-- Can be pasted directly into Supabase SQL Editor
-- ==========================================================

-- Insert Teams
INSERT INTO teams (id, name, category_specialty, slack_channel)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Hardware Support', 'hardware', '#it-hardware'),
    ('a0000000-0000-0000-0000-000000000002', 'Access & Identity', 'access', '#it-access'),
    ('a0000000-0000-0000-0000-000000000003', 'Software Support', 'software', '#it-software'),
    ('a0000000-0000-0000-0000-000000000004', 'Network Operations', 'network', '#it-network'),
    ('a0000000-0000-0000-0000-000000000005', 'General IT', 'other', '#it-general')
ON CONFLICT (id) DO NOTHING;

-- Insert Agents
INSERT INTO agents (id, name, email, team_id, current_load)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'Alex Chen', 'alex.chen@company.internal', 'a0000000-0000-0000-0000-000000000001', 0),
    ('b0000000-0000-0000-0000-000000000002', 'Priya Patel', 'priya.patel@company.internal', 'a0000000-0000-0000-0000-000000000001', 0),
    ('b0000000-0000-0000-0000-000000000003', 'Jordan Miller', 'jordan.miller@company.internal', 'a0000000-0000-0000-0000-000000000002', 0),
    ('b0000000-0000-0000-0000-000000000004', 'Fatima Al-Zahra', 'fatima.al-zahra@company.internal', 'a0000000-0000-0000-0000-000000000002', 0),
    ('b0000000-0000-0000-0000-000000000005', 'Marcus Vance', 'marcus.vance@company.internal', 'a0000000-0000-0000-0000-000000000003', 0),
    ('b0000000-0000-0000-0000-000000000006', 'Elena Rostova', 'elena.rostova@company.internal', 'a0000000-0000-0000-0000-000000000003', 0),
    ('b0000000-0000-0000-0000-000000000007', 'David Kim', 'david.kim@company.internal', 'a0000000-0000-0000-0000-000000000004', 0),
    ('b0000000-0000-0000-0000-000000000008', 'Sarah Jenkins', 'sarah.jenkins@company.internal', 'a0000000-0000-0000-0000-000000000004', 0),
    ('b0000000-0000-0000-0000-000000000009', 'Liam O''Connor', 'liam.oconnor@company.internal', 'a0000000-0000-0000-0000-000000000005', 0),
    ('b0000000-0000-0000-0000-000000000010', 'Maya Lin', 'maya.lin@company.internal', 'a0000000-0000-0000-0000-000000000005', 0)
ON CONFLICT (id) DO NOTHING;
