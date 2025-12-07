-- Fix profiles RLS policy to protect emails
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view own profile or admin can view all"
  ON profiles FOR SELECT
  USING ((auth.uid() = user_id) OR is_admin());

-- Fix user_roles RLS policy
DROP POLICY IF EXISTS "Anyone can view roles" ON user_roles;
CREATE POLICY "Users can view own role or admin can view all"
  ON user_roles FOR SELECT
  USING ((auth.uid() = user_id) OR is_admin());

-- Allow admins to manage user roles
CREATE POLICY "Admins can manage roles"
  ON user_roles FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());