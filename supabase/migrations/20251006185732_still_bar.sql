/*
  # Fix profiles table RLS INSERT policy

  1. Security Changes
    - Drop existing INSERT policy that may be incorrectly configured
    - Create new INSERT policy allowing users to create their own profiles
    - Ensure policy uses correct auth.uid() = user_id check
    - Maintain existing SELECT and UPDATE policies

  This migration fixes the RLS policy violation error that occurs when new users
  try to create their profile after signup.
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create profiles" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;

-- Create new INSERT policy that allows users to create their own profile
CREATE POLICY "Allow users to insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;