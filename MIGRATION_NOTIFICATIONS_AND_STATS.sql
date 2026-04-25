-- MIGRATION: Add Notifications System and Fix Team Statistics Policies

-- 1. Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('invite', 'match_update', 'tournament_update', 'system')),
  title text NOT NULL,
  message text NOT NULL,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 2. Enable RLS and Add Policies for Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own notifications" ON notifications;
CREATE POLICY "Users view own notifications" ON notifications FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (is_read = true);

DROP POLICY IF EXISTS "System insert notifications" ON notifications;
CREATE POLICY "System insert notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (true);

-- 3. Add Indexes for Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- 4. Fix Team Statistics Policies (Allow owners to update)
DROP POLICY IF EXISTS "Team owners manage team stats" ON team_statistics;
CREATE POLICY "Team owners manage team stats" ON team_statistics FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM teams WHERE id = team_id AND owner_id = auth.uid()) OR is_admin()
) WITH CHECK (
    EXISTS (SELECT 1 FROM teams WHERE id = team_id AND owner_id = auth.uid()) OR is_admin()
);
