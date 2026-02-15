---
title: "SQL Style Guide"
description: "Database-agnostic SQL standards for queries, schemas, and migrations"
author: "Tyler Dukes"
tags: [sql, database, queries, data, standards]
category: "Language Guides"
status: "active"
search_keywords: [sql, database, queries, tables, joins, indexes, stored procedures, migrations, schema]
---

## Language Overview

**SQL** (Structured Query Language) is a declarative language for managing and querying relational databases.
This guide provides database-agnostic standards that work across PostgreSQL, MySQL, SQL Server, and other
SQL-compliant databases.

### Key Characteristics

- **Paradigm**: Declarative query language
- **Case Sensitivity**: Varies by database (PostgreSQL case-sensitive, MySQL configurable)
- **Standards**: SQL-92, SQL:1999, SQL:2003, SQL:2011
- **Primary Use**: Data querying, manipulation, and schema definition

### Naming Conventions

```sql
-- UPPERCASE keywords, lowercase identifiers
SELECT user_id, email, created_at
FROM users
WHERE status = 'active';

-- Avoid mixed case or all lowercase keywords
-- Bad
select user_id from users where status = 'active';

-- Bad
Select User_Id From Users Where Status = 'active';
```

---

## Quick Reference

| **Category** | **Convention** | **Example** | **Notes** |
|-------------|----------------|-------------|-----------|
| **Naming** | | | |
| Keywords | `UPPERCASE` | `SELECT`, `FROM`, `WHERE` | All SQL keywords uppercase |
| Tables | `snake_case` | `users`, `order_items` | Plural nouns, lowercase |
| Columns | `snake_case` | `user_id`, `created_at` | Descriptive, lowercase |
| Indexes | `idx_table_columns` | `idx_users_email` | Prefix with `idx_` |
| Primary Keys | `id` or `table_id` | `id`, `user_id` | Singular, descriptive |
| Foreign Keys | `table_id` | `user_id`, `product_id` | Reference table name |
| Constraints | `pk_`, `fk_`, `uk_`, `ck_` | `pk_users`, `fk_orders_user_id` | Prefix by type |
| Views | `v_descriptive_name` | `v_active_users` | Prefix with `v_` |
| **Formatting** | | | |
| Indentation | 2 or 4 spaces | `WHERE status = 'active'` | Consistent indentation |
| Line Breaks | One clause per line | `SELECT\n  column\nFROM` | Readable queries |
| Commas | Leading commas | `, column2\n, column3` | Or trailing (be consistent) |
| **Query Structure** | | | |
| SELECT | Explicit columns | `SELECT id, name` | Avoid `SELECT *` |
| JOIN | Explicit JOIN type | `INNER JOIN`, `LEFT JOIN` | Not implicit joins |
| WHERE | Use bind parameters | `WHERE id = $1` | Prevent SQL injection |
| **Best Practices** | | | |
| Comments | `--` for line | `-- Get active users` | Single-line comments |
| Transactions | Use when needed | `BEGIN; ... COMMIT;` | Atomic operations |
| NULL Handling | Explicit NULL checks | `WHERE col IS NULL` | Not `= NULL` |

---

## Keywords and Identifiers

### SQL Keywords

Use **UPPERCASE** for all SQL keywords:

```sql
SELECT, FROM, WHERE, JOIN, LEFT JOIN, INNER JOIN, ON, AND, OR, NOT,
INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, TABLE, INDEX, VIEW,
ORDER BY, GROUP BY, HAVING, DISTINCT, AS, UNION, INTERSECT, EXCEPT,
WITH, CASE, WHEN, THEN, ELSE, END, NULL, IS, LIKE, IN, BETWEEN
```

### Identifiers

Use **lowercase snake_case** for all identifiers:

```sql
-- Tables
users, user_profiles, order_items, payment_transactions

-- Columns
user_id, first_name, email_address, created_at, is_active

-- Indexes
idx_users_email, idx_orders_user_id_created_at

-- Constraints
pk_users, fk_orders_user_id, uniq_users_email
```

---

## Table Design

### Table Naming

```sql
-- Good - plural nouns, lowercase snake_case
CREATE TABLE users (
    user_id BIGINT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    order_item_id BIGINT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL
);

-- Avoid singular or mixed case
-- Bad
CREATE TABLE User (...);
CREATE TABLE OrderItem (...);
```

### Primary Keys

```sql
-- Prefer surrogate keys with table_name + _id pattern
CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE
);

-- Composite primary keys for junction tables
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);
```

### Foreign Keys

```sql
CREATE TABLE orders (
    order_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_orders_user_id
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);
```

### Indexes

```sql
-- Index naming: idx_table_column[_column...]
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status_created_at ON orders(status, created_at);

-- Unique indexes
CREATE UNIQUE INDEX uniq_users_email ON users(email);
CREATE UNIQUE INDEX uniq_users_username ON users(username);

-- Partial indexes (PostgreSQL)
CREATE INDEX idx_orders_active
    ON orders(user_id, created_at)
    WHERE status = 'active';
```

---

## Query Formatting

### SELECT Statements

```sql
-- One column per line for complex queries
SELECT
    u.user_id,
    u.email,
    u.first_name,
    u.last_name,
    u.created_at,
    COUNT(o.order_id) AS order_count
FROM users u
LEFT JOIN orders o ON u.user_id = o.user_id
WHERE u.status = 'active'
    AND u.created_at >= '2024-01-01'
GROUP BY u.user_id, u.email, u.first_name, u.last_name, u.created_at
HAVING COUNT(o.order_id) > 0
ORDER BY order_count DESC, u.created_at DESC
LIMIT 100;

-- Simple queries on one line
SELECT user_id, email FROM users WHERE status = 'active';
```

