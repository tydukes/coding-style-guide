---
title: "JSON Style Guide"
description: "JSON configuration and data exchange standards for consistent, valid, and maintainable JSON"
author: "Tyler Dukes"
tags: [json, configuration, data, serialization, api]
category: "Language Guides"
status: "active"
---

## Language Overview

**JSON** (JavaScript Object Notation) is a lightweight data-interchange format that is easy for humans to read and
write and easy for machines to parse and generate. This guide covers JSON standards for configuration files, API
responses, and data exchange.

### Key Characteristics

- **Paradigm**: Data serialization, configuration
- **File Extension**: `.json`
- **Primary Use**: API responses, configuration files, data storage, package manifests
- **Indentation**: 2 spaces (consistent across all JSON files)

---

## Quick Reference

| **Category** | **Convention** | **Example** | **Notes** |
|-------------|----------------|-------------|-----------|
| **Syntax** | | | |
| Indentation | 2 spaces | `"key": "value"` | Consistent 2-space indentation |
| Key Names | `camelCase` or `snake_case` | `"userName"` or `"user_name"` | Be consistent project-wide |
| Quotes | Double quotes only | `"key": "value"` | Strings must use double quotes |
| Trailing Commas | Not allowed | `{"a": 1, "b": 2}` | No comma after last element |
| **Data Types** | | | |
| String | `"text"` | `"hello world"` | Double-quoted text |
| Number | Numeric | `42`, `3.14`, `-10` | Integer or float |
| Boolean | `true` / `false` | `"active": true` | Lowercase only |
| Null | `null` | `"value": null` | Explicit null value |
| Array | `[...]` | `[1, 2, 3]` | Ordered collection |
| Object | `{...}` | `{"key": "value"}` | Key-value pairs |
| **Formatting** | | | |
| Arrays (short) | Single line | `[1, 2, 3]` | If fits on one line |
| Arrays (long) | Multi-line | `[\n  "item1",\n  "item2"\n]` | One item per line |
| Objects (short) | Single line | `{"id": 1}` | If fits on one line |
| Objects (long) | Multi-line | `{\n  "key": "value"\n}` | One property per line |
| **Best Practices** | | | |
| Validation | Use JSON Schema | Define structure and constraints | Validate with schema |
| Comments | Not supported | Use description fields | JSON doesn't allow comments |
| File Size | Keep reasonable | Consider NDJSON for large data | Split large files |
| **Files** | | | |
| Extension | `.json` | `config.json`, `package.json` | Always `.json` |
| Encoding | UTF-8 | `UTF-8 without BOM` | Standard encoding |

---

## Basic Syntax

### Objects

```json
{
  "name": "my-application",
  "version": "1.0.0",
  "description": "A sample application"
}
```

### Arrays

```json
{
  "fruits": ["apple", "banana", "orange"],
  "numbers": [1, 2, 3, 4, 5]
}
```

### Nested Structures

```json
{
  "application": {
    "name": "my-app",
    "version": "1.0.0",
    "config": {
      "database": {
        "host": "localhost",
        "port": 5432
      },
      "cache": {
        "type": "redis",
        "ttl": 3600
      }
    }
  }
}
```

---

## Data Types

### Strings

```json
{
  "name": "John Doe",
  "description": "A string with \"escaped quotes\"",
  "path": "C:\\Windows\\System32",
  "unicode": "Hello \u4e16\u754c",
  "url": "https://example.com/path?query=value"
}
```

### Numbers

```json
{
  "integer": 42,
  "float": 3.14159,
  "negative": -100,
  "exponential": 1.23e-4,
  "zero": 0
}
```

### Booleans

```json
{
  "enabled": true,
  "disabled": false
}
```

### Null

```json
{
  "value": null,
  "optional_field": null
}
```

### Array Types

