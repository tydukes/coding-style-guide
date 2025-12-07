---
title: "SQL Style Guide"
description: "Database-agnostic SQL standards for queries, schemas, and migrations"
author: "Tyler Dukes"
date: "2025-10-28"
tags: [sql, database, queries, data, standards]
category: "Language Guides"
status: "active"
version: "1.0.0"
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

**Version**: 1.0.0
**Last Updated**: 2025-10-28
**Status**: Active