### JOIN Conventions

```sql
-- Use explicit JOIN syntax (not implicit with WHERE)
-- Good
SELECT u.user_id, u.email, o.order_id
FROM users u
INNER JOIN orders o ON u.user_id = o.user_id;

-- Bad - implicit join
SELECT u.user_id, u.email, o.order_id
FROM users u, orders o
WHERE u.user_id = o.user_id;

-- JOIN types
-- INNER JOIN - matching rows only
SELECT u.email, o.total
FROM users u
INNER JOIN orders o ON u.user_id = o.user_id;

-- LEFT JOIN - all left rows, matched right rows
SELECT u.email, o.total
FROM users u
LEFT JOIN orders o ON u.user_id = o.user_id;

-- Multiple JOINs
SELECT
    u.email,
    o.order_id,
    oi.product_id,
    p.product_name
FROM users u
INNER JOIN orders o ON u.user_id = o.user_id
INNER JOIN order_items oi ON o.order_id = oi.order_id
INNER JOIN products p ON oi.product_id = p.product_id
WHERE o.status = 'completed';
```

---

## Common Table Expressions (CTEs)

```sql
-- Use CTEs for complex queries
WITH active_users AS (
    SELECT user_id, email, created_at
    FROM users
    WHERE status = 'active'
),
user_orders AS (
    SELECT
        user_id,
        COUNT(*) AS order_count,
        SUM(total) AS total_spent
    FROM orders
    WHERE status = 'completed'
    GROUP BY user_id
)
SELECT
    au.user_id,
    au.email,
    COALESCE(uo.order_count, 0) AS order_count,
    COALESCE(uo.total_spent, 0) AS total_spent
FROM active_users au
LEFT JOIN user_orders uo ON au.user_id = uo.user_id
ORDER BY uo.total_spent DESC NULLS LAST;

-- Recursive CTE example
WITH RECURSIVE employee_hierarchy AS (
    -- Base case
    SELECT
        employee_id,
        manager_id,
        name,
        1 AS level
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    -- Recursive case
    SELECT
        e.employee_id,
        e.manager_id,
        e.name,
        eh.level + 1
    FROM employees e
    INNER JOIN employee_hierarchy eh ON e.manager_id = eh.employee_id
)
SELECT * FROM employee_hierarchy ORDER BY level, name;
```

---

## INSERT, UPDATE, DELETE

### INSERT

```sql
-- Single row insert
INSERT INTO users (email, first_name, last_name)
VALUES ('user@example.com', 'John', 'Doe');

-- Multiple row insert
INSERT INTO users (email, first_name, last_name)
VALUES
    ('user1@example.com', 'Alice', 'Smith'),
    ('user2@example.com', 'Bob', 'Jones'),
    ('user3@example.com', 'Charlie', 'Brown');

-- INSERT with SELECT
INSERT INTO user_audit (user_id, action, created_at)
SELECT user_id, 'login', CURRENT_TIMESTAMP
FROM users
WHERE last_login < CURRENT_DATE - INTERVAL '30 days';

-- UPSERT (PostgreSQL)
INSERT INTO user_preferences (user_id, theme, language)
VALUES (1, 'dark', 'en')
ON CONFLICT (user_id)
DO UPDATE SET
    theme = EXCLUDED.theme,
    language = EXCLUDED.language,
    updated_at = CURRENT_TIMESTAMP;
```

### UPDATE

```sql
-- Always use WHERE clause
UPDATE users
SET
    status = 'inactive',
    updated_at = CURRENT_TIMESTAMP
WHERE last_login < CURRENT_DATE - INTERVAL '90 days';

-- UPDATE with JOIN
UPDATE orders o
SET status = 'cancelled'
FROM users u
WHERE o.user_id = u.user_id
    AND u.status = 'deleted'
    AND o.status = 'pending';
```

### DELETE

```sql
-- Always use WHERE clause (unless intentional truncation)
DELETE FROM sessions
WHERE expires_at < CURRENT_TIMESTAMP;

-- DELETE with JOIN
DELETE FROM orders
WHERE user_id IN (
    SELECT user_id
    FROM users
    WHERE status = 'deleted'
);
```

---

## Transactions

```sql
-- Explicit transaction control
BEGIN;

UPDATE accounts
SET balance = balance - 100.00
WHERE account_id = 1;

UPDATE accounts
SET balance = balance + 100.00
WHERE account_id = 2;

-- Verify constraints
SELECT balance FROM accounts WHERE account_id IN (1, 2);

COMMIT;

-- Rollback on error
BEGIN;

UPDATE inventory SET quantity = quantity - 5 WHERE product_id = 100;

-- Check if enough inventory
SELECT quantity FROM inventory WHERE product_id = 100;

-- If quantity < 0, rollback
ROLLBACK;
```

---

## Functions and Stored Procedures

### Functions (PostgreSQL)

```sql
-- Function to calculate order total
CREATE OR REPLACE FUNCTION calculate_order_total(p_order_id BIGINT)
RETURNS NUMERIC AS $$
DECLARE
    v_total NUMERIC;
BEGIN
    SELECT SUM(quantity * unit_price)
    INTO v_total
    FROM order_items
    WHERE order_id = p_order_id;

    RETURN COALESCE(v_total, 0);
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT order_id, calculate_order_total(order_id) AS total
FROM orders;
```

