-- Payment tracking fields for garments
-- payment_mode:   how the client pays (deposit up-front, full up-front, or on delivery)
-- deposit_amount: the deposit collected, when payment_mode = 'deposit'
-- payment_status: tracks collection progress

ALTER TABLE garments
  ADD COLUMN IF NOT EXISTS payment_mode    TEXT CHECK (payment_mode IN ('deposit', 'full', 'on_delivery')),
  ADD COLUMN IF NOT EXISTS deposit_amount  NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS payment_status  TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'partial', 'paid'));
