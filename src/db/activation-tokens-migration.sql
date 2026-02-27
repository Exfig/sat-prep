-- Activation tokens for parent-to-student purchase handoff
create table public.activation_tokens (
  id uuid primary key default gen_random_uuid(),

  -- Token itself (URL-safe, unique)
  token text unique not null,

  -- Stripe reference
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,

  -- Buyer info (parent)
  buyer_email text not null,
  buyer_name text,

  -- Student info (filled when parent sends activation email)
  student_email text,

  -- Status tracking
  status text not null default 'unused'
    check (status in ('unused', 'used', 'expired', 'revoked')),

  -- When claimed, link to the user account
  claimed_by uuid references auth.users(id),
  claimed_at timestamptz,

  -- Expiration (30 days from creation)
  expires_at timestamptz not null default (now() + interval '30 days'),

  -- How many times someone attempted to use this token (for abuse detection)
  claim_attempts integer not null default 0,

  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for fast token lookups (the primary query path)
create unique index idx_activation_tokens_token on public.activation_tokens(token);

-- Index for looking up tokens by buyer email (for support/admin)
create index idx_activation_tokens_buyer_email on public.activation_tokens(buyer_email);

-- Index for looking up tokens by stripe payment (for webhook idempotency)
create index idx_activation_tokens_stripe_payment on public.activation_tokens(stripe_payment_intent_id);

-- RLS: No direct public access. All operations go through edge functions with service_role key.
alter table public.activation_tokens enable row level security;

-- No RLS policies needed — this table is only accessed by edge functions using service_role key.

-- Function to auto-expire tokens (run via pg_cron or check at query time)
create or replace function public.expire_stale_tokens()
returns void
language sql
security definer
as $$
  update public.activation_tokens
  set status = 'expired', updated_at = now()
  where status = 'unused' and expires_at < now();
$$;

-- Function to increment claim attempts (for abuse detection)
create or replace function public.increment_claim_attempts(token_value text)
returns void
language sql
security definer
as $$
  update public.activation_tokens
  set claim_attempts = claim_attempts + 1, updated_at = now()
  where token = token_value;
$$;

-- Optional: Schedule auto-expiration daily via pg_cron
-- select cron.schedule('expire-activation-tokens', '0 3 * * *', 'select public.expire_stale_tokens()');