### Stored Procedures (PostgreSQL 11+)

```sql
CREATE OR REPLACE PROCEDURE close_expired_orders()
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE orders
    SET
        status = 'expired',
        updated_at = CURRENT_TIMESTAMP
    WHERE status = 'pending'
        AND created_at < CURRENT_TIMESTAMP - INTERVAL '7 days';

    -- Log the operation
    INSERT INTO audit_log (action, affected_rows, created_at)
    VALUES ('close_expired_orders', ROW_COUNT(), CURRENT_TIMESTAMP);

    COMMIT;
END;
$$;

-- Execute procedure
CALL close_expired_orders();
```

---

## Views

```sql
-- Create view for commonly accessed data
CREATE VIEW active_user_orders AS
SELECT
    u.user_id,
    u.email,
    o.order_id,
    o.total,
    o.status,
    o.created_at
FROM users u
INNER JOIN orders o ON u.user_id = o.user_id
WHERE u.status = 'active'
    AND o.status IN ('pending', 'processing', 'shipped');

-- Materialized view (PostgreSQL)
CREATE MATERIALIZED VIEW user_order_summary AS
SELECT
    u.user_id,
    u.email,
    COUNT(o.order_id) AS total_orders,
    SUM(o.total) AS total_spent,
    MAX(o.created_at) AS last_order_date
FROM users u
LEFT JOIN orders o ON u.user_id = o.user_id
WHERE o.status = 'completed'
GROUP BY u.user_id, u.email;

-- Refresh materialized view
REFRESH MATERIALIZED VIEW user_order_summary;
```

---

## Migration Scripts

### Schema Migrations

```sql
-- migration_001_create_users_table.sql
-- @module users_table_migration
-- @description Create users table with indexes
-- @version 1.0.0
-- @author Tyler Dukes
-- @last_updated 2025-10-28

BEGIN;

CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uniq_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);

COMMIT;

-- Rollback script: migration_001_rollback.sql
BEGIN;
DROP TABLE IF EXISTS users CASCADE;
COMMIT;
```

### Data Migrations

```sql
-- migration_002_populate_default_roles.sql
BEGIN;

INSERT INTO roles (role_name, description)
VALUES
    ('admin', 'System administrator'),
    ('user', 'Regular user'),
    ('guest', 'Guest user')
ON CONFLICT (role_name) DO NOTHING;

COMMIT;
```

---

## Query Optimization

### Use Indexes Effectively

```sql
-- Bad - Full table scan
SELECT * FROM users WHERE LOWER(email) = 'user@example.com';

-- Good - Index-friendly query
SELECT * FROM users WHERE email = 'user@example.com';

-- Create functional index if needed
CREATE INDEX idx_users_email_lower ON users(LOWER(email));
```

### Avoid SELECT *

```sql
-- Bad - Retrieves unnecessary data
SELECT * FROM users WHERE user_id = 1;

-- Good - Specify only needed columns
SELECT user_id, email, first_name, last_name
FROM users
WHERE user_id = 1;
```

### Use EXPLAIN

```sql
-- Analyze query performance
EXPLAIN ANALYZE
SELECT u.email, COUNT(o.order_id) AS order_count
FROM users u
LEFT JOIN orders o ON u.user_id = o.user_id
WHERE u.created_at >= '2024-01-01'
GROUP BY u.email
HAVING COUNT(o.order_id) > 5;
```

---

## Testing

### SQL Linting

