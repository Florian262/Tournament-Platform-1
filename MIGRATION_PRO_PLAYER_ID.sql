-- MIGRATION: Pro-Player Digital ID (Socials & Badges)

-- 1. Update user_profiles to include social_links
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb;

-- 2. Create Legacy Badges Table
CREATE TABLE IF NOT EXISTS legacy_badges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  description text,
  icon_url text,
  rarity text NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  created_at timestamptz DEFAULT now()
);

-- 3. Create User Badges Mapping Table
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES legacy_badges(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- 4. Enable RLS
ALTER TABLE legacy_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Everyone can read badges
CREATE POLICY "Public read badges" ON legacy_badges FOR SELECT USING (true);
CREATE POLICY "Public read user badges" ON user_badges FOR SELECT USING (true);

-- Only admins can manage badges
CREATE POLICY "Admins manage badges" ON legacy_badges FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins manage user badges" ON user_badges FOR ALL TO authenticated USING (is_admin());

-- 6. Initial Badges Data
INSERT INTO legacy_badges (name, description, rarity, icon_url) VALUES
  ('Arena Veteran', 'Participated in over 10 tournaments.', 'rare', 'https://api.dicebear.com/7.x/icons/svg?seed=veteran'),
  ('Flawless Season', 'Won a tournament without dropping a single match.', 'legendary', 'https://api.dicebear.com/7.x/icons/svg?seed=flawless'),
  ('Rising Star', 'Reached the top 8 in a Premier League event.', 'common', 'https://api.dicebear.com/7.x/icons/svg?seed=star'),
  ('Franchise Icon', 'Captain of a team with over 5 members.', 'epic', 'https://api.dicebear.com/7.x/icons/svg?seed=crown')
ON CONFLICT (name) DO NOTHING;

-- 7. Grant Permissions
GRANT ALL ON legacy_badges TO authenticated;
GRANT ALL ON user_badges TO authenticated;
GRANT SELECT ON legacy_badges TO anon;
GRANT SELECT ON user_badges TO anon;
