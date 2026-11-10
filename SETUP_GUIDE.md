# Bridal Salon - Booking System Setup Guide

## Problem Summary
Booking confirmations don't save to the database due to RLS (Row Level Security) blocking UPDATE/UPSERT operations without proper authentication.

## Solution Architecture

### 1. **Local Development (localhost:5175)**

#### Option A: Using Real Supabase Auth (Recommended for full testing)
```
User Login → Real Supabase Auth → JWT Token → RLS checks auth.uid() → ✅ UPDATE/UPSERT allowed
```

**Steps:**
1. Login with real email/password at `/booking`
2. Supabase returns JWT access token
3. Token is stored in session
4. All database queries automatically include token in Authorization header
5. RLS policy `auth.uid()` validation succeeds
6. Booking saves successfully

**Code flow:**
- User fills login form → `handleLogin()` → `supabase.auth.signInWithPassword()` 
- Real auth returns session with JWT token
- Session stored by Supabase client automatically
- `handleConfirmBooking()` sends UPDATE/UPSERT with auth context
- Database checks: `WHERE auth.uid() = user_id` ✅ PASSES

#### Option B: Using Mock Auth (Quick testing, no real Supabase)
```
Mock User in localStorage → Mock auth.uid() → Mock query responses → ✅ Works but doesn't save to DB
```

**Limitations:**
- Bookings save to mock storage, not actual database
- Can't test real booking persistence
- Use only for UI/UX testing

---

## 2. **Required RLS Policies**

Copy these SQL queries into Supabase SQL Editor:
https://supabase.com/dashboard/project/qzyyjskrksqxnnferprr/sql/new

```sql
-- Enable RLS
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- Policy: READ access for everyone (unauthenticated OK)
CREATE POLICY "Anyone can view available slots"
ON availability FOR SELECT
USING (true);

-- Policy: INSERT - only authenticated users can create bookings
CREATE POLICY "Authenticated users can book slots"
ON availability FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND booked_by_user_id = auth.uid()
  AND status = 'booked'
);

-- Policy: UPDATE - users can modify slots (book/unbook)
CREATE POLICY "Users can manage their bookings"
ON availability FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    -- User can book a slot for themselves
    (status = 'booked' AND booked_by_user_id = auth.uid())
    OR
    -- User can cancel their booking
    (status = 'available' AND booked_by_user_id IS NULL)
  )
);

-- Policy: DELETE - users can delete their own bookings  
CREATE POLICY "Users can delete their bookings"
ON availability FOR DELETE
USING (auth.uid() IS NOT NULL AND booked_by_user_id = auth.uid());
```

---

## 3. **Environment Variables** (.env.local)

```env
VITE_SUPABASE_URL=https://qzyyjskrksqxnnferprr.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_6TdapBHfs449sszBZIyoJA_hzE39Fu3
```

✅ Already configured in your `.env.local`

---

## 4. **How It Works**

### Data Flow for Booking

```
┌─────────────────────────────────────────────────────────┐
│                 User Workflow                            │
└─────────────────────────────────────────────────────────┘

1. User opens /booking
   ↓
2. No session → Shows "Belépés az időpontfoglaláshoz" button
   ↓
3. User clicks button → Login Modal appears
   ↓
4. User enters email + password
   ↓
5. Form submission → handleLogin()
   ├─ Calls: supabase.auth.signInWithPassword({ email, password })
   ├─ Real Auth: Validates against Supabase Auth → Returns JWT
   ├─ Token stored in Supabase session automatically
   └─ User state updated → Header shows email + Logout button
   ↓
6. User selects time slot (e.g., Jul 29 14:00)
   ├─ handleSlotClick() fires
   ├─ Checks: user exists? → Yes ✓
   └─ Shows confirmation modal
   ↓
7. User clicks "Foglalás megerősítése" (Confirm Booking)
   ├─ handleConfirmBooking() fires
   ├─ Sends: supabase.from('availability').upsert({...})
   ├─ Auth Token: JWT from session automatically included ✓
   ├─ RLS Check: auth.uid() = booked_by_user_id → ✓ PASSES
   └─ Database update succeeds ✓
   ↓
8. Success message shown
   ↓
9. Page refreshes → Slots reloaded
   ├─ Booked slot shows in BLUE (booked-by-me class)
   └─ User sees their reservation ✓
```

