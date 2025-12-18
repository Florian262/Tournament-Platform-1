-- Migration: Add team_invites table and policies for invite-based joins
-- Run this in your Supabase/Postgres environment

BEGIN;

CREATE TABLE IF NOT EXISTS team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  invited_user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
  role text NOT NULL DEFAULT 'player',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz
);

ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

-- Allow users to create an invite request for themselves (join request)
CREATE POLICY "Users can request to join teams (create)" ON team_invites
  FOR INSERT
  WITH CHECK (auth.uid() = invited_user_id OR auth.uid() = inviter_id);

-- Allow invite owners (team owners) and admins to view invites
CREATE POLICY "Team owners and admins can view invites" ON team_invites
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = team_invites.team_id AND teams.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = team_invites.team_id AND team_members.user_id = auth.uid() AND team_members.role = 'captain')
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow team owners and admins to update invite status
CREATE POLICY "Team owners and admins can update invites" ON team_invites
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = team_invites.team_id AND teams.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = team_invites.team_id AND team_members.user_id = auth.uid() AND team_members.role = 'captain')
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (status IN ('pending','accepted','rejected'));

-- Allow users to see their own invites
CREATE POLICY "Users can view their own invites" ON team_invites
  FOR SELECT USING (invited_user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_team_invites_team ON team_invites(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_user ON team_invites(invited_user_id);

COMMIT;
