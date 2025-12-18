/*
  # Esports Tournament Management Platform - Database Schema

  ## Overview
  This migration creates the complete database structure for an esports tournament
  management platform supporting both competitors and organizers.

  ## New Tables

  ### 1. user_profiles
  Extended user information linked to auth.users
  - `id` (uuid, FK to auth.users) - User identifier
  - `username` (text, unique) - Display name
  - `full_name` (text) - User's full name
  - `avatar_url` (text) - Profile picture URL
  - `role` (text) - User role: 'competitor' or 'organizer'
  - `bio` (text) - User biography
  - `region` (text) - Geographic region
  - `created_at` (timestamptz) - Profile creation timestamp

  ### 2. games
  Supported esports titles
  - `id` (uuid, PK) - Game identifier
  - `name` (text) - Game title (e.g., "League of Legends")
  - `short_name` (text) - Abbreviated name (e.g., "LoL")
  - `icon_url` (text) - Game icon/logo URL
  - `banner_url` (text) - Game banner image
  - `platform` (text) - Gaming platform (PC, Console, Mobile)
  - `active` (boolean) - Whether game is currently supported

  ### 3. teams
  Competitor teams
  - `id` (uuid, PK) - Team identifier
  - `name` (text) - Team name
  - `tag` (text) - Team tag/abbreviation
  - `logo_url` (text) - Team logo
  - `owner_id` (uuid, FK) - Team captain/owner
  - `game_id` (uuid, FK) - Primary game
  - `region` (text) - Team region
  - `created_at` (timestamptz) - Creation timestamp

  ### 4. team_members
  Junction table for team membership
  - `id` (uuid, PK) - Member record identifier
  - `team_id` (uuid, FK) - Team reference
  - `user_id` (uuid, FK) - User reference
  - `role` (text) - Member role (captain, player, substitute)
  - `joined_at` (timestamptz) - Join timestamp

  ### 5. tournaments
  Tournament definitions
  - `id` (uuid, PK) - Tournament identifier
  - `name` (text) - Tournament name
  - `description` (text) - Tournament details
  - `game_id` (uuid, FK) - Game being played
  - `organizer_id` (uuid, FK) - Organizer user
  - `banner_url` (text) - Tournament banner image
  - `status` (text) - Status: pending, registration_open, running, completed, cancelled
  - `format` (text) - Tournament format: single_elimination, double_elimination, round_robin
  - `max_participants` (int) - Maximum teams/players
  - `current_participants` (int) - Current registration count
  - `participant_type` (text) - Type: team or solo
  - `region` (text) - Tournament region
  - `prize_pool` (text) - Prize information
  - `rules` (text) - Tournament rules
  - `stream_url` (text) - Live stream link
  - `registration_start` (timestamptz) - Registration opens
  - `registration_end` (timestamptz) - Registration closes
  - `start_date` (timestamptz) - Tournament start
  - `end_date` (timestamptz) - Tournament end
  - `created_at` (timestamptz) - Creation timestamp

  ### 6. tournament_participants
  Registered teams/players in tournaments
  - `id` (uuid, PK) - Participation identifier
  - `tournament_id` (uuid, FK) - Tournament reference
  - `team_id` (uuid, FK, nullable) - Team reference (for team tournaments)
  - `user_id` (uuid, FK, nullable) - User reference (for solo tournaments)
  - `seed` (int) - Tournament seeding position
  - `status` (text) - Status: registered, checked_in, eliminated, winner
  - `registered_at` (timestamptz) - Registration timestamp

  ### 7. matches
  Individual tournament matches
  - `id` (uuid, PK) - Match identifier
  - `tournament_id` (uuid, FK) - Tournament reference
  - `round` (int) - Round number
  - `match_number` (int) - Match number within round
  - `bracket_position` (text) - Position in bracket tree
  - `participant1_id` (uuid, FK) - First participant
  - `participant2_id` (uuid, FK) - Second participant
  - `winner_id` (uuid, FK, nullable) - Winner reference
  - `status` (text) - Status: pending, in_progress, completed, disputed
  - `scheduled_at` (timestamptz) - Scheduled time
  - `started_at` (timestamptz) - Actual start time
  - `completed_at` (timestamptz) - Completion time
  - `stream_url` (text) - Match-specific stream

  ### 8. match_results
  Detailed match scores
  - `id` (uuid, PK) - Result identifier
  - `match_id` (uuid, FK) - Match reference
  - `participant_id` (uuid, FK) - Participant reference
  - `score` (int) - Participant score
  - `stats` (jsonb) - Additional statistics
  - `submitted_by` (uuid, FK) - User who submitted result
  - `submitted_at` (timestamptz) - Submission timestamp

  ## Security
  - RLS enabled on all tables
  - Competitors can read public data and manage their own profiles/teams
  - Organizers can manage their tournaments
  - Admins have full access
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'competitor' CHECK (role IN ('competitor', 'organizer', 'admin')),
  bio text,
  region text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Games Table
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

ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Games are viewable by everyone"
  ON games FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage games"
  ON games FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Teams Table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  tag text NOT NULL,
  logo_url text,
  owner_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  region text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(name, game_id)
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teams are viewable by everyone"
  ON teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Team owners can manage their teams"
  ON teams FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Team Members Table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'player' CHECK (role IN ('captain', 'player', 'substitute')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members are viewable by everyone"
  ON team_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Team owners can manage members"
  ON team_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND teams.owner_id = auth.uid()
    )
  );

-- Tournaments Table
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
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tournaments are viewable by everyone"
  ON tournaments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Organizers can create tournaments"
  ON tournaments FOR INSERT
  TO authenticated
  WITH CHECK (
    organizer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('organizer', 'admin')
    )
  );

CREATE POLICY "Organizers can manage their tournaments"
  ON tournaments FOR UPDATE
  TO authenticated
  USING (organizer_id = auth.uid())
  WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "Organizers can delete their tournaments"
  ON tournaments FOR DELETE
  TO authenticated
  USING (organizer_id = auth.uid());

-- Tournament Participants Table
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

ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tournament participants are viewable by everyone"
  ON tournament_participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can register themselves or their teams"
  ON tournament_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = tournament_participants.team_id
      AND teams.owner_id = auth.uid()
    )
  );

CREATE POLICY "Tournament organizers can manage participants"
  ON tournament_participants FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournaments
      WHERE tournaments.id = tournament_participants.tournament_id
      AND tournaments.organizer_id = auth.uid()
    )
  );

-- Matches Table
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
  stream_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Matches are viewable by everyone"
  ON matches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Tournament organizers can manage matches"
  ON matches FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournaments
      WHERE tournaments.id = matches.tournament_id
      AND tournaments.organizer_id = auth.uid()
    )
  );

-- Match Results Table
CREATE TABLE IF NOT EXISTS match_results (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES tournament_participants(id) ON DELETE CASCADE,
  score int NOT NULL DEFAULT 0,
  stats jsonb DEFAULT '{}'::jsonb,
  submitted_by uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  submitted_at timestamptz DEFAULT now()
);

ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Match results are viewable by everyone"
  ON match_results FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Tournament organizers can submit results"
  ON match_results FOR INSERT
  TO authenticated
  WITH CHECK (
    submitted_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM matches m
      JOIN tournaments t ON t.id = m.tournament_id
      WHERE m.id = match_results.match_id
      AND t.organizer_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_teams_owner ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_teams_game ON teams(game_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_game ON tournaments(game_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_organizer ON tournaments(organizer_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_dates ON tournaments(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_team ON tournament_participants(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_participants ON matches(participant1_id, participant2_id);
CREATE INDEX IF NOT EXISTS idx_match_results_match ON match_results(match_id);

-- Insert initial game data
INSERT INTO games (name, short_name, platform, icon_url) VALUES
  ('League of Legends', 'LoL', 'PC', 'https://images.pexels.com/photos/1174732/pexels-photo-1174732.jpeg?auto=compress&cs=tinysrgb&w=200'),
  ('Counter-Strike 2', 'CS2', 'PC', 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=200'),
  ('Valorant', 'Valorant', 'PC', 'https://images.pexels.com/photos/7915437/pexels-photo-7915437.jpeg?auto=compress&cs=tinysrgb&w=200'),
  ('Dota 2', 'Dota 2', 'PC', 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=200'),
  ('Rocket League', 'RL', 'Cross-Platform', 'https://images.pexels.com/photos/163077/mario-yoschi-figures-funny-163077.jpeg?auto=compress&cs=tinysrgb&w=200'),
  ('Fortnite', 'Fortnite', 'Cross-Platform', 'https://images.pexels.com/photos/1293261/pexels-photo-1293261.jpeg?auto=compress&cs=tinysrgb&w=200')
ON CONFLICT (name) DO NOTHING;