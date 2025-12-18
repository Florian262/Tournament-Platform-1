/*
  # Arena Platform - Engagement, Profiles, and Admin Features

  ## Overview
  This migration adds critical features for competitor engagement, public profiles,
  match result submission, check-in system, and admin controls.

  ## New Tables

  ### 1. check_ins
  Tournament participant check-in tracking
  - `id` (uuid, PK) - Check-in record identifier
  - `tournament_id` (uuid, FK) - Tournament reference
  - `participant_id` (uuid, FK) - Participant reference
  - `checked_in_at` (timestamptz) - When user checked in
  - `checked_in_by` (uuid, FK) - User who checked in (self or organizer)

  ### 2. player_statistics
  Cached statistics for performance and quick retrieval
  - `id` (uuid, PK) - Statistics record
  - `user_id` (uuid, FK) - Player reference
  - `total_tournaments` (int) - Tournament participation count
  - `total_wins` (int) - Total match wins
  - `total_losses` (int) - Total match losses
  - `total_prizes` (decimal) - Prize money won (in USD equivalent)
  - `win_rate` (decimal) - Win percentage (0.0-1.0)
  - `last_updated` (timestamptz) - Cache timestamp

  ### 3. team_statistics
  Cached team performance metrics
  - `id` (uuid, PK) - Statistics record
  - `team_id` (uuid, FK) - Team reference
  - `total_tournaments` (int) - Tournament participation count
  - `total_wins` (int) - Total match wins
  - `total_losses` (int) - Total match losses
  - `total_prizes` (decimal) - Prize money won
  - `win_rate` (decimal) - Win percentage
  - `member_count` (int) - Current team members
  - `last_updated` (timestamptz) - Cache timestamp

  ### 4. audit_logs
  Immutable event log for critical actions
  - `id` (uuid, PK) - Log entry identifier
  - `action` (text) - Action type
  - `actor_id` (uuid, FK) - User performing action
  - `subject_id` (uuid, FK, nullable) - User being acted upon
  - `resource_type` (text) - Type of resource (tournament, user, match)
  - `resource_id` (uuid) - Resource identifier
  - `details` (jsonb) - Additional action details
  - `ip_address` (text, nullable) - Request IP
  - `created_at` (timestamptz) - Immutable timestamp

  ## Modified Tables

  ### 1. user_profiles (additions)
  - `is_banned` (boolean) - Account ban status
  - `ban_reason` (text, nullable) - Reason for ban
  - `banned_at` (timestamptz, nullable) - When banned
  - `banned_by` (uuid, nullable) - Admin who banned user
  - `display_stats` (boolean) - Public profile visibility

  ### 2. match_results (additions)
  - `verified_by` (uuid, nullable) - Admin who verified result
  - `verified_at` (timestamptz, nullable) - When verified
  - `is_disputed` (boolean) - Result dispute flag
  - `dispute_reason` (text, nullable) - Why result is disputed

  ### 3. tournaments (additions)
  - `checkin_window_minutes` (int) - Minutes before start for check-ins
  - `requires_checkin` (boolean) - If check-in is mandatory
  - `allow_result_submission` (text) - Who can submit: 'organizer_only' or 'participants'

  ### 4. teams (additions)
  - `description` (text) - Public team description
  - `created_at` already exists

  ## Security
  - RLS on all new tables
  - Audit logs immutable (no updates/deletes)
  - Admin-only access to user management
  - Players/teams control their own profiles
*/

-- Add columns to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'is_banned'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN is_banned boolean DEFAULT false;
    ALTER TABLE user_profiles ADD COLUMN ban_reason text;
    ALTER TABLE user_profiles ADD COLUMN banned_at timestamptz;
    ALTER TABLE user_profiles ADD COLUMN banned_by uuid REFERENCES user_profiles(id);
    ALTER TABLE user_profiles ADD COLUMN display_stats boolean DEFAULT true;
  END IF;
END $$;

-- Add columns to tournaments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tournaments' AND column_name = 'checkin_window_minutes'
  ) THEN
    ALTER TABLE tournaments ADD COLUMN checkin_window_minutes int DEFAULT 30;
    ALTER TABLE tournaments ADD COLUMN requires_checkin boolean DEFAULT true;
    ALTER TABLE tournaments ADD COLUMN allow_result_submission text DEFAULT 'organizer_only' CHECK (allow_result_submission IN ('organizer_only', 'participants'));
  END IF;
END $$;

-- Add columns to teams
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'description'
  ) THEN
    ALTER TABLE teams ADD COLUMN description text;
  END IF;
END $$;

-- Add columns to match_results
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'match_results' AND column_name = 'verified_by'
  ) THEN
    ALTER TABLE match_results ADD COLUMN verified_by uuid REFERENCES user_profiles(id);
    ALTER TABLE match_results ADD COLUMN verified_at timestamptz;
    ALTER TABLE match_results ADD COLUMN is_disputed boolean DEFAULT false;
    ALTER TABLE match_results ADD COLUMN dispute_reason text;
  END IF;
END $$;

-- Create check_ins table
CREATE TABLE IF NOT EXISTS check_ins (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES tournament_participants(id) ON DELETE CASCADE,
  checked_in_at timestamptz DEFAULT now(),
  checked_in_by uuid NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tournament_id, participant_id)
);

ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Check-ins are viewable by everyone"
  ON check_ins FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Participants can check themselves in"
  ON check_ins FOR INSERT
  TO authenticated
  WITH CHECK (checked_in_by = auth.uid());

CREATE POLICY "Organizers can check-in participants"
  ON check_ins FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tournaments
      WHERE tournaments.id = check_ins.tournament_id
      AND tournaments.organizer_id = auth.uid()
    )
  );

-- Create player_statistics table
CREATE TABLE IF NOT EXISTS player_statistics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  total_tournaments int DEFAULT 0,
  total_wins int DEFAULT 0,
  total_losses int DEFAULT 0,
  total_prizes decimal(12, 2) DEFAULT 0,
  win_rate decimal(4, 3) DEFAULT 0,
  last_updated timestamptz DEFAULT now()
);

ALTER TABLE player_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Player stats are viewable by everyone"
  ON player_statistics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can update stats"
  ON player_statistics FOR ALL
  TO authenticated
  USING (true);

-- Create team_statistics table
CREATE TABLE IF NOT EXISTS team_statistics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id uuid UNIQUE NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  total_tournaments int DEFAULT 0,
  total_wins int DEFAULT 0,
  total_losses int DEFAULT 0,
  total_prizes decimal(12, 2) DEFAULT 0,
  win_rate decimal(4, 3) DEFAULT 0,
  member_count int DEFAULT 0,
  last_updated timestamptz DEFAULT now()
);

ALTER TABLE team_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team stats are viewable by everyone"
  ON team_statistics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can update stats"
  ON team_statistics FOR ALL
  TO authenticated
  USING (true);

-- Create audit_logs table (immutable)
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  action text NOT NULL,
  actor_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  subject_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  resource_type text NOT NULL,
  resource_id uuid NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Prevent audit log modifications
CREATE POLICY "Audit logs cannot be modified"
  ON audit_logs FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "Audit logs cannot be deleted"
  ON audit_logs FOR DELETE
  TO authenticated
  USING (false);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_check_ins_tournament ON check_ins(tournament_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_participant ON check_ins(participant_id);
CREATE INDEX IF NOT EXISTS idx_player_statistics_user ON player_statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_team_statistics_team ON team_statistics(team_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_banned ON user_profiles(is_banned);
