---
title: "JSON Style Guide"
description: "JSON configuration and data exchange standards for consistent, valid, and maintainable JSON"
author: "Tyler Dukes"
date: "2025-10-28"
tags: [json, configuration, data, serialization, api]
category: "Language Guides"
status: "active"
version: "1.0.0"
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

---

## JSON Validation

### Using jq

```bash
# Validate JSON file
jq empty config.json

# Pretty print
jq . config.json

# Extract specific field
jq '.name' package.json

# Filter array
jq '.users[] | select(.age > 18)' users.json
```

### Using jsonlint

```bash
# Validate JSON
jsonlint config.json

# Format JSON
jsonlint -i config.json
```

### Using Python

```python
import json

# Validate JSON
with open('config.json') as f:
    try:
        data = json.load(f)
        print("Valid JSON")
    except json.JSONDecodeError as e:
        print(f"Invalid JSON: {e}")

# Pretty print
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
**Last Updated**: 2025-10-28
**Status**: Active
