-- Start fresh: remove old tables (inquiries first, because it points to users)
DROP TABLE IF EXISTS inquiries;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('staff', 'manager')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inquiries (
  id            SERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  contact       TEXT NOT NULL,
  subject       TEXT NOT NULL,
  description   TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'new'
                CHECK (status IN ('new', 'in_progress', 'resolved')),
  owner_id      INTEGER NOT NULL REFERENCES users(id),
  version       INTEGER NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Speeds up "show me MY inquiries" and "filter by status"
CREATE INDEX inquiries_owner_id_idx ON inquiries (owner_id);
CREATE INDEX inquiries_status_idx   ON inquiries (status);

-- Duplicate rule: only ONE open (not resolved) inquiry per contact + subject
CREATE UNIQUE INDEX inquiries_open_duplicate_idx
  ON inquiries (lower(contact), lower(subject))
  WHERE status <> 'resolved';