```json
{
  "empty_array": [],
  "numbers": [1, 2, 3],
  "mixed_types": [1, "two", true, null],
  "nested_arrays": [
    [1, 2],
    [3, 4]
  ],
  "objects": [
    { "id": 1, "name": "Alice" },
    { "id": 2, "name": "Bob" }
  ]
}
```

---

## Package Configuration

### package.json (Node.js)

```json
{
  "name": "my-application",
  "version": "1.0.0",
  "description": "A Node.js application",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "jest",
    "lint": "eslint src/",
    "build": "webpack --mode production"
  },
  "keywords": ["nodejs", "application"],
  "author": "Tyler Dukes <tyler@example.com>",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.0",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "eslint": "^8.0.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

### tsconfig.json (TypeScript)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

### .eslintrc.json (ESLint)

```json
{
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module"
  },
  "plugins": ["@typescript-eslint"],
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "error",
    "quotes": ["error", "single"],
    "semi": ["error", "always"]
  },
  "env": {
    "node": true,
    "es2022": true
  }
}
```

---

## API Response Format

### Success Response

```json
{
  "status": "success",
  "data": {
    "id": 123,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "created_at": "2025-01-15T10:30:00Z"
  },
  "metadata": {
    "timestamp": "2025-01-15T10:30:00Z",
    "version": "1.0.0"
  }
}
```

### Error Response

```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email address",
    "details": {
      "field": "email",
      "value": "invalid-email",
      "constraint": "Must be a valid email address"
    }
  },
  "metadata": {
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

### Paginated Response

```json
{
  "status": "success",
  "data": [
    { "id": 1, "name": "Item 1" },
    { "id": 2, "name": "Item 2" },
    { "id": 3, "name": "Item 3" }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "per_page": 10,
    "total_pages": 10,
    "has_next": true,
    "has_prev": false
  }
}
```

---

## JSON Schema

### Defining a Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "User",
  "type": "object",
  "properties": {
    "id": {
      "type": "integer",
      "minimum": 1
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "age": {
      "type": "integer",
      "minimum": 0,
      "maximum": 150
    },
    "roles": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["admin", "user", "guest"]
      },
      "minItems": 1,
      "uniqueItems": true
    }
  },
  "required": ["id", "name", "email"]
}
```

---

## Comments in JSON

JSON does not support comments. Use these alternatives:

### JSON5 (with comments)

```json5
{
  // This is a comment
  "name": "my-app",
  /* Multi-line
     comment */
  "version": "1.0.0"
}
```

### JSONC (VSCode configuration)

```jsonc
{
  // VSCode settings
  "editor.tabSize": 2,
  "editor.insertSpaces": true
}
```

### Standard JSON with Comment Keys

```json
{
  "_comment": "This is a workaround for comments",
  "name": "my-app",
  "version": "1.0.0"
}
```

---

## Formatting

### Indentation

Always use **2 spaces**:

```json
{
  "level1": {
    "level2": {
      "level3": "value"
    }
  }
}
```

### Array Formatting

```json
{
  "short_array": [1, 2, 3],
  "long_array": [
    "item1",
    "item2",
    "item3",
    "item4"
  ]
}
```

### Object Formatting

```json
{
  "small_object": { "key": "value" },
  "large_object": {
    "key1": "value1",
    "key2": "value2",
    "key3": "value3"
  }
}
```

---

## Testing

### Schema Validation

Use [JSON Schema](https://json-schema.org/) to validate JSON files:

```json
## schema/config.schema.json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["name", "version", "environment"],
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1
    },
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$"
    },
    "environment": {
      "type": "string",
      "enum": ["development", "staging", "production"]
    },
    "port": {
      "type": "integer",
      "minimum": 1024,
      "maximum": 65535
    }
  }
}
```

### Validating with ajv

```bash
## Install ajv-cli
npm install -g ajv-cli

## Validate JSON against schema
ajv validate -s schema/config.schema.json -d config.json

