/*
  # Arena - Unified Database Schema
  This script creates the entire database structure for the Arena Esports Platform.
  It includes all tables, constraints, RLS policies, indexes, and initial data.
  
  Run this in your Supabase SQL Editor.
*/

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

-- User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'competitor' CHECK (role IN ('competitor', 'organizer', 'admin')),
  bio text,
  region text,
  is_banned boolean DEFAULT false,
  ban_reason text,
  banned_at timestamptz,
  banned_by uuid REFERENCES user_profiles(id),
  display_stats boolean DEFAULT true,
  social_links jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Games
CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  short_name text UNIQUE NOT NULL,
  icon_url text,
  banner_url text,
  platform text NOT NULL CHECK (platform IN ('PC', 'Console', 'Mobile', 'Cross-Platform')),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Teams
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  tag text NOT NULL,
  logo_url text,
  description text,
  owner_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  region text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(name, game_id)
);

-- Team Members
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'player' CHECK (role IN ('captain', 'player', 'substitute')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Team Invites
CREATE TABLE IF NOT EXISTS team_invites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  invited_user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
  role text NOT NULL DEFAULT 'player',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  created_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL
);

-- Tournaments
CREATE TABLE IF NOT EXISTS tournaments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  organizer_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  banner_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'registration_open', 'running', 'completed', 'cancelled')),
  format text NOT NULL DEFAULT 'single_elimination' CHECK (format IN ('single_elimination', 'double_elimination', 'round_robin')),
  max_participants int NOT NULL DEFAULT 16,
  current_participants int NOT NULL DEFAULT 0,
  participant_type text NOT NULL DEFAULT 'team' CHECK (participant_type IN ('team', 'solo')),
  region text,
  prize_pool text,
  rules text,
  stream_url text,
  registration_start timestamptz,
  registration_end timestamptz,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  checkin_window_minutes int DEFAULT 30,
  requires_checkin boolean DEFAULT true,
  allow_result_submission text DEFAULT 'organizer_only' CHECK (allow_result_submission IN ('organizer_only', 'participants')),
  created_at timestamptz DEFAULT now()
);

-- Tournament Participants
CREATE TABLE IF NOT EXISTS tournament_participants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  seed int,
  status text NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'checked_in', 'eliminated', 'winner')),
  registered_at timestamptz DEFAULT now(),
  CHECK (
    (team_id IS NOT NULL AND user_id IS NULL) OR
    (team_id IS NULL AND user_id IS NOT NULL)
  )
);

-- Check-ins
CREATE TABLE IF NOT EXISTS check_ins (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES tournament_participants(id) ON DELETE CASCADE,
  checked_in_at timestamptz DEFAULT now(),
  checked_in_by uuid NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tournament_id, participant_id)
);

-- Matches
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round int NOT NULL,
  match_number int NOT NULL,
  bracket_position text,
  participant1_id uuid REFERENCES tournament_participants(id) ON DELETE SET NULL,
  participant2_id uuid REFERENCES tournament_participants(id) ON DELETE SET NULL,
  winner_id uuid REFERENCES tournament_participants(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'disputed')),
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  end_time timestamptz, -- Virtual scheduling placeholder
  stream_url text,
  created_at timestamptz DEFAULT now()
);

-- Match Results
CREATE TABLE IF NOT EXISTS match_results (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES tournament_participants(id) ON DELETE CASCADE,
  score int NOT NULL DEFAULT 0,
  stats jsonb DEFAULT '{}'::jsonb,
  submitted_by uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  submitted_at timestamptz DEFAULT now(),
  verified_by uuid REFERENCES user_profiles(id),
  verified_at timestamptz,
  is_disputed boolean DEFAULT false,
  dispute_reason text
);

-- Statistics
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

-- Audit Logs (Immutable)
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

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('invite', 'match_update', 'tournament_update', 'system')),
  title text NOT NULL,
  message text NOT NULL,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL
);

-- Scouting Posts
CREATE TABLE IF NOT EXISTS scouting_posts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type text NOT NULL CHECK (type IN ('player_looking', 'team_vacancy')),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  roles text[] DEFAULT '{}'::text[],
  description text CHECK (char_length(description) <= 200),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'expired')),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Legacy Badges
