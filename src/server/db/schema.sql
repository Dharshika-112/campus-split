-- CampusSplit Database Schema
-- All monetary values stored as integer paise (1 INR = 100 paise)

CREATE TABLE IF NOT EXISTS trips (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  start_date  DATE NOT NULL,
  end_date    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT trips_end_after_start CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS participants (
  id         SERIAL PRIMARY KEY,
  trip_id    INTEGER NOT NULL REFERENCES trips(id) ON DELETE RESTRICT,
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Case-insensitive uniqueness: same name cannot appear twice in a trip
  CONSTRAINT participants_unique_name_per_trip UNIQUE (trip_id, name)
);

CREATE TABLE IF NOT EXISTS expenses (
  id                    SERIAL PRIMARY KEY,
  trip_id               INTEGER NOT NULL REFERENCES trips(id) ON DELETE RESTRICT,
  paid_by_participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE RESTRICT,
  title                 VARCHAR(255) NOT NULL,
  description           TEXT,
  category              VARCHAR(100) NOT NULL DEFAULT 'Other',
  amount_paise          INTEGER NOT NULL,
  expense_date          DATE NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT expenses_positive_amount CHECK (amount_paise > 0),
  CONSTRAINT expenses_valid_category CHECK (
    category IN ('Travel','Food','Accommodation','Tickets','Shopping','Other')
  )
);

CREATE TABLE IF NOT EXISTS expense_shares (
  id             SERIAL PRIMARY KEY,
  expense_id     INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE RESTRICT,
  share_paise    INTEGER NOT NULL,
  CONSTRAINT expense_shares_unique UNIQUE (expense_id, participant_id),
  CONSTRAINT expense_shares_non_negative CHECK (share_paise >= 0)
);

CREATE TABLE IF NOT EXISTS settlements (
  id                   SERIAL PRIMARY KEY,
  trip_id              INTEGER NOT NULL REFERENCES trips(id) ON DELETE RESTRICT,
  from_participant_id  INTEGER NOT NULL REFERENCES participants(id) ON DELETE RESTRICT,
  to_participant_id    INTEGER NOT NULL REFERENCES participants(id) ON DELETE RESTRICT,
  amount_paise         INTEGER NOT NULL,
  settled_at           DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT settlements_positive_amount CHECK (amount_paise > 0),
  CONSTRAINT settlements_different_participants CHECK (from_participant_id <> to_participant_id)
);

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_participants_trip ON participants(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_trip ON expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_expense_shares_expense ON expense_shares(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_shares_participant ON expense_shares(participant_id);
CREATE INDEX IF NOT EXISTS idx_settlements_trip ON settlements(trip_id);
CREATE INDEX IF NOT EXISTS idx_settlements_from ON settlements(from_participant_id);
CREATE INDEX IF NOT EXISTS idx_settlements_to ON settlements(to_participant_id);
