-- =========================================================
-- Final secure RLS setup for bridal salon bookings
-- Run this whole script in Supabase SQL Editor.
-- =========================================================

-- 1) Ensure the profiles table exists with the correct columns.
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add missing columns if the table already exists without them.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- 2) Mark the admin user as admin.
INSERT INTO public.profiles (id, email, is_admin)
SELECT id, email, true
FROM auth.users
WHERE email = 'admin@saphira.hu'
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    is_admin = true;

-- 3) Enable RLS on the availability table.
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;

-- 4) Remove all conflicting policies first so the script is idempotent.
DROP POLICY IF EXISTS "availability_select_public" ON public.availability;
DROP POLICY IF EXISTS "availability_insert_authenticated_own" ON public.availability;
DROP POLICY IF EXISTS "availability_update_own_or_admin" ON public.availability;
DROP POLICY IF EXISTS "availability_delete_own_or_admin" ON public.availability;
DROP POLICY IF EXISTS "Anyone can view available slots" ON public.availability;
DROP POLICY IF EXISTS "Authenticated users can book slots" ON public.availability;
DROP POLICY IF EXISTS "Users can manage their bookings" ON public.availability;
DROP POLICY IF EXISTS "Users can delete their bookings" ON public.availability;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.availability;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.availability;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.availability;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.availability;

-- 5) Allow everyone to read slots.
CREATE POLICY "availability_select_public"
ON public.availability
FOR SELECT
USING (true);

-- 6) Authenticated users can insert only their own booking.
CREATE POLICY "availability_insert_authenticated_own"
ON public.availability
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND booked_by_user_id = auth.uid()
  AND status = 'booked'
);

-- 7) Authenticated users can update their own rows,
--    and admins can update any row.
--    This explicitly allows canceling a booking: booked -> available.
CREATE POLICY "availability_update_own_or_admin"
ON public.availability
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND (
    booked_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.is_admin = true
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    (
      status = 'booked'
      AND booked_by_user_id = auth.uid()
    )
    OR (
      status = 'available'
      AND booked_by_user_id IS NULL
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.is_admin = true
    )
  )
);

-- 8) Authenticated users can delete only their own rows,
--    and admins can delete any row.
CREATE POLICY "availability_delete_own_or_admin"
ON public.availability
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND (
    booked_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.is_admin = true
    )
  )
);

-- 9) Verify the resulting policy list.
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual AS using_expression,
  with_check
FROM pg_policies
WHERE tablename = 'availability'
ORDER BY policyname;

-- =========================================================
-- END
-- =========================================================

