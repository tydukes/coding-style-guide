---
title: "SQL Style Guide"
description: "Database-agnostic SQL standards for queries, schemas, and migrations"
author: "Tyler Dukes"
date: "2025-10-28"
tags: [sql, database, queries, data, standards]
category: "Language Guides"
status: "needs-expansion"
version: "0.1.0"
---


- Use lowercase keywords and snake_case identifiers (your preference).
- Include comments for complex queries and use parameterized statements.

## Example

```sql
-- @module: user_queries
select id, first_name from users where active = true;
```
