/*
  # AbacatePay Integration Schema

  1. New Tables
    - `abacatepay_customers`: Links Supabase users to AbacatePay customers
      - Includes `user_id` (references `auth.users`)
      - Stores AbacatePay `customer_id`
      - Implements soft delete

    - `abacatepay_subscriptions`: Manages subscription data
      - Tracks subscription status, periods, and payment details
      - Links to `abacatepay_customers` via `customer_id`
      - Custom enum type for subscription status
      - Implements soft delete

    - `abacatepay_payments`: Stores payment information (PIX)
      - Records payment sessions and PIX codes
      - Tracks payment amounts and status
      - Custom enum type for payment status
      - Implements soft delete

    - `abacatepay_withdrawals`: Stores withdrawal requests
      - Records withdrawal requests and PIX keys
      - Tracks withdrawal amounts and status
      - Custom enum type for withdrawal status
      - Implements soft delete

  2. Views
    - `abacatepay_user_subscriptions`: Secure view for user subscription data
    - `abacatepay_user_payments`: Secure view for user payment history
    - `abacatepay_user_withdrawals`: Secure view for user withdrawal history

  3. Security
    - Enables Row Level Security (RLS) on all tables
    - Implements policies for authenticated users to view their own data
*/

CREATE TABLE IF NOT EXISTS abacatepay_customers (
  id bigint primary key generated always as identity,
  user_id uuid references auth.users(id) not null unique,
  customer_id text not null unique,
  email text not null,
  name text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  deleted_at timestamp with time zone default null
);

ALTER TABLE abacatepay_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own customer data"
    ON abacatepay_customers
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE TYPE abacatepay_subscription_status AS ENUM (
    'not_started',
    'trial',
    'active',
    'past_due',
    'canceled',
    'expired'
);

CREATE TABLE IF NOT EXISTS abacatepay_subscriptions (
  id bigint primary key generated always as identity,
  customer_id text unique not null,
  subscription_id text default null,
  plan_id text default null,
  amount decimal(10,2) not null default 27.90,
  currency text not null default 'BRL',
  current_period_start timestamp with time zone default null,
  current_period_end timestamp with time zone default null,
  trial_start timestamp with time zone default null,
  trial_end timestamp with time zone default null,
  cancel_at_period_end boolean default false,
  status abacatepay_subscription_status not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  deleted_at timestamp with time zone default null
);

ALTER TABLE abacatepay_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription data"
    ON abacatepay_subscriptions
    FOR SELECT
    TO authenticated
    USING (
        customer_id IN (
            SELECT customer_id
            FROM abacatepay_customers
            WHERE user_id = auth.uid() AND deleted_at IS NULL
        )
        AND deleted_at IS NULL
    );

CREATE TYPE abacatepay_payment_status AS ENUM (
    'pending',
    'paid',
    'cancelled',
    'expired',
    'failed'
);

CREATE TYPE abacatepay_payment_type AS ENUM (
    'deposit',
    'subscription',
    'bet_payment'
);

CREATE TABLE IF NOT EXISTS abacatepay_payments (
    id bigint primary key generated always as identity,
    payment_id text not null unique,
    customer_id text not null,
    amount decimal(10,2) not null,
    currency text not null default 'BRL',
    payment_type abacatepay_payment_type not null,
    pix_code text not null,
    pix_qr_code text not null,
    description text not null,
    external_id text default null,
    status abacatepay_payment_status not null default 'pending',
    expires_at timestamp with time zone not null,
    paid_at timestamp with time zone default null,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    deleted_at timestamp with time zone default null
);

ALTER TABLE abacatepay_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment data"
    ON abacatepay_payments
    FOR SELECT
    TO authenticated
    USING (
        customer_id IN (
            SELECT customer_id
            FROM abacatepay_customers
            WHERE user_id = auth.uid() AND deleted_at IS NULL
        )
        AND deleted_at IS NULL
    );

CREATE TYPE abacatepay_withdrawal_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'cancelled'
);

CREATE TABLE IF NOT EXISTS abacatepay_withdrawals (
    id bigint primary key generated always as identity,
    withdrawal_id text not null unique,
    customer_id text not null,
    amount decimal(10,2) not null,
    currency text not null default 'BRL',
    pix_key text not null,
    description text not null default 'Saque FutZone',
    status abacatepay_withdrawal_status not null default 'pending',
    processed_at timestamp with time zone default null,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    deleted_at timestamp with time zone default null
);

ALTER TABLE abacatepay_withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own withdrawal data"
    ON abacatepay_withdrawals
    FOR SELECT
    TO authenticated
    USING (
        customer_id IN (
            SELECT customer_id
            FROM abacatepay_customers
            WHERE user_id = auth.uid() AND deleted_at IS NULL
        )
        AND deleted_at IS NULL
    );

-- View for user subscriptions
CREATE VIEW abacatepay_user_subscriptions WITH (security_invoker = true) AS
SELECT
    c.customer_id,
    s.subscription_id,
    s.status as subscription_status,
    s.plan_id,
    s.amount,
    s.currency,
    s.current_period_start,
    s.current_period_end,
    s.trial_start,
    s.trial_end,
    s.cancel_at_period_end
FROM abacatepay_customers c
LEFT JOIN abacatepay_subscriptions s ON c.customer_id = s.customer_id
WHERE c.user_id = auth.uid()
AND c.deleted_at IS NULL
AND s.deleted_at IS NULL;

GRANT SELECT ON abacatepay_user_subscriptions TO authenticated;

-- View for user payments
CREATE VIEW abacatepay_user_payments WITH (security_invoker = true) AS
SELECT
    c.customer_id,
    p.id as payment_id,
    p.payment_id as abacatepay_payment_id,
    p.amount,
    p.currency,
    p.payment_type,
    p.description,
    p.status as payment_status,
    p.expires_at,
    p.paid_at,
    p.created_at as payment_date
FROM abacatepay_customers c
LEFT JOIN abacatepay_payments p ON c.customer_id = p.customer_id
WHERE c.user_id = auth.uid()
AND c.deleted_at IS NULL
AND p.deleted_at IS NULL;

GRANT SELECT ON abacatepay_user_payments TO authenticated;

-- View for user withdrawals
CREATE VIEW abacatepay_user_withdrawals WITH (security_invoker = true) AS
SELECT
    c.customer_id,
    w.id as withdrawal_id,
    w.withdrawal_id as abacatepay_withdrawal_id,
    w.amount,
    w.currency,
    w.pix_key,
    w.description,
    w.status as withdrawal_status,
    w.processed_at,
    w.created_at as withdrawal_date
FROM abacatepay_customers c
LEFT JOIN abacatepay_withdrawals w ON c.customer_id = w.customer_id
WHERE c.user_id = auth.uid()
AND c.deleted_at IS NULL
AND w.deleted_at IS NULL;

GRANT SELECT ON abacatepay_user_withdrawals TO authenticated;