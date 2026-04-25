-- MIGRATION: Pro Scouting Hub (LFG System)

-- 1. Create Scouting Post Status Enum if needed (using text check for simplicity/flexibility)
-- 2. Create Scouting Posts Table
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

-- 3. Enable RLS
ALTER TABLE scouting_posts ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DROP POLICY IF EXISTS "Public view active scouting posts" ON scouting_posts;
CREATE POLICY "Public view active scouting posts" ON scouting_posts 
FOR SELECT USING (status = 'active');

-- Explicitly allow authenticated to select to avoid certain 403 scenarios with joins
DROP POLICY IF EXISTS "Authenticated view active scouting posts" ON scouting_posts;
CREATE POLICY "Authenticated view active scouting posts" ON scouting_posts 
FOR SELECT TO authenticated USING (status = 'active');

DROP POLICY IF EXISTS "Authenticated users create scouting posts" ON scouting_posts;
CREATE POLICY "Authenticated users create scouting posts" ON scouting_posts 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners manage own scouting posts" ON scouting_posts;
CREATE POLICY "Owners manage own scouting posts" ON scouting_posts 
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scouting_posts_type ON scouting_posts(type);
CREATE INDEX IF NOT EXISTS idx_scouting_posts_game_id ON scouting_posts(game_id);
CREATE INDEX IF NOT EXISTS idx_scouting_posts_status ON scouting_posts(status);
CREATE INDEX IF NOT EXISTS idx_scouting_posts_user_id ON scouting_posts(user_id);