Use [sqlfluff](https://www.sqlfluff.com/) to lint SQL files:

```bash
## Install sqlfluff
pip install sqlfluff

## Lint SQL files
sqlfluff lint queries/*.sql

## Auto-fix issues
sqlfluff fix queries/*.sql

## Lint with specific dialect
sqlfluff lint --dialect postgres queries/*.sql
```

### Unit Testing with pgTAP

Test PostgreSQL schemas and functions:

```sql
## tests/schema_test.sql
BEGIN;

SELECT plan(5);

-- Test table exists
SELECT has_table('users', 'users table should exist');

-- Test columns
SELECT has_column('users', 'id', 'users should have id column');
SELECT has_column('users', 'email', 'users should have email column');

-- Test constraints
SELECT has_pk('users', 'users should have primary key');

-- Test index
SELECT has_index('users', 'idx_users_email', 'email index should exist');

SELECT * FROM finish();
ROLLBACK;
```

Run with:

```bash
pg_prove -d testdb tests/*.sql
```

### Testing with SQLite

Simple SQL tests:

```bash
## tests/test_queries.sh
#!/bin/bash

## Create test database
sqlite3 test.db < schema.sql

## Test query results
result=$(sqlite3 test.db "SELECT COUNT(*) FROM users;")
if [ "$result" != "0" ]; then
  echo "FAIL: Expected 0 users"
  exit 1
fi

## Insert test data
sqlite3 test.db "INSERT INTO users (name, email) VALUES ('Test', 'test@example.com');"

## Verify insertion
result=$(sqlite3 test.db "SELECT COUNT(*) FROM users WHERE email='test@example.com';")
if [ "$result" != "1" ]; then
  echo "FAIL: User not inserted correctly"
  exit 1
fi

echo "All SQL tests passed"
rm test.db
```

### Integration Testing

Test SQL in application context:

```python
## tests/test_database.py
import pytest
import psycopg2

@pytest.fixture
def db_connection():
    conn = psycopg2.connect(
        host='localhost',
        database='test_db',
        user='test_user',
        password='test_pass'
    )
    yield conn
    conn.close()

def test_user_creation(db_connection):
    cursor = db_connection.cursor()

    # Execute SQL
    cursor.execute("""
        INSERT INTO users (name, email)
        VALUES ('Test User', 'test@example.com')
        RETURNING id;
    """)

    user_id = cursor.fetchone()[0]
    assert user_id is not None

    # Verify
    cursor.execute("SELECT email FROM users WHERE id = %s", (user_id,))
    email = cursor.fetchone()[0]
    assert email == 'test@example.com'

    db_connection.rollback()

def test_query_performance(db_connection):
    import time

    cursor = db_connection.cursor()

    start = time.time()
    cursor.execute("SELECT * FROM large_table WHERE indexed_column = 'value'")
    duration = time.time() - start

    assert duration < 1.0, f"Query too slow: {duration}s"
```

### Testing Migrations

Test database migrations:

```bash
## tests/test_migrations.sh
#!/bin/bash
set -e

## Apply migrations
psql -d test_db -f migrations/001_create_users.sql
psql -d test_db -f migrations/002_add_users_email_index.sql

## Verify schema
result=$(psql -d test_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='users';")
if [ "$result" != "1" ]; then
  echo "FAIL: users table not created"
  exit 1
fi

## Verify index
result=$(psql -d test_db -t -c "SELECT COUNT(*) FROM pg_indexes WHERE indexname='idx_users_email';")
if [ "$result" != "1" ]; then
  echo "FAIL: email index not created"
  exit 1
fi

echo "Migration tests passed"
```

### Testing with Docker

Test SQL in isolated environment:

```yaml
## docker-compose.test.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: test_db
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_pass
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test_user"]
      interval: 5s
      timeout: 3s
      retries: 5

  test:
    image: postgres:15-alpine
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./tests:/tests
      - ./sql:/sql
    environment:
      PGHOST: postgres
      PGDATABASE: test_db
      PGUSER: test_user
      PGPASSWORD: test_pass
    command: >
      sh -c "
        psql -f /sql/schema.sql &&
        psql -f /sql/seed.sql &&
        pg_prove /tests/*.sql
      "
```

Run tests:

```bash
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

### Query Plan Testing

Test query performance:

```sql
-- Explain query plan
EXPLAIN ANALYZE
SELECT u.name, o.total
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.created_at > '2024-01-01';

-- Test index usage
EXPLAIN (FORMAT JSON)
SELECT * FROM users WHERE email = 'test@example.com';
```

### CI/CD Integration

```yaml
## .github/workflows/sql-test.yml
name: SQL Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Install sqlfluff
        run: pip install sqlfluff

      - name: Lint SQL
        run: sqlfluff lint --dialect postgres sql/*.sql

      - name: Run migrations
        env:
          PGHOST: localhost
          PGDATABASE: test_db
          PGUSER: test_user
          PGPASSWORD: test_pass
        run: |
          for file in migrations/*.sql; do
            psql -f "$file"
          done

      - name: Run tests
        env:
          PGHOST: localhost
          PGDATABASE: test_db
          PGUSER: test_user
          PGPASSWORD: test_pass
        run: |
          psql -c "SELECT version();"
          psql -f tests/test_schema.sql
```

### Coverage Testing

Test query coverage:

```sql
-- Record queries executed
CREATE TABLE IF NOT EXISTS query_log (
    id SERIAL PRIMARY KEY,
    query_text TEXT,
    executed_at TIMESTAMP DEFAULT NOW()
);

-- Enable query logging (PostgreSQL)
ALTER SYSTEM SET log_statement = 'all';
SELECT pg_reload_conf();
```

---

## Security Best Practices

### SQL Injection Prevention

Always use parameterized queries; never concatenate user input into SQL.

```sql
-- NEVER DO THIS - Vulnerable to SQL injection
-- Python example showing the vulnerability
query = f"SELECT * FROM users WHERE email = '{user_email}'"  -- DANGEROUS!
-- Attacker input: "' OR '1'='1" exposes all data

-- ALWAYS USE - Parameterized queries (Python example)
query = "SELECT * FROM users WHERE email = %s"
cursor.execute(query, (user_email,))  -- Safe - parameters are escaped

-- ALWAYS USE - Prepared statements (Node.js example)
const query = 'SELECT * FROM users WHERE email = $1';
await client.query(query, [userEmail]);  -- Safe
```

### Access Control and Least Privilege

Grant minimum necessary permissions to database users.

```sql
-- Bad - Granting excessive permissions
GRANT ALL PRIVILEGES ON DATABASE myapp TO app_user;  -- Too broad!
GRANT SUPER ON *.* TO app_user@'%';  -- NEVER grant SUPER!

-- Good - Minimal permissions for application user
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'SecurePassword123!';

GRANT SELECT, INSERT, UPDATE ON myapp.users TO 'app_user'@'localhost';
GRANT SELECT, INSERT, UPDATE ON myapp.orders TO 'app_user'@'localhost';
GRANT EXECUTE ON PROCEDURE myapp.process_order TO 'app_user'@'localhost';

-- Good - Read-only user for reporting
CREATE USER 'report_user'@'localhost' IDENTIFIED BY 'SecurePassword456!';
GRANT SELECT ON myapp.* TO 'report_user'@'localhost';

-- Good - Revoke dangerous permissions
REVOKE FILE, SUPER, PROCESS ON *.* FROM 'app_user'@'localhost';
```

### Data Encryption

Encrypt sensitive data at rest and in transit.

```sql
-- Bad - Storing passwords in plain text
CREATE TABLE users (
    user_id INT PRIMARY KEY,
    email VARCHAR(255),
    password VARCHAR(255)  -- NEVER store passwords in plain text!
);

INSERT INTO users (user_id, email, password)
VALUES (1, 'user@example.com', 'Password123');  -- Exposed!

-- Good - Use application-level hashing (bcrypt, argon2)
-- Store only hashed passwords
CREATE TABLE users (
    user_id INT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,  -- Hashed password
    password_salt VARCHAR(255) NOT NULL,  -- Unique salt
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Good - Encrypt sensitive columns (PostgreSQL example)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE sensitive_data (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    ssn_encrypted BYTEA,  -- Encrypted column
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert encrypted data
INSERT INTO sensitive_data (user_id, ssn_encrypted)
VALUES (1, pgp_sym_encrypt('123-45-6789', 'encryption_key'));

-- Query encrypted data
SELECT user_id, pgp_sym_decrypt(ssn_encrypted, 'encryption_key') AS ssn
FROM sensitive_data
WHERE user_id = 1;

-- Good - Enable SSL/TLS for connections
-- In postgresql.conf:
-- ssl = on
-- ssl_cert_file = 'server.crt'
-- ssl_key_file = 'server.key'
```

### Sensitive Data Handling

Protect PII and implement data masking.

```sql
-- Good - Data masking for non-production environments
CREATE VIEW users_masked AS
SELECT
    user_id,
    CONCAT(LEFT(email, 3), '***@***.com') AS email_masked,
    CONCAT(LEFT(phone, 3), '-***-****') AS phone_masked,
    first_name,
    'REDACTED' AS last_name_masked
FROM users;

-- Good - Row-level security (PostgreSQL)
ALTER TABLE sensitive_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_documents_policy ON sensitive_documents
    FOR SELECT
    USING (owner_id = current_user_id());

-- Good - Column-level permissions
CREATE TABLE employees (
    employee_id INT PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    salary DECIMAL(10,2),  -- Sensitive
    ssn VARCHAR(11)        -- Highly sensitive
);

-- Grant access but hide sensitive columns
GRANT SELECT (employee_id, first_name, last_name) ON employees TO hr_viewer;

-- Only specific roles can see salary
GRANT SELECT (employee_id, first_name, last_name, salary) ON employees TO hr_manager;
```

### Audit Logging

Enable comprehensive audit trails for security monitoring.

```sql
-- Good - Create audit log table
CREATE TABLE audit_log (
    audit_id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(10) NOT NULL,  -- INSERT, UPDATE, DELETE
    user_name VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    old_values JSONB,
    new_values JSONB,
    ip_address INET
);

-- Good - Audit trigger for sensitive tables
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_log (table_name, operation, user_name, old_values, ip_address)
        VALUES (TG_TABLE_NAME, TG_OP, current_user, row_to_json(OLD), inet_client_addr());
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_log (table_name, operation, user_name, old_values, new_values, ip_address)
        VALUES (TG_TABLE_NAME, TG_OP, current_user, row_to_json(OLD), row_to_json(NEW), inet_client_addr());
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_log (table_name, operation, user_name, new_values, ip_address)
        VALUES (TG_TABLE_NAME, TG_OP, current_user, row_to_json(NEW), inet_client_addr());
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply audit trigger to sensitive tables
CREATE TRIGGER users_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER financial_transactions_audit
    AFTER INSERT OR UPDATE OR DELETE ON financial_transactions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
```

### Backup Security

Protect database backups with encryption.

```bash
## Bad - Unencrypted backup
pg_dump myapp > backup.sql  # Plain text backup!
mysqldump -u root -p myapp > backup.sql  # No encryption!

## Good - Encrypted backup (PostgreSQL)
pg_dump myapp | gpg --encrypt --recipient admin@example.com > backup.sql.gpg

## Good - Encrypted backup with compression
pg_dump myapp | gzip | gpg --encrypt --recipient admin@example.com > backup.sql.gz.gpg

## Good - Secure backup permissions
chmod 600 backup.sql.gpg  # Only owner can read/write

## Good - Store backups securely
aws s3 cp backup.sql.gpg s3://secure-backups/ --sse aws:kms --sse-kms-key-id alias/backup-key
```

### Connection Security

Enforce secure database connections.

```sql
-- Good - Require SSL for specific users
ALTER USER app_user REQUIRE SSL;

-- Good - Restrict connections by IP (MySQL)
CREATE USER 'app_user'@'10.0.1.%' IDENTIFIED BY 'SecurePassword123!';  -- Specific subnet only

-- Good - Disable remote root access
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');
FLUSH PRIVILEGES;

-- Good - Connection limits
ALTER USER app_user WITH CONNECTION LIMIT 50;  -- Prevent connection exhaustion
```

### Secure Stored Procedures

Validate inputs and use security definer carefully.

```sql
-- Bad - Stored procedure vulnerable to injection
CREATE PROCEDURE get_user_by_email(IN email_input VARCHAR(255))
BEGIN
    SET @query = CONCAT('SELECT * FROM users WHERE email = "', email_input, '"');  -- VULNERABLE!
    PREPARE stmt FROM @query;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END;

-- Good - Use parameterized queries in procedures
CREATE PROCEDURE get_user_by_email(IN email_input VARCHAR(255))
BEGIN
    SELECT user_id, email, first_name, last_name
    FROM users
    WHERE email = email_input;  -- Safe - parameterized
END;

-- Good - Input validation in stored procedures
CREATE PROCEDURE create_user(
    IN email_input VARCHAR(255),
    IN first_name_input VARCHAR(100)
)
BEGIN
    -- Validate email format
    IF email_input NOT REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid email format';
    END IF;

    -- Validate name length
    IF LENGTH(first_name_input) < 2 OR LENGTH(first_name_input) > 100 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid name length';
    END IF;

    INSERT INTO users (email, first_name) VALUES (email_input, first_name_input);
END;
```

### Prevent Information Disclosure

Avoid exposing sensitive information in error messages.

```sql
-- Bad - Exposing table structure in errors
SELECT * FROM users WHERE user_id = 'invalid';  -- Error reveals table schema!

-- Good - Handle errors gracefully (application level)
-- Python example
try:
    cursor.execute("SELECT * FROM users WHERE user_id = %s", (user_id,))
except DatabaseError as e:
    # Log detailed error server-side
    logger.error(f"Database error: {str(e)}")
    # Return generic error to client
    return {"error": "An error occurred processing your request"}

-- Good - Use views to hide sensitive columns
CREATE VIEW public_user_profile AS
SELECT user_id, username, avatar_url, created_at
FROM users;  -- Hides email, password_hash, etc.

GRANT SELECT ON public_user_profile TO app_user;
REVOKE SELECT ON users FROM app_user;  -- Deny access to full table
```

---

## Common Pitfalls

### NULL Comparison Confusion

**Issue**: Using `= NULL` or `!= NULL` instead of `IS NULL` or `IS NOT NULL` returns unexpected results.

**Example**:

```sql
## Bad - NULL comparisons don't work with = or !=
SELECT * FROM users WHERE email = NULL;  -- ❌ Returns 0 rows (not NULL rows)
SELECT * FROM users WHERE email != NULL;  -- ❌ Also returns 0 rows!

UPDATE users SET status = 'inactive' WHERE last_login = NULL;  -- ❌ Updates 0 rows
```

**Solution**: Use `IS NULL` and `IS NOT NULL` operators.

```sql
## Good - Correct NULL handling
SELECT * FROM users WHERE email IS NULL;  -- ✅ Finds rows where email is NULL

SELECT * FROM users WHERE email IS NOT NULL;  -- ✅ Finds rows with non-NULL email

UPDATE users
SET status = 'inactive'
WHERE last_login IS NULL;  -- ✅ Updates rows with NULL last_login
```

**Key Points**:

- NULL is not equal to anything, including NULL (`NULL = NULL` is false)
- Always use `IS NULL` and `IS NOT NULL` for NULL checks
- `COALESCE(column, 'default')` provides default values for NULLs
- `NULLIF(value1, value2)` returns NULL if values are equal

### Implicit Type Conversion Performance Issues

**Issue**: Comparing different data types forces type conversion, preventing index usage and slowing queries.

**Example**:

```sql
## Bad - String comparison on integer column
SELECT * FROM orders WHERE order_id = '12345';  -- ❌ Forces type conversion, no index

## Bad - Integer comparison on string column
SELECT * FROM users WHERE user_code = 123;  -- ❌ Table scan, not index seek
```

**Solution**: Match data types in comparisons.

```sql
## Good - Correct data types
SELECT * FROM orders WHERE order_id = 12345;  -- ✅ Integer comparison, uses index

SELECT * FROM users WHERE user_code = '123';  -- ✅ String comparison, uses index

## Good - Explicit casting when needed
SELECT *
FROM orders o
JOIN order_items oi ON o.order_id = CAST(oi.order_id_string AS INTEGER);
```

**Key Points**:

- Match column data types in WHERE clauses and JOINs
- Implicit conversion prevents index usage
- Check execution plans for type conversion warnings
- Use explicit `CAST()` or `CONVERT()` when conversion is necessary

### NOT IN with NULL Values

**Issue**: `NOT IN` with a subquery containing NULL values returns no rows unexpectedly.

**Example**:

```sql
## Bad - NOT IN with possible NULLs
SELECT * FROM products
WHERE product_id NOT IN (
    SELECT product_id FROM discontinued_products  -- ❌ If any NULL, returns 0 rows!
);

## This happens because:
## product_id NOT IN (1, 2, NULL)
## is equivalent to:
## product_id != 1 AND product_id != 2 AND product_id != NULL
## The last comparison is always UNKNOWN, so entire condition fails
```

**Solution**: Use `NOT EXISTS` or filter out NULLs.

```sql
## Good - Use NOT EXISTS
SELECT * FROM products p
WHERE NOT EXISTS (
    SELECT 1
    FROM discontinued_products dp
    WHERE dp.product_id = p.product_id  -- ✅ Handles NULLs correctly
);

## Good - Filter NULLs in subquery
SELECT * FROM products
WHERE product_id NOT IN (
    SELECT product_id
    FROM discontinued_products
    WHERE product_id IS NOT NULL  -- ✅ Exclude NULLs
);
```

**Key Points**:

- `NOT IN` fails with NULL values in subquery
- Prefer `NOT EXISTS` over `NOT IN` for subqueries
- `IN` works fine with NULLs, `NOT IN` does not
- Always check for NULL handling in subqueries

### DISTINCT Hiding Performance Issues

**Issue**: Using DISTINCT to fix duplicate rows masks underlying join or query logic problems.

**Example**:

```sql
## Bad - DISTINCT hiding incorrect join
SELECT DISTINCT
    u.username,
    u.email,
    o.order_date  -- ❌ Why duplicates? Probably wrong join!
FROM users u
JOIN orders o ON u.user_id = o.user_id
JOIN order_items oi ON o.order_id = oi.order_id;  -- Cartesian product hidden by DISTINCT
```

**Solution**: Fix the join logic or use appropriate aggregation.

```sql
## Good - Correct join or aggregation
SELECT
    u.username,
    u.email,
    COUNT(DISTINCT o.order_id) AS order_count,
    MAX(o.order_date) AS latest_order
FROM users u
LEFT JOIN orders o ON u.user_id = o.user_id
GROUP BY u.user_id, u.username, u.email;  -- ✅ Proper aggregation

## Or if you really need one row per user with latest order
SELECT
    u.username,
    u.email,
    o.order_date
FROM users u
JOIN LATERAL (
    SELECT order_date
    FROM orders
    WHERE user_id = u.user_id
    ORDER BY order_date DESC
    LIMIT 1
) o ON true;  -- ✅ Explicitly get one order per user
```

**Key Points**:

- DISTINCT is expensive (sorting or hashing)
- DISTINCT often indicates incorrect joins
- Fix the root cause instead of masking with DISTINCT
- Use GROUP BY with aggregation for proper deduplication

### Transaction Isolation Level Misunderstanding

**Issue**: Wrong isolation level causes phantom reads, dirty reads, or unnecessary blocking.

**Example**:

```sql
## Bad - Default isolation may allow dirty reads
BEGIN TRANSACTION;  -- ❌ Default isolation (often READ COMMITTED)

SELECT SUM(balance) FROM accounts WHERE user_id = 123;
-- Another transaction updates balance here
UPDATE accounts SET balance = balance - 100 WHERE user_id = 123;

COMMIT;  -- ❌ Sum may be inconsistent due to concurrent updates

## Bad - SERIALIZABLE causing deadlocks
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN TRANSACTION;

SELECT * FROM inventory WHERE product_id = 1;
-- Locks entire result set, causes deadlocks with concurrent transactions
UPDATE inventory SET quantity = quantity - 1 WHERE product_id = 1;

COMMIT;
```

**Solution**: Choose appropriate isolation level for use case.

```sql
## Good - REPEATABLE READ for consistent reads
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;

SELECT SUM(balance) FROM accounts WHERE user_id = 123;
-- Other transactions can't modify these rows until commit
UPDATE accounts SET balance = balance - 100 WHERE user_id = 123;

COMMIT;

## Good - READ COMMITTED with explicit locking when needed
BEGIN TRANSACTION;

SELECT * FROM inventory
WHERE product_id = 1
FOR UPDATE;  -- ✅ Explicit row lock

UPDATE inventory SET quantity = quantity - 1 WHERE product_id = 1;

COMMIT;

## Good - READ UNCOMMITTED for reports (accept dirty reads)
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

SELECT COUNT(*) FROM large_table;  -- ✅ Fast, no locking, dirty reads OK for reports
```

**Key Points**:

- READ UNCOMMITTED: Fastest, allows dirty reads (use for reports)
- READ COMMITTED: Default, prevents dirty reads
- REPEATABLE READ: Prevents non-repeatable reads, may have phantom reads
- SERIALIZABLE: Strictest, prevents phantom reads, highest locking

---

## Anti-Patterns

### ❌ Avoid: SELECT * in Production

```sql
-- Bad - Over-fetching data
SELECT * FROM users;

-- Good - Explicit columns
SELECT user_id, email, first_name, last_name FROM users;
```

### ❌ Avoid: N+1 Queries

```sql
-- Bad - N+1 query problem (fetching orders for each user in application loop)
-- Application code loop:
-- for each user:
--     SELECT * FROM orders WHERE user_id = ?

-- Good - Single query with JOIN
SELECT
    u.user_id,
    u.email,
    o.order_id,
    o.total
FROM users u
LEFT JOIN orders o ON u.user_id = o.user_id;
```

### ❌ Avoid: Unparameterized Queries

```sql
-- Bad - SQL injection risk
-- query = "SELECT * FROM users WHERE email = '" + user_input + "'"

-- Good - Parameterized query
-- query = "SELECT * FROM users WHERE email = $1"
-- execute(query, [user_input])
```

### ❌ Avoid: Missing WHERE in UPDATE/DELETE

```sql
-- Bad - Updates all rows!
UPDATE users SET status = 'inactive';

-- Good - Specific WHERE clause
UPDATE users
SET status = 'inactive'
WHERE last_login < CURRENT_DATE - INTERVAL '90 days';
```

### ❌ Avoid: Using DISTINCT to Fix Duplicates

```sql
-- Bad - DISTINCT hides the real problem
SELECT DISTINCT
    u.user_id,
    u.email,
    o.order_id
FROM users u
LEFT JOIN orders o ON u.user_id = o.user_id;  -- ❌ Multiple orders create duplicates

-- Good - Fix the JOIN logic
SELECT
    u.user_id,
    u.email,
    ARRAY_AGG(o.order_id) AS order_ids
FROM users u
LEFT JOIN orders o ON u.user_id = o.user_id
GROUP BY u.user_id, u.email;
```

### ❌ Avoid: Not Using Indexes

```sql
-- Bad - Querying without indexes
CREATE TABLE users (
    user_id INT PRIMARY KEY,
    email VARCHAR(255),
    status VARCHAR(50)
);
-- Queries on email and status will be slow!

-- Good - Add appropriate indexes
CREATE TABLE users (
    user_id INT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);
```

### ❌ Avoid: Large IN Clauses

```sql
-- Bad - Large IN clause (thousands of IDs)
SELECT * FROM orders
WHERE user_id IN (1, 2, 3, ..., 10000);  -- ❌ Performance issues!

-- Good - Use temporary table or JOIN
CREATE TEMP TABLE temp_user_ids (user_id INT);
INSERT INTO temp_user_ids VALUES (1), (2), (3), ..., (10000);

SELECT o.*
FROM orders o
INNER JOIN temp_user_ids t ON o.user_id = t.user_id;
```

---

## Best Practices

### Index Strategically

Create indexes on frequently queried columns:

```sql
-- Index foreign keys
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Composite index for common query patterns
CREATE INDEX idx_orders_status_created ON orders(status, created_at);

-- Partial index for specific conditions
CREATE INDEX idx_active_users ON users(email) WHERE status = 'active';
```

### Use Parameterized Queries

Prevent SQL injection with parameterized queries:

```sql
-- Good - Parameterized (Python example)
cursor.execute(
    "SELECT * FROM users WHERE email = %s",
    (user_email,)
)

-- Bad - String interpolation (SQL injection risk)
-- cursor.execute(f"SELECT * FROM users WHERE email = '{user_email}'")
```

### Optimize JOIN Performance

Choose the right JOIN type and order:

```sql
-- Good - Filter before joining
SELECT u.name, o.total
FROM (
    SELECT user_id, name
    FROM users
    WHERE status = 'active'
) u
INNER JOIN orders o ON u.user_id = o.user_id;

-- Use appropriate JOIN hints when needed
SELECT /*+ ORDERED */ u.name, o.total
FROM users u
INNER JOIN orders o ON u.user_id = o.user_id;
```

### Limit Result Sets

Always use LIMIT/TOP for potentially large result sets:

```sql
-- Pagination with LIMIT/OFFSET
SELECT user_id, email
FROM users
ORDER BY created_at DESC
LIMIT 100 OFFSET 0;

-- Modern pagination with keyset
SELECT user_id, email, created_at
FROM users
WHERE created_at < '2024-01-01'
ORDER BY created_at DESC
LIMIT 100;
```

### Use Transactions Appropriately

Wrap related operations in transactions:

```sql
BEGIN TRANSACTION;

UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;
UPDATE accounts SET balance = balance + 100 WHERE account_id = 2;

INSERT INTO transaction_log (from_account, to_account, amount)
VALUES (1, 2, 100);

COMMIT;
```

### Explicitly List Columns (Avoid SELECT *)

Explicitly list columns you need:

```sql
-- Good - Specific columns
SELECT user_id, email, created_at
FROM users
WHERE status = 'active';

-- Bad - SELECT * wastes bandwidth
-- SELECT * FROM users WHERE status = 'active';
```

### Use CTEs for Readability

Common Table Expressions improve query readability:

```sql
WITH active_users AS (
    SELECT user_id, email
    FROM users
    WHERE status = 'active'
),
recent_orders AS (
    SELECT user_id, COUNT(*) AS order_count
    FROM orders
    WHERE created_at > CURRENT_DATE - INTERVAL '30 days'
    GROUP BY user_id
)
SELECT
    au.email,
    COALESCE(ro.order_count, 0) AS orders_last_30_days
FROM active_users au
LEFT JOIN recent_orders ro ON au.user_id = ro.user_id;
```

### Analyze Query Performance

Use EXPLAIN to understand query execution:

```sql
-- PostgreSQL
EXPLAIN ANALYZE
SELECT u.email, COUNT(o.order_id)
FROM users u
LEFT JOIN orders o ON u.user_id = o.user_id
GROUP BY u.email;

-- MySQL
EXPLAIN FORMAT=JSON
SELECT u.email, COUNT(o.order_id)
FROM users u
LEFT JOIN orders o ON u.user_id = o.user_id
GROUP BY u.email;
```

### Handle NULLs Explicitly

Be explicit about NULL handling:

```sql
-- Good - Explicit NULL handling
SELECT
    user_id,
    COALESCE(phone, 'Not provided') AS phone,
    NULLIF(email, '') AS email  -- Convert empty strings to NULL
FROM users;

-- Check for NULL explicitly
WHERE email IS NOT NULL
  AND status IS NOT NULL;
```

### Use Database Constraints

Enforce data integrity at the database level:

```sql
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    age INTEGER CHECK (age >= 18),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended'))
);

