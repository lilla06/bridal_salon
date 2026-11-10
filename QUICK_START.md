# 🚀 Quick Start - Booking System with RLS

## Problem
Booking confirmations don't save to database - **RLS (Row Level Security) blocks unauthorized access**.

## Solution  
**RLS + Real Supabase Auth** = Secure booking system

---

## Step 1: Setup RLS Policies (5 minutes)

Go to: https://supabase.com/dashboard/project/qzyyjskrksqxnnferprr/sql/new

**Copy and paste this entire SQL block:**

```sql
-- Enable RLS on availability table
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- DROP existing policies if any
DROP POLICY IF EXISTS "Anyone can view available slots" ON availability;
DROP POLICY IF EXISTS "Authenticated users can book slots" ON availability;
DROP POLICY IF EXISTS "Users can manage their bookings" ON availability;
DROP POLICY IF EXISTS "Users can delete their bookings" ON availability;

-- Policy 1: SELECT - Anyone can see available slots (no auth needed)
CREATE POLICY "Anyone can view available slots"
ON availability FOR SELECT
USING (true);

-- Policy 2: INSERT - Only authenticated users can create bookings
CREATE POLICY "Authenticated users can book slots"
ON availability FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND booked_by_user_id = auth.uid()
  AND status = 'booked'
);

-- Policy 3: UPDATE - Users can modify slots (book/unbook)
CREATE POLICY "Users can manage their bookings"
ON availability FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    (status = 'booked' AND booked_by_user_id = auth.uid())
    OR
    (status = 'available' AND booked_by_user_id IS NULL)
  )
);

-- Policy 4: DELETE - Users can cancel their bookings
CREATE POLICY "Users can delete their bookings"
ON availability FOR DELETE
USING (auth.uid() IS NOT NULL AND booked_by_user_id = auth.uid());
```

**Then click Execute (Ctrl+Enter)** ✅

---

## Step 2: Test Locally (2 minutes)

```bash
cd /Users/matyasi_lilla/Documents/GitHub/bridal_salon
npm run dev
# Opens http://localhost:5175/booking
```

---

## Step 3: Test Booking Flow

### 1️⃣ Register New Account
- Click "Belépés az időpontfoglaláshoz"
- Select "Regisztráció" tab
- Enter:
  - Name: `John Doe`
  - Phone: `+36 30 123 4567`
  - Email: `test@example.com`
  - Password: `MyPassword123`
- Click "Regisztráció"

✅ Should see success message

### 2️⃣ Book a Slot
- Select a time (e.g., July 29 14:00) 
- Confirmation modal appears
- Click "Foglalás megerősítése"

✅ Should see: "Sikeres foglalás!"

### 3️⃣ Verify Database Save
- Open: https://supabase.com/dashboard/project/qzyyjskrksqxnnferprr/editor/29639
- Check `availability` table
- **New row should exist** with:
  - `date`: `2026-07-29`
  - `time`: `14:00`
  - `status`: `booked`
  - `booked_by_user_id`: (your user UUID)
  - `booked_at`: (timestamp)

✅ **Booking successfully saved to database!**

### 4️⃣ Verify UI Update
- Refresh page (F5)
- July 29 14:00 slot should be **BLUE** (booked-by-me)
- Click on it to cancel booking

✅ **Full workflow working!**

---

## How It Works

```
Browser                          Supabase Auth              Database
───────                          ───────────                ────────

1. User registers
   ├─ Email + Password ────────────────────>
   └─ <──── JWT Token (stored in session) ──

2. User clicks time slot
   └─ Login modal shown
   
3. User logs in
   ├─ signInWithPassword()───────────────>
   └─ <──── JWT Token (session updated) ──

4. User books slot
   ├─ UPSERT query ─────────────────────>
   │   (JWT auto-included in Authorization header)
   │
   └─ RLS Policy checks:
      ✓ auth.uid() IS NOT NULL
      ✓ booked_by_user_id = auth.uid()
      ✓ status = 'booked'
   
5. <──── Update succeeds, row inserted ──

6. User sees blue slot
   └─ Refresh picks up new data ✅
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/services/supabaseClient.js` | Supabase config + auth client |
| `src/pages/Booking.jsx` | Booking UI + auth handlers |
| `sql/rls_policies.sql` | RLS policies (apply via SQL Editor) |
| `SETUP_GUIDE.md` | Full documentation |

---

## Troubleshooting

### ❌ "row-level security policy"
→ RLS policies not applied. Copy SQL from Step 1 and run it.

### ❌ "Unauthorized" (401)
→ Not logged in. Register or login first.

### ❌ Update fails silently
→ Check browser console for auth errors.

### ❌ Slot doesn't turn blue after booking
→ Refresh page. Check database for new row.

---

## Production Checklist

- [ ] RLS policies enabled and tested
- [ ] Real Supabase Auth configured
- [ ] Email verification enabled
- [ ] Booking save tested with real user
- [ ] Cancel booking tested
- [ ] Database has backups
- [ ] CORS configured correctly
- [ ] Environment variables set
- [ ] HTTPS enabled (required for production)

---

**Next:** Apply RLS policies in SQL Editor, then test!
