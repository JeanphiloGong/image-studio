import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';

const schema = readFileSync(new URL('../db/001-initial.sql', import.meta.url), 'utf8');

/** @param {import('node:test').TestContext} t */
function database(t) {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(schema);
  db.exec(
    "INSERT INTO users (id, email) VALUES ('alice', 'alice@example.test'), ('bob', 'bob@example.test')",
  );
  return db;
}

test('credit balances cannot be negative or fractional', (t) => {
  const db = database(t);
  db.exec("INSERT INTO credit_accounts (user_id) VALUES ('alice')");
  assert.throws(() => db.exec("UPDATE credit_accounts SET available = -1 WHERE user_id = 'alice'"));
  assert.throws(() => db.exec("UPDATE credit_accounts SET reserved = -1 WHERE user_id = 'alice'"));
  assert.throws(() =>
    db.exec("UPDATE credit_accounts SET available = 1.5 WHERE user_id = 'alice'"),
  );
});

test('an order can grant purchased credits only once', (t) => {
  const db = database(t);
  db.exec(
    "INSERT INTO orders (id, user_id, amount_minor, currency, credits) VALUES ('order-1', 'alice', 100, 'CNY', 10)",
  );
  const grant = db.prepare(
    "INSERT INTO credit_entries (id, user_id, kind, available_delta, reserved_delta, order_id) VALUES (?, 'alice', 'purchase', 10, 0, 'order-1')",
  );
  grant.run('entry-1');
  assert.throws(() => grant.run('entry-2'));
  const result = db.prepare('SELECT COUNT(*) AS count FROM credit_entries').get();
  assert.ok(result);
  assert.equal(result.count, 1);
});

test('a ledger entry cannot refer to another user’s order', (t) => {
  const db = database(t);
  db.exec(
    "INSERT INTO orders (id, user_id, amount_minor, currency, credits) VALUES ('order-1', 'alice', 100, 'CNY', 10)",
  );
  assert.throws(() =>
    db.exec(
      "INSERT INTO credit_entries (id, user_id, kind, available_delta, reserved_delta, order_id) VALUES ('entry-1', 'bob', 'purchase', 10, 0, 'order-1')",
    ),
  );
});

test('a job can settle or release its reservation, but cannot do both', (t) => {
  const db = database(t);
  db.exec(
    "INSERT INTO generation_jobs (id, user_id, prompt, aspect_ratio, model, credit_cost) VALUES ('job-1', 'alice', 'A quiet garden', '1:1', 'test-model', 2)",
  );
  db.exec(
    "INSERT INTO credit_entries (id, user_id, kind, available_delta, reserved_delta, job_id) VALUES ('entry-1', 'alice', 'settle', 0, -2, 'job-1')",
  );
  assert.throws(() =>
    db.exec(
      "INSERT INTO credit_entries (id, user_id, kind, available_delta, reserved_delta, job_id) VALUES ('entry-2', 'alice', 'release', 2, -2, 'job-1')",
    ),
  );
});

test('credit history is append-only', (t) => {
  const db = database(t);
  db.exec(
    "INSERT INTO orders (id, user_id, amount_minor, currency, credits) VALUES ('order-1', 'alice', 100, 'CNY', 10)",
  );
  db.exec(
    "INSERT INTO credit_entries (id, user_id, kind, available_delta, reserved_delta, order_id) VALUES ('entry-1', 'alice', 'purchase', 10, 0, 'order-1')",
  );
  assert.throws(() =>
    db.exec("UPDATE credit_entries SET available_delta = 20 WHERE id = 'entry-1'"),
  );
  assert.throws(() => db.exec("DELETE FROM credit_entries WHERE id = 'entry-1'"));
});

test('unknown generation outcomes can be retained without retrying', (t) => {
  const db = database(t);
  db.exec(
    "INSERT INTO generation_jobs (id, user_id, prompt, aspect_ratio, model, credit_cost, status) VALUES ('job-1', 'alice', 'A quiet garden', '1:1', 'test-model', 2, 'uncertain')",
  );
  const result = db.prepare("SELECT status FROM generation_jobs WHERE id = 'job-1'").get();
  assert.ok(result);
  assert.equal(result.status, 'uncertain');
});
