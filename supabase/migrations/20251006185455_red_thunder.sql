/*
  # Fix RLS policies for profiles table

  1. Security Updates
    - Drop existing policies that may be incorrectly configured
    - Create new INSERT policy allowing authenticated users to create their own profile
    - Ensure SELECT and UPDATE policies work correctly
    - Use proper auth.uid() function for user identification

  2. Changes
    - Allow authenticated users to insert profiles with their own user_id
    - Maintain security by preventing users from creating profiles for others
    - Fix any policy conflicts that prevent profile creation
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new INSERT policy that allows authenticated users to create their own profile
CREATE POLICY "Enable insert for authenticated users own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create SELECT policy for reading own profile
CREATE POLICY "Enable read access for own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create UPDATE policy for updating own profile
CREATE POLICY "Enable update for own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;