---

## 5. **Testing Checklist**

### ✅ Test Scenario 1: Real Auth + Real Database

```bash
cd /Users/matyasi_lilla/Documents/GitHub/bridal_salon
npm run dev
# Open http://localhost:5175/booking
```

**Steps:**
1. [ ] Click "Belépés az időpontfoglaláshoz"
2. [ ] Register new account (or login with existing)
3. [ ] Confirm email verification if needed
4. [ ] Select available time slot
5. [ ] Confirm booking
6. [ ] Check browser console for success logs
7. [ ] Refresh page → Slot should appear in BLUE
8. [ ] Check Supabase Dashboard → Row should exist in `availability` table

**Expected console logs:**
```
[handleConfirmBooking] Called
[handleConfirmBooking] selectedSlot: {...}
[handleConfirmBooking] user: {id: "...", email: "..."}
[handleConfirmBooking] Attempting booking with: {date: "2026-07-29", time: "14:00", user_id: "...", status: "booked", booked_at: "..."}
[handleConfirmBooking] UPSERT response: {data: [{...}], error: null}
[handleConfirmBooking] UPSERT successful: [{...}]
```

### ✅ Test Scenario 2: Mock Auth (for UI testing only)

```bash
# In browser console:
window.FORCE_MOCK_AUTH = true
location.reload()

# Now bookings won't save to database, but UI testing works
```

---

## 6. **Common Issues & Fixes**

### Issue: "row-level security policy" error
**Cause:** RLS policies not created or incorrect  
**Fix:** Run the SQL policies from section 2

### Issue: "Unauthorized" or 401 error  
**Cause:** No auth token, or token expired  
**Fix:** 
- Logout and login again
- Check browser DevTools → Application → Cookies/LocalStorage for auth session
- Verify VITE_SUPABASE_ANON_KEY is correct

### Issue: UPSERT fails but SELECT works
**Cause:** RLS allows SELECT but not INSERT/UPDATE  
**Fix:** Check RLS policies - use provided SQL from section 2

### Issue: "User is not authenticated"
**Cause:** User not logged in when attempting booking  
**Fix:** Modify `handleConfirmBooking()` to show login modal instead of booking

---

## 7. **Code Structure**

```
src/
├── pages/
│   └── Booking.jsx           ← Main booking component
│       ├── handleLogin()      ← Auth with supabase.auth
│       ├── handleConfirmBooking() ← UPSERT with auth token
│       └── handleCancelBooking()  ← UPDATE with auth token
├── services/
│   └── supabaseClient.js      ← Supabase config + mock auth
└── index.css                  ← Styles for booking UI

Key logic:
- Auth handled by Supabase Auth API (built-in RLS support)
- Queries go to RLS-protected availability table
- auth.uid() available in all SQL queries automatically
```

---

## 8. **Production Deployment**

When ready to deploy:

1. **Verify RLS policies are strict** (use section 2 SQL)
2. **Test real auth flow** thoroughly
3. **Disable mock auth** (remove `window.FORCE_MOCK_AUTH`)
4. **Use environment variables** for Supabase credentials
5. **Enable HTTPS only** 
6. **Set correct CORS** in Supabase Project Settings

---

## 9. **Next Steps**

1. ✅ Copy RLS SQL policies to Supabase SQL Editor
2. ✅ Test Login/Booking flow with real auth
3. ✅ Verify bookings appear in database
4. ✅ Test slot appears in blue after booking
5. ✅ Test cancel booking functionality
6. ✅ Deploy to production with proper auth

---

**Contact:** For RLS policy questions, refer to:
https://supabase.com/docs/guides/auth/row-level-security
