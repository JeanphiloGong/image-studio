PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE credit_accounts (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  available INTEGER NOT NULL DEFAULT 0 CHECK (typeof(available) = 'integer' AND available >= 0),
  reserved INTEGER NOT NULL DEFAULT 0 CHECK (typeof(reserved) = 'integer' AND reserved >= 0),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount_minor INTEGER NOT NULL CHECK (typeof(amount_minor) = 'integer' AND amount_minor > 0),
  currency TEXT NOT NULL CHECK (length(currency) = 3),
  credits INTEGER NOT NULL CHECK (typeof(credits) = 'integer' AND credits > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (id, user_id)
);

CREATE TABLE generation_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  prompt TEXT NOT NULL CHECK (length(trim(prompt)) BETWEEN 1 AND 4000),
  aspect_ratio TEXT NOT NULL CHECK (aspect_ratio IN ('1:1', '16:9', '9:16')),
  model TEXT NOT NULL,
  credit_cost INTEGER NOT NULL CHECK (typeof(credit_cost) = 'integer' AND credit_cost > 0),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'uncertain')),
  provider_request_id TEXT,
  image_path TEXT,
  error_code TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (id, user_id)
);

CREATE TABLE credit_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  kind TEXT NOT NULL CHECK (kind IN ('purchase', 'reserve', 'settle', 'release', 'adjustment')),
  available_delta INTEGER NOT NULL CHECK (typeof(available_delta) = 'integer'),
  reserved_delta INTEGER NOT NULL CHECK (typeof(reserved_delta) = 'integer'),
  order_id TEXT,
  job_id TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (order_id, user_id) REFERENCES orders(id, user_id),
  FOREIGN KEY (job_id, user_id) REFERENCES generation_jobs(id, user_id),
  CHECK (order_id IS NOT NULL OR job_id IS NOT NULL OR kind = 'adjustment'),
  CHECK (NOT (order_id IS NOT NULL AND job_id IS NOT NULL))
);

CREATE UNIQUE INDEX one_purchase_entry_per_order
  ON credit_entries(order_id)
  WHERE order_id IS NOT NULL;

CREATE UNIQUE INDEX one_generation_outcome_per_job
  ON credit_entries(job_id)
  WHERE job_id IS NOT NULL AND kind IN ('settle', 'release');

CREATE TRIGGER credit_entries_are_immutable_update
BEFORE UPDATE ON credit_entries
BEGIN
  SELECT RAISE(ABORT, 'credit history is append-only');
END;

CREATE TRIGGER credit_entries_are_immutable_delete
BEFORE DELETE ON credit_entries
BEGIN
  SELECT RAISE(ABORT, 'credit history is append-only');
END;
