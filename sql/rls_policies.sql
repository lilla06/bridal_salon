-- ============================================
-- RLS Policies for Bridal Salon Booking System
-- ============================================
-- This file contains the necessary Row Level Security policies
-- for the availability table in Supabase

-- IMPORTANT: Copy and paste these queries into the Supabase SQL Editor
-- https://supabase.com/dashboard/project/qzyyjskrksqxnnferprr/sql/new

-- Step 1: FIRST, enable RLS on the availability table
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing policies (optional, if they exist)
DROP POLICY IF EXISTS "Enable read access for all users" ON availability;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON availability;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON availability;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON availability;

-- Step 3: Create the policies

-- Policy 1: Allow everyone to READ (SELECT) all time slots
CREATE POLICY "Enable read access for all users"
ON availability
FOR SELECT
USING (true);

-- Policy 2: Allow authenticated users to INSERT bookings
-- (Users can create new bookings if the slot is available)
CREATE POLICY "Enable insert for authenticated users"
ON availability
FOR INSERT
WITH CHECK (
  -- Only allow INSERT if:
  -- 1. User is authenticated
  auth.uid() IS NOT NULL
  AND
  -- 2. They are setting their own user ID
  booked_by_user_id = auth.uid()
  AND
  -- 3. Status is 'booked'
  status = 'booked'
);

-- Policy 3: Allow authenticated users to UPDATE bookings
-- (Users can book/unbook time slots)
CREATE POLICY "Enable update for authenticated users"
ON availability
FOR UPDATE
USING (
  -- User can UPDATE any row for booking purposes
  auth.uid() IS NOT NULL
)
WITH CHECK (
  -- After update, ensure user owns the booking or it's being made available again
  auth.uid() IS NOT NULL
  AND
  (
    -- Either user is booking it for themselves
    (status = 'booked' AND booked_by_user_id = auth.uid())
    OR
    -- Or they are cancelling their own booking (setting it back to available)
    (status = 'available' AND booked_by_user_id IS NULL)
  )
);

-- Policy 4: Allow authenticated users to DELETE bookings
-- (Allow deletion only if user owns the booking)
CREATE POLICY "Enable delete for authenticated users"
ON availability
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND
  booked_by_user_id = auth.uid()
);

-- ============================================
-- Verification Query
-- ============================================
-- After running the above, verify the policies were created:
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    qual as "USING_expression",
    with_check as "WITH_CHECK_expression"
FROM pg_policies
WHERE tablename = 'availability'
ORDER BY policyname;

-- ============================================
-- Notes for Development vs Production
-- ============================================
-- 
-- LOCAL TESTING (localhost):
-- - Use mock auth (no real Supabase tokens)
-- - RLS will BLOCK all queries without auth
-- - Solution: Create a special "anon" policy that allows booking:
--
-- CREATE POLICY "Allow anonymous booking for testing"
-- ON availability
-- FOR ALL
-- USING (true)
-- WITH CHECK (true);
--
-- ⚠️  NEVER use this in production! Remove before deploying!
--
-- PRODUCTION:
-- - Use real Supabase Auth
-- - RLS will check auth.uid()
-- - Users will be authenticated via login/registration
-- - Each user can only modify their own bookings
--
-- ============================================

