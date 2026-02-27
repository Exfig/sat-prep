-- Referral System Migration
-- Run this in Supabase SQL Editor after base schema + email-preferences are set up.
-- Gives each user a unique referral code, tracks referrals, and populates email template vars.

-- =============================================================
-- 1. Add referral_code column to profiles
-- =============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;

-- Backfill existing users with a referral code
UPDATE profiles
SET referral_code = 'FRIEND-' || upper(substr(md5(id::text || random()::text), 1, 6))
WHERE referral_code IS NULL;

-- =============================================================
-- 2. Create referrals tracking table
-- =============================================================
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credit_cents int DEFAULT 2000,
  created_at timestamptz DEFAULT now(),
  UNIQUE(referred_user_id)  -- each user can only be referred once
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Admin-only read access
CREATE POLICY "admin_read_referrals" ON referrals
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Users can read their own referrals (as referrer)
CREATE POLICY "users_read_own_referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id);

-- =============================================================
-- 3. Update handle_new_user() trigger — generate referral_code + track referrals
-- =============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_referrer_id uuid;
BEGIN
  -- Create profile with a unique referral code
  INSERT INTO public.profiles (id, full_name, referral_code)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'FRIEND-' || upper(substr(md5(random()::text), 1, 6))
  );

  INSERT INTO public.gamification_state (id)
  VALUES (new.id);

  INSERT INTO public.email_preferences (id)
  VALUES (new.id);

  -- If referred by someone, track the referral
  IF new.raw_user_meta_data->>'referred_by' IS NOT NULL THEN
    SELECT id INTO v_referrer_id FROM profiles
    WHERE referral_code = new.raw_user_meta_data->>'referred_by'
    LIMIT 1;

    IF v_referrer_id IS NOT NULL THEN
      INSERT INTO referrals (referrer_id, referred_user_id)
      VALUES (v_referrer_id, new.id);
    END IF;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================
-- 4. Update get_email_template_vars() — add referral_link + referral_code
-- =============================================================
-- The full RPC is deployed in Supabase. Key change:
--   Added v_referral_code variable, read from profiles.referral_code
--   Changed 'referral_link' from '' to real URL: https://topscore.school/caliber?ref=CODE
--   Changed 'referral_code' from '' to real code
-- See full RPC definition in Supabase SQL Editor.
-- NOTE: referral_link points to /caliber?ref=CODE (landing page), NOT /caliber/signup?ref=CODE