-- Foreign key constraints
ALTER TABLE orders
    ADD CONSTRAINT fk_orders_users
    FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE;
```

## Comments

```sql
-- Single-line comment for simple explanations
SELECT user_id, email FROM users; -- Active users only

/*
 * Multi-line comment for complex logic
 * This query calculates user lifetime value based on:
 * - Total completed orders
 * - Average order value
 * - Customer tenure
 */
SELECT
    u.user_id,
    u.email,
    COUNT(o.order_id) AS total_orders,
    AVG(o.total) AS avg_order_value,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.created_at)) AS years_active
FROM users u
LEFT JOIN orders o ON u.user_id = o.user_id
WHERE o.status = 'completed'
GROUP BY u.user_id, u.email, u.created_at;
```

---

## References

### SQL Standards

- [SQL-92 Standard](https://www.iso.org/standard/16663.html)
- [Modern SQL](https://modern-sql.com/) - SQL features across databases

### Database-Specific Documentation

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [SQL Server Documentation](https://docs.microsoft.com/en-us/sql/)

### Tools

- [sqlfluff](https://www.sqlfluff.com/) - SQL linter
- [pgFormatter](https://github.com/darold/pgFormatter) - PostgreSQL formatter
- [DBeaver](https://dbeaver.io/) - Universal database tool

---

**Status**: Active