CREATE TABLE IF NOT EXISTS legacy_badges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  description text,
  icon_url text,
  rarity text NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  created_at timestamptz DEFAULT now()
);

-- User Badges Mapping
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES legacy_badges(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- 3. SECURITY (RLS)

-- Helper function for cleaner policies
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE scouting_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE legacy_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Common Select Policy (Public Reading)
CREATE POLICY "Public read profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Public read games" ON games FOR SELECT USING (true);
CREATE POLICY "Public read teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Public read team members" ON team_members FOR SELECT USING (true);
CREATE POLICY "Public read tournaments" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Public read participants" ON tournament_participants FOR SELECT USING (true);
CREATE POLICY "Public read check-ins" ON check_ins FOR SELECT USING (true);
CREATE POLICY "Public read matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Public read results" ON match_results FOR SELECT USING (true);
CREATE POLICY "Public read player stats" ON player_statistics FOR SELECT USING (true);
CREATE POLICY "Public read team stats" ON team_statistics FOR SELECT USING (true);
CREATE POLICY "Public read scouting posts" ON scouting_posts FOR SELECT USING (status = 'active');
CREATE POLICY "Public read badges" ON legacy_badges FOR SELECT USING (true);
CREATE POLICY "Public read user badges" ON user_badges FOR SELECT USING (true);

-- Admin God Mode Policies
CREATE POLICY "Admins manage all profiles" ON user_profiles FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins manage all tournaments" ON tournaments FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins manage all teams" ON teams FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins manage all matches" ON matches FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins manage all results" ON match_results FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins manage all scouting" ON scouting_posts FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins manage badges" ON legacy_badges FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins manage user badges" ON user_badges FOR ALL TO authenticated USING (is_admin());

-- User Profile Policies
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Team Policies
CREATE POLICY "Team owners can manage teams" ON teams FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Team owners manage members" ON team_members FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM teams WHERE id = team_id AND owner_id = auth.uid()));
CREATE POLICY "Team owners manage team stats" ON team_statistics FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM teams WHERE id = team_id AND owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM teams WHERE id = team_id AND owner_id = auth.uid()));

-- Team Invite Policies
CREATE POLICY "Users can create join requests" ON team_invites FOR INSERT TO authenticated WITH CHECK (auth.uid() = invited_user_id OR auth.uid() = inviter_id);
CREATE POLICY "Relevant users view invites" ON team_invites FOR SELECT TO authenticated USING (
    invited_user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM teams WHERE id = team_id AND owner_id = auth.uid())
);
CREATE POLICY "Owners update invites" ON team_invites FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM teams WHERE id = team_id AND owner_id = auth.uid())) WITH CHECK (status IN ('pending','accepted','rejected'));

-- Scouting Policies
CREATE POLICY "Authenticated users create scouting posts" ON scouting_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners manage own scouting posts" ON scouting_posts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Notification Policies
CREATE POLICY "Users view relevant notifications" ON notifications FOR SELECT TO authenticated USING (user_id = auth.uid() OR created_by = auth.uid());
CREATE POLICY "Users can send notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by OR created_by IS NULL);
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_teams_owner ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_scouting_posts_status ON scouting_posts(status);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);

-- 5. INITIAL DATA
INSERT INTO games (name, short_name, platform, icon_url) VALUES
  ('League of Legends', 'LoL', 'PC', 'https://images.pexels.com/photos/1174732/pexels-photo-1174732.jpeg?auto=compress&cs=tinysrgb&w=200'),
  ('Counter-Strike 2', 'CS2', 'PC', 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=200'),
  ('Valorant', 'Valorant', 'PC', 'https://images.pexels.com/photos/7915437/pexels-photo-7915437.jpeg?auto=compress&cs=tinysrgb&w=200')
ON CONFLICT (name) DO NOTHING;

INSERT INTO legacy_badges (name, description, rarity, icon_url) VALUES
  ('Arena Veteran', 'Participated in over 10 tournaments.', 'rare', 'https://api.dicebear.com/7.x/icons/svg?seed=veteran'),
  ('Flawless Season', 'Won a tournament without dropping a single match.', 'legendary', 'https://api.dicebear.com/7.x/icons/svg?seed=flawless')
ON CONFLICT (name) DO NOTHING;
