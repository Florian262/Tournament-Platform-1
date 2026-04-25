/* 
  ARENA - BATTLE READY TEST DATA (v3 - FIXED AUTH)
  This script creates Auth Users + Profiles + Teams + Tournaments.
  Run this in your Supabase SQL Editor.
*/

-- 1. CLEANUP PREVIOUS ATTEMPTS
DELETE FROM auth.users WHERE email IN ('esl@arena.com', 'riot@arena.com', 's1mple@arena.com', 'faker@arena.com');

-- 2. CREATE AUTH USERS WITH CORRECT AUDIENCE AND ROLE
INSERT INTO auth.users (
  id, 
  instance_id, 
  email, 
  encrypted_password, 
  email_confirmed_at, 
  role, 
  aud, 
  raw_app_meta_data, 
  raw_user_meta_data, 
  created_at, 
  updated_at
)
VALUES 
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'esl@arena.com', extensions.crypt('password123', extensions.gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{"username":"ESL_Official"}', now(), now()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'riot@arena.com', extensions.crypt('password123', extensions.gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{"username":"RiotGames"}', now(), now()),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 's1mple@arena.com', extensions.crypt('password123', extensions.gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{"username":"S1mple"}', now(), now()),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'faker@arena.com', extensions.crypt('password123', extensions.gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{"username":"Faker"}', now(), now());

-- 3. CREATE PUBLIC PROFILES
INSERT INTO public.user_profiles (id, username, full_name, role, region)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'ESL_Official', 'ESL Tournament Admin', 'organizer', 'EU'),
  ('00000000-0000-0000-0000-000000000002', 'RiotGames', 'Riot Esports', 'organizer', 'NA'),
  ('00000000-0000-0000-0000-000000000003', 'S1mple', 'Oleksandr Kostyliev', 'competitor', 'EU'),
  ('00000000-0000-0000-0000-000000000004', 'Faker', 'Lee Sang-hyeok', 'competitor', 'ASIA')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

-- 4. RUN THE REST OF THE TOURNAMENT DATA
DO $$
DECLARE
  lol_id uuid;
  cs2_id uuid;
  t1_id uuid := 'a1111111-1111-1111-1111-111111111111';
  t2_id uuid := 'b2222222-2222-2222-2222-222222222222';
  team1 uuid := 'c3333333-3333-3333-3333-333333333333';
  team2 uuid := 'd4444444-4444-4444-4444-444444444444';
BEGIN
  -- Cleanup old data to avoid conflicts
  DELETE FROM matches WHERE tournament_id IN (t1_id, t2_id);
  DELETE FROM tournament_participants WHERE tournament_id IN (t1_id, t2_id);
  DELETE FROM tournaments WHERE id IN (t1_id, t2_id);
  DELETE FROM teams WHERE id IN (team1, team2);

  SELECT id INTO lol_id FROM games WHERE short_name = 'LoL' LIMIT 1;
  SELECT id INTO cs2_id FROM games WHERE short_name = 'CS2' LIMIT 1;

  -- Create Teams
  INSERT INTO teams (id, name, tag, owner_id, game_id, region, logo_url)
  VALUES 
    (team1, 'Natus Vincere', 'NAVI', '00000000-0000-0000-0000-000000000003', cs2_id, 'EU', 'https://upload.wikimedia.org/wikipedia/en/thumb/a/ac/Natus_Vincere_logo.svg/1200px-Natus_Vincere_logo.svg.png'),
    (team2, 'T1 Esports', 'T1', '00000000-0000-0000-0000-000000000004', lol_id, 'ASIA', 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f9/T1_logo.svg/1200px-T1_logo.svg.png');

  -- Create Running Tournament
  INSERT INTO tournaments (id, name, description, game_id, organizer_id, status, format, max_participants, current_participants, start_date, end_date, prize_pool, banner_url)
  VALUES (t1_id, 'Intel Extreme Masters', 'The elite CS2 championship.', cs2_id, '00000000-0000-0000-0000-000000000001', 'running', 'single_elimination', 8, 2, now(), now() + interval '7 days', '$1,000,000', 'https://community.skin.club/wp-content/uploads/2025/09/cs2.jpg.webp');

  -- Create Open Tournament
  INSERT INTO tournaments (id, name, description, game_id, organizer_id, status, format, max_participants, current_participants, start_date, end_date, prize_pool, banner_url)
  VALUES (t2_id, 'LCK Spring Split', 'Korean League of Legends championship.', lol_id, '00000000-0000-0000-0000-000000000002', 'registration_open', 'single_elimination', 16, 1, now() + interval '10 days', now() + interval '30 days', '$500,000', 'https://images.pexels.com/photos/1174732/pexels-photo-1174732.jpeg');

  -- Add Participants
  INSERT INTO tournament_participants (id, tournament_id, team_id, seed, status)
  VALUES 
    (gen_random_uuid(), t1_id, team1, 1, 'checked_in'),
    (gen_random_uuid(), t1_id, team2, 2, 'checked_in');

  -- Create Match
  INSERT INTO matches (tournament_id, round, match_number, status, participant1_id, participant2_id, scheduled_at)
  SELECT t1_id, 1, 1, 'in_progress', p1.id, p2.id, now()
  FROM tournament_participants p1, tournament_participants p2
  WHERE p1.tournament_id = t1_id AND p2.tournament_id = t1_id AND p1.seed = 1 AND p2.seed = 2;

END $$;
