-- MIGRATION: Fix Notification RLS and add created_by for better tracking

-- 1. Add created_by column to notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL;

-- 2. Drop old policies
DROP POLICY IF EXISTS "Users view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can see their own notifications" ON notifications;
DROP POLICY IF EXISTS "Anyone can view scouting posts" ON scouting_posts;
DROP POLICY IF EXISTS "System insert notifications" ON notifications;

-- 3. Create robust policies for Notifications
-- Users can see notifications they received OR notifications they sent
CREATE POLICY "Users view relevant notifications" ON notifications 
FOR SELECT TO authenticated 
USING (user_id = auth.uid() OR created_by = auth.uid());

-- Users can insert notifications if they set themselves as the creator (or it's null)
CREATE POLICY "Users can send notifications" ON notifications 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

-- Recipient can mark as read
CREATE POLICY "Users update own notifications" ON notifications 
FOR UPDATE TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- 4. Ensure Scouting Posts are public
DROP POLICY IF EXISTS "Anyone can view scouting posts" ON scouting_posts;
CREATE POLICY "Anyone can view scouting posts" ON scouting_posts FOR SELECT USING (true);

-- 5. Grant permissions (just in case)
GRANT ALL ON notifications TO authenticated;
GRANT SELECT ON notifications TO anon;
