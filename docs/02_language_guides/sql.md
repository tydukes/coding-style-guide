# SQL Style Guide

- Use lowercase keywords and snake_case identifiers (your preference).
- Include comments for complex queries and use parameterized statements.

## Example

```sql
-- @module: user_queries
select id, first_name from users where active = true;
```