## Validate multiple files
ajv validate -s schema/config.schema.json -d "configs/*.json"
```

### Automated Validation in CI/CD

```yaml
## .github/workflows/validate-json.yml
name: Validate JSON

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install ajv-cli
        run: npm install -g ajv-cli

      - name: Validate JSON files
        run: |
          for file in **/*.json; do
            echo "Validating $file"
            ajv validate -s schema/config.schema.json -d "$file"
          done
```

### Linting JSON

```bash
## Install jsonlint
npm install -g jsonlint

## Lint JSON file
jsonlint config.json

## Lint with quiet mode
jsonlint -q config.json

## Lint multiple files
find . -name "*.json" -exec jsonlint {} \;
```

### Testing with jq

Validate JSON structure and content:

```bash
## Check if file is valid JSON
jq empty config.json

## Validate specific fields exist
jq -e '.name' config.json
jq -e '.version' config.json

## Test field values
if [ "$(jq -r '.environment' config.json)" != "production" ]; then
  echo "Invalid environment"
  exit 1
fi

## Validate array length
if [ "$(jq '.servers | length' config.json)" -lt 2 ]; then
  echo "Must have at least 2 servers"
  exit 1
fi
```

### Testing JSON API Responses

```bash
## Test API response structure
response=$(curl -s https://api.example.com/users/1)

## Validate response is valid JSON
echo "$response" | jq empty

## Validate required fields
echo "$response" | jq -e '.id, .name, .email' > /dev/null

## Test specific values
user_id=$(echo "$response" | jq -r '.id')
if [ "$user_id" != "1" ]; then
  echo "Unexpected user ID"
  exit 1
fi
```

### JSON Diff Testing

Compare JSON files:

```bash
## Install json-diff
npm install -g json-diff

## Compare two JSON files
json-diff config-old.json config-new.json

## Colorized output
json-diff --color config-old.json config-new.json

## Keys only
json-diff --keys-only config-old.json config-new.json
```

### Testing in Scripts

```javascript
## test/json-validation.test.js
const Ajv = require('ajv');
const fs = require('fs');

describe('JSON Configuration Tests', () => {
  let ajv;
  let schema;

  beforeAll(() => {
    ajv = new Ajv();
    schema = JSON.parse(fs.readFileSync('schema/config.schema.json', 'utf8'));
  });

  test('config.json should be valid', () => {
    const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
    const validate = ajv.compile(schema);
    const valid = validate(config);

    expect(valid).toBe(true);
    if (!valid) {
      console.error(validate.errors);
    }
  });

  test('production config should have required security settings', () => {
    const config = JSON.parse(fs.readFileSync('config.production.json', 'utf8'));

    expect(config.ssl.enabled).toBe(true);
    expect(config.auth.required).toBe(true);
  });
});
```

### Pre-commit Hook for JSON Validation

```yaml
## .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: check-json
      - id: pretty-format-json
        args: ['--autofix', '--indent=2', '--no-sort-keys']

  - repo: https://github.com/python-jsonschema/check-jsonschema
    rev: 0.27.0
    hooks:
      - id: check-jsonschema
        name: Validate JSON configs
        files: "config.*\\.json$"
        args: ["--schemafile", "schema/config.schema.json"]
```

### Performance Testing JSON Processing

```bash
## Test JSON file size
size=$(stat -f%z config.json 2>/dev/null || stat -c%s config.json)
max_size=$((1024 * 1024))  # 1MB

if [ "$size" -gt "$max_size" ]; then
  echo "JSON file too large: $(($size / 1024))KB"
  exit 1
fi

## Test parsing performance
time jq '.' large-file.json > /dev/null
```

---

## Security Best Practices

### Never Store Secrets in JSON

JSON files are often committed to version control - never store sensitive data:

```json
// Bad - Secrets in JSON (especially in version control)
{
  "database": {
    "host": "db.example.com",
    "password": "MySecretPassword123",  // ❌ Exposed!
    "apiKey": "sk-1234567890abcdef"     // ❌ Hardcoded!
  }
}

// Good - Use placeholders for environment variables
{
  "database": {
    "host": "${DB_HOST}",
    "password": "${DB_PASSWORD}",  // ✅ From environment
    "apiKey": "${API_KEY}"
  }
}

// Good - Reference external secure storage
{
  "database": {
    "host": "db.example.com",
    "password": "vault://secrets/db/password",
    "apiKey": "ssm:///myapp/api-key"
  }
}
```

**Key Points**:

- Never commit secrets to version control
- Use environment variables for sensitive data
- Reference secret management systems (Vault, AWS Secrets Manager)
- Use `.env` files (gitignored) for local development
- Scan repositories for accidentally committed secrets

### Validate JSON Schema

Always validate JSON against a schema to prevent injection and data corruption:

```typescript
// Good - Validate with JSON Schema
import Ajv from 'ajv';

const schema = {
  type: 'object',
  properties: {
    username: { type: 'string', pattern: '^[a-zA-Z0-9_-]+$' },
    email: { type: 'string', format: 'email' },
    age: { type: 'integer', minimum: 0, maximum: 150 }
  },
  required: ['username', 'email'],
  additionalProperties: false  // ✅ Prevent unexpected properties
};

const ajv = new Ajv();
const validate = ajv.compile(schema);

function processUserData(data: unknown) {
  if (!validate(data)) {
    throw new Error(`Invalid data: ${ajv.errorsText(validate.errors)}`);
  }
  // Safe to use validated data
  return data;
}
```

**Key Points**:

- Define JSON schemas for all data structures
- Validate all external JSON input
- Use `additionalProperties: false` to prevent unexpected fields
- Enforce format constraints (email, URL, date)
- Fail fast on invalid data

### Prevent JSON Injection

Sanitize data before embedding in JSON:

```javascript
// Bad - String concatenation (injection risk)
const userInput = '", "isAdmin": true, "fake": "';
const json = `{"username": "${userInput}"}`;  // ❌ Injected admin field!
// Result: {"username": "", "isAdmin": true, "fake": ""}

// Good - Use JSON.stringify (automatic escaping)
const userInput = '"; DROP TABLE users; --';
const safeJson = JSON.stringify({ username: userInput });  // ✅ Properly escaped

// Good - Validate before parsing
function safeJSONParse(text: string): unknown {
  try {
    const parsed = JSON.parse(text);
    // Validate against schema here
    return parsed;
  } catch (error) {
    throw new Error('Invalid JSON');
  }
}
```

**Key Points**:

- Always use `JSON.stringify()` and `JSON.parse()`
- Never build JSON with string concatenation
- Validate after parsing
- Sanitize user inputs before JSON encoding
- Use TypeScript for type safety

### Limit JSON Size

Prevent denial of service from large JSON payloads:

```javascript
// Good - Limit JSON payload size
import express from 'express';

const app = express();

app.use(express.json({
  limit: '100kb',  // ✅ Limit payload size
  strict: true,    // Only accept objects and arrays
}));

// Good - Streaming parser for large files
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';

const pipeline = fs.createReadStream('large-file.json')
  .pipe(parser())
  .pipe(streamArray())
  .on('data', ({ value }) => {
    // Process each item individually
    processItem(value);
  });
```

**Key Points**:

- Set maximum payload size limits
- Use streaming parsers for large files
- Implement timeouts for JSON parsing
- Monitor memory usage
- Reject deeply nested structures

### Sanitize Output

Prevent Cross-Site Scripting (XSS) when displaying JSON in HTML:

```javascript
// Bad - Directly embedding JSON in HTML
const data = { name: '<script>alert("XSS")</script>' };
const html = `<div>${JSON.stringify(data)}</div>`;  // ❌ XSS vulnerability!

// Good - Properly escape for HTML context
function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

const safeHTML = `<div>${escapeHTML(JSON.stringify(data))}</div>`;  // ✅ Safe
```

**Key Points**:

- Escape JSON before embedding in HTML
- Use Content Security Policy (CSP) headers
- Avoid `innerHTML` with user-controlled JSON
- Use safe templating libraries
- Sanitize before display

### File Access Control

Protect JSON configuration files with appropriate permissions:

```bash
## Good - Restrictive file permissions
# Configuration files (readable by application)
chmod 640 config.json
chown app:app config.json

# Secrets files (readable only by application)
chmod 600 secrets.json
chown app:app secrets.json

# Public configuration
chmod 644 public-config.json
```

**Key Points**:

- Set restrictive file permissions (600 or 640)
- Use appropriate file ownership
- Never make secrets world-readable
- Audit file access regularly
- Encrypt sensitive JSON files at rest

---

## Common Pitfalls

### Trailing Commas Breaking Parsers

**Issue**: Adding trailing commas (common in JavaScript) causes JSON parsers to fail.

**Example**:

```json
{
  "name": "John",
  "age": 30,
  "email": "john@example.com",
}
```

**Solution**: Remove all trailing commas.

```json
{
  "name": "John",
  "age": 30,
  "email": "john@example.com"
}
```

**Key Points**:

- JSON specification forbids trailing commas
- Most JSON parsers will reject trailing commas
- Use JSON linter to catch trailing commas
- JavaScript allows trailing commas, JSON does not

### Number Precision Loss

**Issue**: Large integers lose precision when parsed as JavaScript numbers due to IEEE 754 limits.

**Example**:

```json
{
  "user_id": 9007199254740993,
  "transaction_id": 12345678901234567890
}
```

**Solution**: Use strings for large integers or IDs.

```json
{
  "user_id": "9007199254740993",
  "transaction_id": "12345678901234567890",
  "amount_cents": 1299,
  "precision_decimal": "123.456789012345"
}
```

**Key Points**:

- JavaScript max safe integer: 2^53 - 1 (9,007,199,254,740,991)
- Database IDs often exceed this limit
- Use strings for IDs, UUIDs, and high-precision numbers
- Keep numeric types only for actual calculations

### Comment Attempts

**Issue**: Trying to add comments using `//` or `/* */` breaks JSON parsing.

**Example**:

```json
{
  // This is a comment
  "name": "John",
  /* Multi-line
     comment */
  "age": 30
}
```

**Solution**: Use a designated key for comments or switch to JSON5/JSONC if comments are needed.

```json
{
  "_comment": "User configuration",
  "name": "John",
  "age": 30,
  "_note_age": "Age is optional for legacy users"
}
```

**Key Points**:

- Standard JSON does not support comments
- Use `_comment`, `_note`, or similar keys for documentation
- Consider JSON5 or JSONC for config files needing comments
- Remove comment keys before production if needed

### String Escaping Confusion

**Issue**: Incorrectly escaping special characters or forgetting to escape quotes.

**Example**:

```json
{
  "path": "C:\Users\John\Documents",
  "message": "She said "hello"",
  "regex": "\d+"
}
```

**Solution**: Properly escape backslashes and quotes.

```json
{
  "path": "C:\\Users\\John\\Documents",
  "message": "She said \"hello\"",
  "regex": "\\d+",
  "newline": "Line 1\\nLine 2"
}
```

**Key Points**:

- Always escape backslashes: `\` becomes `\\`
- Escape double quotes inside strings: `"` becomes `\"`
- Common escapes: `\n` (newline), `\t` (tab), `\r` (carriage return)
- JSON does not support single-quoted strings

