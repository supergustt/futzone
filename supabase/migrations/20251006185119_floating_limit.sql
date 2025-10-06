/*
  # Fix profiles RLS policy for user registration

  1. Security Changes
    - Update INSERT policy to allow authenticated users to create profiles
    - Ensure proper user_id matching with auth.uid()
    - Fix policy conditions for profile creation during signup

  2. Changes
    - Drop existing INSERT policy
    - Create new INSERT policy with correct conditions
    - Allow users to insert their own profile data during registration
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create new INSERT policy that allows authenticated users to create their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Ensure SELECT policy exists for users to read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Ensure UPDATE policy exists for users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);