### Type Inconsistency

**Issue**: Mixing data types for the same field causes parsing and validation issues.

**Example**:

```json
[
  {
    "user_id": 123,
    "active": true
  },
  {
    "user_id": "456",
    "active": "yes"
  }
]
```

**Solution**: Maintain consistent types across all instances.

```json
[
  {
    "user_id": 123,
    "active": true
  },
  {
    "user_id": 456,
    "active": true
  }
]
```

**Key Points**:

- Keep field types consistent across all objects
- Define and enforce a schema
- Boolean values: `true` or `false`, not `"true"` or `1`
- Numbers: `123`, not `"123"` (unless it's an ID)

---

## Anti-Patterns

### ❌ Avoid: Trailing Commas

```json
// Bad - Trailing comma (invalid JSON)
{
  "name": "my-app",
  "version": "1.0.0",
}

// Good - No trailing comma
{
  "name": "my-app",
  "version": "1.0.0"
}
```

### ❌ Avoid: Single Quotes

```json
// Bad - Single quotes (invalid JSON)
{
  'name': 'my-app'
}

// Good - Double quotes
{
  "name": "my-app"
}
```

### ❌ Avoid: Unquoted Keys

```json
// Bad - Unquoted keys (invalid JSON)
{
  name: "my-app"
}

// Good - Quoted keys
{
  "name": "my-app"
}
```

### ❌ Avoid: Comments in Standard JSON

```json
// Bad - Comments in standard JSON (invalid)
{
  // This is a comment
  "name": "my-app"
}

// Good - No comments (use JSONC or JSON5 if needed)
{
  "name": "my-app"
}
```

### ❌ Avoid: Deep Nesting

```json
// Bad - Deeply nested structure (hard to maintain)
{
  "app": {
    "config": {
      "database": {
        "connections": {
          "primary": {
            "settings": {
              "host": "localhost",
              "port": 5432
            }
          }
        }
      }
    }
  }
}

// Good - Flatter structure
{
  "app_database_host": "localhost",
  "app_database_port": 5432
}

// Or use references
{
  "database_settings": {
    "host": "localhost",
    "port": 5432
  },
  "app_config": {
    "database": "$ref:database_settings"
  }
}
```

### ❌ Avoid: Inconsistent Naming Conventions

```json
// Bad - Mixed naming styles
{
  "firstName": "John",
  "last_name": "Doe",
  "EmailAddress": "john@example.com",
  "phone-number": "555-1234"
}

// Good - Consistent camelCase (or snake_case throughout)
{
  "firstName": "John",
  "lastName": "Doe",
  "emailAddress": "john@example.com",
  "phoneNumber": "555-1234"
}
```

### ❌ Avoid: Storing Sensitive Data

```json
// Bad - Sensitive data in JSON (especially in version control)
{
  "database": {
    "password": "MySecretPassword123",
    "apiKey": "sk-1234567890abcdef"
  }
}

// Good - Use environment variables or secure vaults
{
  "database": {
    "password": "${DB_PASSWORD}",
    "apiKey": "${API_KEY}"
  }
}

// Or reference external secure storage
{
  "database": {
    "password": "vault://secrets/db/password",
    "apiKey": "vault://secrets/api/key"
  }
}
```

---

## JSON Validation

### Using jq

```bash
## Validate JSON file
jq empty config.json

## Pretty print
jq . config.json

## Extract specific field
jq '.name' package.json

## Filter array
jq '.users[] | select(.age > 18)' users.json
```

### Using jsonlint

```bash
## Validate JSON
jsonlint config.json

## Format JSON
jsonlint -i config.json
```

### Using Python

```python
import json

## Validate JSON
with open('config.json') as f:
    try:
        data = json.load(f)
        print("Valid JSON")
    except json.JSONDecodeError as e:
        print(f"Invalid JSON: {e}")

## Pretty print
print(json.dumps(data, indent=2))
```

---

## Tool Configurations

### VSCode settings.json

```json
{
  "json.schemas": [
    {
      "fileMatch": ["package.json"],
      "url": "https://json.schemastore.org/package.json"
    },
    {
      "fileMatch": ["tsconfig.json"],
      "url": "https://json.schemastore.org/tsconfig.json"
    }
  ],
  "json.format.enable": true,
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true,
    "editor.tabSize": 2
  },
  "[jsonc]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### .prettierrc (Prettier)

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "none",
  "printWidth": 100,
  "arrowParens": "always"
}
```

---

## Best Practices

### Use Schema Validation

Define and validate JSON structure with JSON Schema:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "User",
  "type": "object",
  "required": ["id", "email"],
  "properties": {
    "id": {
      "type": "integer",
      "minimum": 1
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "age": {
      "type": "integer",
      "minimum": 0,
      "maximum": 150
    }
  }
}
```

### Validate Before Parsing

Always validate JSON before parsing to prevent errors:

```python
import json
from jsonschema import validate, ValidationError

try:
    data = json.loads(json_string)
    validate(instance=data, schema=user_schema)
except json.JSONDecodeError as e:
    print(f"Invalid JSON: {e}")
except ValidationError as e:
    print(f"Schema validation failed: {e}")
```

### Use Consistent Casing

Choose one casing style and stick to it:

```json
// Good - camelCase (JavaScript/TypeScript projects)
{
  "userId": 123,
  "firstName": "John",
  "createdAt": "2024-01-01T00:00:00Z"
}

// Good - snake_case (Python/Ruby projects)
{
  "user_id": 123,
  "first_name": "John",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Avoid Deep Nesting

Keep nesting levels reasonable (max 3-4 levels):

```json
// Bad - Too deeply nested
{
  "user": {
    "profile": {
      "address": {
        "location": {
          "coordinates": {
            "lat": 40.7128,
            "lng": -74.0060
          }
        }
      }
    }
  }
}

// Good - Flattened structure
{
  "userId": 123,
  "addressLat": 40.7128,
  "addressLng": -74.0060
}
```

### Use Arrays for Lists

Always use arrays for lists, even with one item:

```json
// Good - Consistent array usage
{
  "users": [
    {"id": 1, "name": "John"}
  ]
}

// Bad - Inconsistent (object when multiple, single value when one)
{
  "user": {"id": 1, "name": "John"}
}
```

### Include Metadata

Add version and timestamp metadata for API responses:

```json
{
  "meta": {
    "version": "1.0",
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "abc-123"
  },
  "data": {
    "users": [...]
  }
}
```

### Handle Null Values Consistently

Be explicit about null handling:

```json
// Good - Explicit null
{
  "name": "John",
  "middleName": null,
  "phone": "+1234567890"
}

// Consider omitting null fields entirely
{
  "name": "John",
  "phone": "+1234567890"
}
```

### Use ISO 8601 for Dates

Always use ISO 8601 format for dates:

```json
{
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T14:45:30.123Z",
  "date": "2024-01-15"
}
```

### Minify for Production

Minify JSON in production, pretty-print for development:

```bash
# Development - pretty print
cat data.json | jq '.'

# Production - minified
cat data.json | jq -c '.'
```

### Version Your APIs

Include API version in JSON responses:

```json
{
  "apiVersion": "2.0",
  "data": {
    "users": [...]
  },
  "links": {
    "self": "/api/v2/users",
    "docs": "/api/v2/docs"
  }
}
```

## References

### Official Documentation

- [JSON Specification](https://www.json.org/)
- [RFC 8259](https://datatracker.ietf.org/doc/html/rfc8259) - JSON Standard
- [JSON Schema](https://json-schema.org/) - Schema validation

### Tools

- [jq](https://stedolan.github.io/jq/) - Command-line JSON processor
- [jsonlint](https://github.com/zaach/jsonlint) - JSON validator
- [JSON Formatter](https://jsonformatter.org/) - Online JSON formatter

### Schema Repositories

- [JSON Schema Store](https://www.schemastore.org/) - Collection of JSON schemas

---

**Version**: 1.0.0
**Status**: Active
