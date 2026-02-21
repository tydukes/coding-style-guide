---
title: "Complete TypeScript Library Example"
description: "Production-ready TypeScript validation library (ts-validator) demonstrating modern library development, testing, bundling, and publishing"
author: "Tyler Dukes"
tags: [typescript, library, validation, npm, testing, bundling]
category: "Examples"
status: "active"
search_keywords: [typescript, library example, npm, package, jest, sample project]
---

## Overview

This example demonstrates a complete, production-ready TypeScript library that follows modern
best practices for library development, testing, bundling, and publishing to NPM.

**Library**: `ts-validator` - A lightweight, type-safe validation library for TypeScript
**Features**: Schema validation, type guards, custom validators, chainable API, zero dependencies
**Package Manager**: pnpm (recommended for libraries)
**Bundler**: tsup (fast TypeScript bundler)
**Testing**: Vitest (fast, modern test runner)
**Linting**: ESLint + Prettier

This example showcases:

- ✅ Modern library structure with `src/` layout
- ✅ Dual ESM + CommonJS builds
- ✅ Type definitions (.d.ts) generation and export
- ✅ Generic types and type guards
- ✅ Comprehensive test coverage with Vitest
- ✅ ESLint + Prettier + TypeScript strict mode
- ✅ Bundling with tsup for optimal output
- ✅ NPM package configuration with proper exports
- ✅ GitHub Actions CI/CD pipeline
- ✅ Semantic versioning and changelog
- ✅ Documentation and usage examples

---

## Project Structure

```text
ts-validator/
├── src/
│   ├── validators/
│   │   ├── string.ts
│   │   ├── number.ts
│   │   ├── object.ts
│   │   ├── array.ts
│   │   └── index.ts
│   ├── types/
│   │   ├── validator.ts
│   │   ├── result.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── guards.ts
│   │   ├── errors.ts
│   │   └── index.ts
│   └── index.ts
├── tests/
│   ├── validators/
│   │   ├── string.test.ts
│   │   ├── number.test.ts
│   │   ├── object.test.ts
│   │   └── array.test.ts
│   └── integration.test.ts
├── dist/
│   ├── index.js          (ESM)
│   ├── index.cjs         (CommonJS)
│   ├── index.d.ts        (Type definitions)
│   └── index.d.cts       (CommonJS type definitions)
├── .github/
│   └── workflows/
│       └── ci.yml
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── tsup.config.ts
├── vitest.config.ts
├── .eslintrc.json
├── .prettierrc.json
├── .gitignore
├── LICENSE
├── README.md
└── CHANGELOG.md
```

---

## Core Library Implementation

### package.json

```json
{
  "name": "ts-validator",
  "version": "1.0.0",
  "description": "Lightweight, type-safe validation library for TypeScript",
  "author": "Tyler Dukes <tyler@example.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/tydukes/ts-validator.git"
  },
  "keywords": [
    "typescript",
    "validation",
    "validator",
    "schema",
    "type-safe"
  ],
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    }
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "dev": "tsup --watch",
    "build": "tsup",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src tests --ext .ts",
    "lint:fix": "eslint src tests --ext .ts --fix",
    "format": "prettier --write \"**/*.{ts,json,md}\"",
    "type-check": "tsc --noEmit",
    "prepublishOnly": "pnpm run lint && pnpm run test && pnpm run build",
    "release": "pnpm run prepublishOnly && changeset publish"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.1",
    "@types/node": "^20.10.0",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0",
    "@vitest/coverage-v8": "^1.0.4",
    "eslint": "^8.56.0",
    "eslint-config-prettier": "^9.1.0",
    "prettier": "^3.1.1",
    "tsup": "^8.0.1",
    "typescript": "^5.3.3",
    "vitest": "^1.0.4"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "packageManager": "pnpm@8.12.0"
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "allowUnreachableCode": false,
    "allowUnusedLabels": false,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noPropertyAccessFromIndexSignature": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### tsconfig.build.json

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["tests", "**/*.test.ts", "**/*.spec.ts"]
}
```

### tsup.config.ts

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  treeshake: true,
  outDir: 'dist',
});
```

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/index.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

---

## Type Definitions

### src/types/result.ts

```typescript
/**
 * Validation result type
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: ValidationError[] };

/**
 * Validation error details
 */
export interface ValidationError {
  path: string[];
  message: string;
  code: string;
  value?: unknown;
}

/**
 * Validation context for error tracking
 */
export interface ValidationContext {
  path: string[];
  errors: ValidationError[];
}

/**
 * Creates a new validation context
 */
export function createContext(path: string[] = []): ValidationContext {
  return { path, errors: [] };
}

/**
 * Adds an error to the context
 */
export function addError(
  ctx: ValidationContext,
  message: string,
  code: string,
  value?: unknown
): void {
  ctx.errors.push({
    path: [...ctx.path],
    message,
    code,
    value,
  });
}
```

### src/types/validator.ts

```typescript
import { ValidationResult } from './result';

/**
 * Base validator interface
 */
export interface Validator<TInput = unknown, TOutput = TInput> {
  /**
   * Validates input and returns result
   */
  validate(input: unknown): ValidationResult<TOutput>;

  /**
   * Parses input and throws on error
   */
  parse(input: unknown): TOutput;

  /**
   * Checks if input is valid (type guard)
   */
  is(input: unknown): input is TOutput;

  /**
   * Makes validator optional
   */
  optional(): Validator<TInput | undefined, TOutput | undefined>;

  /**
   * Makes validator nullable
   */
  nullable(): Validator<TInput | null, TOutput | null>;

  /**
   * Sets default value for undefined inputs
   */
  default(value: TOutput): Validator<TInput, TOutput>;
}

/**
 * Infers output type from validator
 */
export type Infer<T extends Validator<any, any>> = T extends Validator<any, infer Out>
  ? Out
  : never;
```

---

## Core Validators

### src/validators/string.ts

```typescript
import { Validator, ValidationResult, createContext, addError } from '../types';

export class StringValidator implements Validator<string, string> {
  private minLength?: number;
  private maxLength?: number;
  private pattern?: RegExp;
  private trimEnabled = false;

  validate(input: unknown): ValidationResult<string> {
    const ctx = createContext();

    if (typeof input !== 'string') {
      addError(ctx, 'Expected string', 'invalid_type', input);
      return { success: false, errors: ctx.errors };
    }

    let value = input;

    if (this.trimEnabled) {
      value = value.trim();
    }

    if (this.minLength !== undefined && value.length < this.minLength) {
      addError(
        ctx,
        `String must be at least ${this.minLength} characters`,
        'too_short',
        value
      );
    }

    if (this.maxLength !== undefined && value.length > this.maxLength) {
      addError(
        ctx,
        `String must be at most ${this.maxLength} characters`,
        'too_long',
        value
      );
    }

    if (this.pattern && !this.pattern.test(value)) {
      addError(ctx, 'String does not match pattern', 'invalid_pattern', value);
    }

    if (ctx.errors.length > 0) {
      return { success: false, errors: ctx.errors };
    }

    return { success: true, data: value };
  }

  parse(input: unknown): string {
    const result = this.validate(input);
    if (!result.success) {
      throw new Error(result.errors.map((e) => e.message).join(', '));
    }
    return result.data;
  }

  is(input: unknown): input is string {
    return this.validate(input).success;
  }

  min(length: number): this {
    this.minLength = length;
    return this;
  }

  max(length: number): this {
    this.maxLength = length;
    return this;
  }

  length(length: number): this {
    this.minLength = length;
    this.maxLength = length;
    return this;
  }

  regex(pattern: RegExp): this {
    this.pattern = pattern;
    return this;
  }

  email(): this {
    this.pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return this;
  }

  url(): this {
    this.pattern = /^https?:\/\/.+/;
    return this;
  }

  trim(): this {
    this.trimEnabled = true;
    return this;
  }

  optional(): Validator<string | undefined, string | undefined> {
    return new OptionalValidator(this);
  }

  nullable(): Validator<string | null, string | null> {
    return new NullableValidator(this);
  }

  default(value: string): Validator<string, string> {
    return new DefaultValidator(this, value);
  }
}

export function string(): StringValidator {
  return new StringValidator();
}
```

### src/validators/number.ts

```typescript
import { Validator, ValidationResult, createContext, addError } from '../types';

export class NumberValidator implements Validator<number, number> {
  private minValue?: number;
  private maxValue?: number;
  private integerOnly = false;
  private positiveOnly = false;
  private nonNegativeOnly = false;

  validate(input: unknown): ValidationResult<number> {
    const ctx = createContext();

    if (typeof input !== 'number' || Number.isNaN(input)) {
      addError(ctx, 'Expected number', 'invalid_type', input);
      return { success: false, errors: ctx.errors };
    }

    const value = input;

    if (this.integerOnly && !Number.isInteger(value)) {
      addError(ctx, 'Expected integer', 'not_integer', value);
    }

    if (this.positiveOnly && value <= 0) {
      addError(ctx, 'Number must be positive', 'not_positive', value);
    }

    if (this.nonNegativeOnly && value < 0) {
      addError(ctx, 'Number must be non-negative', 'negative', value);
    }

    if (this.minValue !== undefined && value < this.minValue) {
      addError(ctx, `Number must be at least ${this.minValue}`, 'too_small', value);
    }

    if (this.maxValue !== undefined && value > this.maxValue) {
      addError(ctx, `Number must be at most ${this.maxValue}`, 'too_large', value);
    }

    if (ctx.errors.length > 0) {
      return { success: false, errors: ctx.errors };
    }

    return { success: true, data: value };
  }

  parse(input: unknown): number {
    const result = this.validate(input);
    if (!result.success) {
      throw new Error(result.errors.map((e) => e.message).join(', '));
    }
    return result.data;
  }

  is(input: unknown): input is number {
    return this.validate(input).success;
  }

  min(value: number): this {
    this.minValue = value;
    return this;
  }

  max(value: number): this {
    this.maxValue = value;
    return this;
  }

  int(): this {
    this.integerOnly = true;
    return this;
  }

  positive(): this {
    this.positiveOnly = true;
    return this;
  }

  nonnegative(): this {
    this.nonNegativeOnly = true;
    return this;
  }

  optional(): Validator<number | undefined, number | undefined> {
    return new OptionalValidator(this);
  }

  nullable(): Validator<number | null, number | null> {
    return new NullableValidator(this);
  }

  default(value: number): Validator<number, number> {
    return new DefaultValidator(this, value);
  }
}

export function number(): NumberValidator {
  return new NumberValidator();
}
```

### src/validators/object.ts

```typescript
import { Validator, ValidationResult, createContext, addError } from '../types';

type Shape = Record<string, Validator<any, any>>;
type ObjectOutput<T extends Shape> = {
  [K in keyof T]: T[K] extends Validator<any, infer Out> ? Out : never;
};

export class ObjectValidator<T extends Shape> implements Validator<unknown, ObjectOutput<T>> {
  constructor(private shape: T) {}

  validate(input: unknown): ValidationResult<ObjectOutput<T>> {
    const ctx = createContext();

    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      addError(ctx, 'Expected object', 'invalid_type', input);
      return { success: false, errors: ctx.errors };
    }

    const result: any = {};
    const obj = input as Record<string, unknown>;

    for (const [key, validator] of Object.entries(this.shape)) {
      const fieldResult = validator.validate(obj[key]);

      if (!fieldResult.success) {
        for (const error of fieldResult.errors) {
          ctx.errors.push({
            ...error,
            path: [key, ...error.path],
          });
        }
      } else {
        result[key] = fieldResult.data;
      }
    }

    if (ctx.errors.length > 0) {
      return { success: false, errors: ctx.errors };
    }

    return { success: true, data: result as ObjectOutput<T> };
  }

  parse(input: unknown): ObjectOutput<T> {
    const result = this.validate(input);
    if (!result.success) {
      throw new Error(result.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '));
    }
    return result.data;
  }

  is(input: unknown): input is ObjectOutput<T> {
    return this.validate(input).success;
  }

  optional(): Validator<unknown, ObjectOutput<T> | undefined> {
    return new OptionalValidator(this);
  }

  nullable(): Validator<unknown, ObjectOutput<T> | null> {
    return new NullableValidator(this);
  }

  default(value: ObjectOutput<T>): Validator<unknown, ObjectOutput<T>> {
    return new DefaultValidator(this, value);
  }
}

export function object<T extends Shape>(shape: T): ObjectValidator<T> {
  return new ObjectValidator(shape);
}
```

### src/validators/array.ts

```typescript
import { Validator, ValidationResult, createContext, addError } from '../types';

type ArrayOutput<T> = T extends Validator<any, infer Out> ? Out[] : never;

export class ArrayValidator<T extends Validator<any, any>>
  implements Validator<unknown, ArrayOutput<T>>
{
  private minItems?: number;
  private maxItems?: number;
  private uniqueEnabled = false;

  constructor(private itemValidator: T) {}

  validate(input: unknown): ValidationResult<ArrayOutput<T>> {
    const ctx = createContext();

    if (!Array.isArray(input)) {
      addError(ctx, 'Expected array', 'invalid_type', input);
      return { success: false, errors: ctx.errors };
    }

    if (this.minItems !== undefined && input.length < this.minItems) {
      addError(ctx, `Array must have at least ${this.minItems} items`, 'too_short', input);
    }

    if (this.maxItems !== undefined && input.length > this.maxItems) {
      addError(ctx, `Array must have at most ${this.maxItems} items`, 'too_long', input);
    }

    const result: any[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < input.length; i++) {
      const itemResult = this.itemValidator.validate(input[i]);

      if (!itemResult.success) {
        for (const error of itemResult.errors) {
          ctx.errors.push({
            ...error,
            path: [String(i), ...error.path],
          });
        }
      } else {
        if (this.uniqueEnabled) {
          const key = JSON.stringify(itemResult.data);
          if (seen.has(key)) {
            addError(ctx, 'Array items must be unique', 'duplicate_item', itemResult.data);
          }
          seen.add(key);
        }
        result.push(itemResult.data);
      }
    }

    if (ctx.errors.length > 0) {
      return { success: false, errors: ctx.errors };
    }

    return { success: true, data: result as ArrayOutput<T> };
  }

  parse(input: unknown): ArrayOutput<T> {
    const result = this.validate(input);
    if (!result.success) {
      throw new Error(result.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '));
    }
    return result.data;
  }

  is(input: unknown): input is ArrayOutput<T> {
    return this.validate(input).success;
  }

  min(length: number): this {
    this.minItems = length;
    return this;
  }

  max(length: number): this {
    this.maxItems = length;
    return this;
  }

  length(length: number): this {
    this.minItems = length;
    this.maxItems = length;
    return this;
  }

  unique(): this {
    this.uniqueEnabled = true;
    return this;
  }

  optional(): Validator<unknown, ArrayOutput<T> | undefined> {
    return new OptionalValidator(this);
  }

  nullable(): Validator<unknown, ArrayOutput<T> | null> {
    return new NullableValidator(this);
  }

  default(value: ArrayOutput<T>): Validator<unknown, ArrayOutput<T>> {
    return new DefaultValidator(this, value);
  }
}

export function array<T extends Validator<any, any>>(itemValidator: T): ArrayValidator<T> {
  return new ArrayValidator(itemValidator);
}
```

---

## Modifier Validators

### src/validators/modifiers.ts

```typescript
import { Validator, ValidationResult, createContext, addError } from '../types';

export class OptionalValidator<T> implements Validator<T | undefined, T | undefined> {
  constructor(private inner: Validator<any, T>) {}

  validate(input: unknown): ValidationResult<T | undefined> {
    if (input === undefined) {
      return { success: true, data: undefined };
    }
    return this.inner.validate(input);
  }

  parse(input: unknown): T | undefined {
    const result = this.validate(input);
    if (!result.success) {
      throw new Error(result.errors.map((e) => e.message).join(', '));
    }
    return result.data;
  }

  is(input: unknown): input is T | undefined {
    return this.validate(input).success;
  }

  optional(): Validator<T | undefined, T | undefined> {
    return this;
  }

  nullable(): Validator<T | undefined | null, T | undefined | null> {
    return new NullableValidator(this);
  }

  default(value: T): Validator<T | undefined, T> {
    return new DefaultValidator(this, value);
  }
}

export class NullableValidator<T> implements Validator<T | null, T | null> {
  constructor(private inner: Validator<any, T>) {}

  validate(input: unknown): ValidationResult<T | null> {
    if (input === null) {
      return { success: true, data: null };
    }
    return this.inner.validate(input);
  }

  parse(input: unknown): T | null {
    const result = this.validate(input);
    if (!result.success) {
      throw new Error(result.errors.map((e) => e.message).join(', '));
    }
    return result.data;
  }

  is(input: unknown): input is T | null {
    return this.validate(input).success;
  }

  optional(): Validator<T | null | undefined, T | null | undefined> {
    return new OptionalValidator(this);
  }

  nullable(): Validator<T | null, T | null> {
    return this;
  }

  default(value: T): Validator<T | null, T> {
    return new DefaultValidator(this, value);
  }
}

export class DefaultValidator<T> implements Validator<T, T> {
  constructor(
    private inner: Validator<any, T | undefined>,
    private defaultValue: T
  ) {}

  validate(input: unknown): ValidationResult<T> {
    const result = this.inner.validate(input);
    if (!result.success) {
      return result as ValidationResult<T>;
    }
    return { success: true, data: result.data ?? this.defaultValue };
  }

  parse(input: unknown): T {
    const result = this.validate(input);
    if (!result.success) {
      throw new Error(result.errors.map((e) => e.message).join(', '));
    }
    return result.data;
  }

  is(input: unknown): input is T {
    return this.validate(input).success;
  }

  optional(): Validator<T | undefined, T | undefined> {
    return new OptionalValidator(this);
  }

  nullable(): Validator<T | null, T | null> {
    return new NullableValidator(this);
  }

  default(value: T): Validator<T, T> {
    return new DefaultValidator(this.inner, value);
  }
}
```

---

## Public API

### src/index.ts

```typescript
// Types
export type { Validator, Infer } from './types/validator';
export type { ValidationResult, ValidationError, ValidationContext } from './types/result';

// Validators
export { string } from './validators/string';
export { number } from './validators/number';
export { object } from './validators/object';
export { array } from './validators/array';

// Re-export commonly used types
export type { StringValidator } from './validators/string';
export type { NumberValidator } from './validators/number';
export type { ObjectValidator } from './validators/object';
export type { ArrayValidator } from './validators/array';
```

---

## Testing

### tests/validators/string.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { string } from '../../src';

describe('StringValidator', () => {
  describe('basic validation', () => {
    it('should validate strings', () => {
      const validator = string();
      const result = validator.validate('hello');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('hello');
      }
    });

    it('should reject non-strings', () => {
      const validator = string();
      const result = validator.validate(123);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]?.code).toBe('invalid_type');
      }
    });
  });

  describe('min/max length', () => {
    it('should validate min length', () => {
      const validator = string().min(3);

      expect(validator.validate('ab').success).toBe(false);
      expect(validator.validate('abc').success).toBe(true);
      expect(validator.validate('abcd').success).toBe(true);
    });

    it('should validate max length', () => {
      const validator = string().max(5);

      expect(validator.validate('abc').success).toBe(true);
      expect(validator.validate('abcde').success).toBe(true);
      expect(validator.validate('abcdef').success).toBe(false);
    });

    it('should validate exact length', () => {
      const validator = string().length(5);

      expect(validator.validate('abc').success).toBe(false);
      expect(validator.validate('abcde').success).toBe(true);
      expect(validator.validate('abcdef').success).toBe(false);
    });
  });

  describe('regex patterns', () => {
    it('should validate email', () => {
      const validator = string().email();

      expect(validator.validate('test@example.com').success).toBe(true);
      expect(validator.validate('invalid-email').success).toBe(false);
    });

    it('should validate URL', () => {
      const validator = string().url();

      expect(validator.validate('https://example.com').success).toBe(true);
      expect(validator.validate('not-a-url').success).toBe(false);
    });

    it('should validate custom regex', () => {
      const validator = string().regex(/^[A-Z]+$/);

      expect(validator.validate('ABC').success).toBe(true);
      expect(validator.validate('abc').success).toBe(false);
    });
  });

  describe('trim', () => {
    it('should trim whitespace', () => {
      const validator = string().trim();
      const result = validator.validate('  hello  ');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('hello');
      }
    });
  });

  describe('optional/nullable', () => {
    it('should accept undefined when optional', () => {
      const validator = string().optional();

      expect(validator.validate(undefined).success).toBe(true);
      expect(validator.validate('hello').success).toBe(true);
    });

    it('should accept null when nullable', () => {
      const validator = string().nullable();

      expect(validator.validate(null).success).toBe(true);
      expect(validator.validate('hello').success).toBe(true);
    });
  });

  describe('default values', () => {
    it('should use default for undefined', () => {
      const validator = string().optional().default('default');
      const result = validator.validate(undefined);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('default');
      }
    });
  });

  describe('type guards', () => {
    it('should work as type guard', () => {
      const validator = string().email();
      const input: unknown = 'test@example.com';

      if (validator.is(input)) {
        // TypeScript knows input is string here
        expect(input.toLowerCase()).toBe('test@example.com');
      }
    });
  });

  describe('parse method', () => {
    it('should return value on success', () => {
      const validator = string();
      expect(validator.parse('hello')).toBe('hello');
    });

    it('should throw on error', () => {
      const validator = string();
      expect(() => validator.parse(123)).toThrow();
    });
  });
});
```

### tests/validators/object.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { object, string, number } from '../../src';

describe('ObjectValidator', () => {
  it('should validate object shape', () => {
    const validator = object({
      name: string(),
      age: number().int().nonnegative(),
    });

    const result = validator.validate({
      name: 'John',
      age: 30,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('John');
      expect(result.data.age).toBe(30);
    }
  });

  it('should reject invalid object', () => {
    const validator = object({
      name: string(),
      age: number(),
    });

    const result = validator.validate({
      name: 'John',
      age: 'not a number',
    });

    expect(result.success).toBe(false);
  });

  it('should include field path in errors', () => {
    const validator = object({
      user: object({
        name: string().min(3),
      }),
    });

    const result = validator.validate({
      user: { name: 'ab' },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]?.path).toEqual(['user', 'name']);
    }
  });

  it('should infer types correctly', () => {
    const validator = object({
      name: string(),
      age: number(),
      email: string().email().optional(),
    });

    type User = (typeof validator) extends { parse: (input: unknown) => infer T } ? T : never;

    const user: User = {
      name: 'John',
      age: 30,
      email: 'john@example.com',
    };

    expect(validator.parse(user)).toEqual(user);
  });
});
```

### tests/integration.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { object, string, number, array, type Infer } from '../src';

describe('Integration', () => {
  it('should validate complex nested schema', () => {
    const addressSchema = object({
      street: string(),
      city: string(),
      zipCode: string().regex(/^\d{5}$/),
    });

    const userSchema = object({
      id: string(),
      name: string().min(2).max(50),
      email: string().email(),
      age: number().int().min(18).max(120),
      address: addressSchema,
      tags: array(string()).min(1).max(5),
    });

    type User = Infer<typeof userSchema>;

    const validUser: unknown = {
      id: '123',
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
      address: {
        street: '123 Main St',
        city: 'New York',
        zipCode: '10001',
      },
      tags: ['developer', 'typescript'],
    };

    const result = userSchema.validate(validUser);
    expect(result.success).toBe(true);

    if (result.success) {
      const user: User = result.data;
      expect(user.name).toBe('John Doe');
      expect(user.address.city).toBe('New York');
    }
  });

  it('should validate API response schema', () => {
    const apiResponseSchema = object({
      data: array(
        object({
          id: number(),
          title: string(),
          completed: boolean(),
        })
      ),
      pagination: object({
        page: number().int().positive(),
        pageSize: number().int().positive(),
        total: number().int().nonnegative(),
      }),
    });

    const response: unknown = {
      data: [
        { id: 1, title: 'Task 1', completed: false },
        { id: 2, title: 'Task 2', completed: true },
      ],
      pagination: {
        page: 1,
        pageSize: 10,
        total: 2,
      },
    };

    const result = apiResponseSchema.validate(response);
    expect(result.success).toBe(true);
  });
});
```

---

## Linting and Formatting

### .eslintrc.json

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-non-null-assertion": "error",
    "@typescript-eslint/no-floating-promises": "error"
  },
  "ignorePatterns": ["dist", "node_modules", "*.config.ts"]
}
```

### .prettierrc.json

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

---

## CI/CD Pipeline

### .github/workflows/ci.yml

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [20.x, 22.x]

    steps:
      - uses: actions/checkout@v4

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm type-check

      - name: Lint
        run: pnpm lint

      - name: Run tests
        run: pnpm test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests

  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      - name: Check bundle size
        run: |
          ls -lh dist/
          du -sh dist/

  publish:
    needs: [test, build]
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'pnpm'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      - name: Publish to NPM
        run: pnpm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## Documentation

### README.md

```markdown
## ts-validator

Lightweight, type-safe validation library for TypeScript with zero dependencies.

## Features

- ✅ Type-safe validation with full TypeScript support
- ✅ Chainable API for building complex validators
- ✅ Zero runtime dependencies
- ✅ Tree-shakeable (ESM + CommonJS)
- ✅ Comprehensive error messages
- ✅ Type guards for narrowing
- ✅ Support for optional, nullable, and default values

## Installation

```bash
npm install ts-validator
## or
yarn add ts-validator
## or
pnpm add ts-validator
```

## Quick Start

```typescript
import { object, string, number, array } from 'ts-validator';

// Define a schema
const userSchema = object({
  name: string().min(2).max(50),
  email: string().email(),
  age: number().int().min(18),
  tags: array(string()).optional(),
});

// Validate data
const result = userSchema.validate({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
});

if (result.success) {
  console.log('Valid user:', result.data);
} else {
  console.error('Validation errors:', result.errors);
}

// Or use parse (throws on error)
const user = userSchema.parse(data);

// Type inference
type User = typeof userSchema extends { parse: (input: unknown) => infer T } ? T : never;
```

## API Reference

### String Validators

```typescript
string()                    // Basic string validation
  .min(3)                  // Minimum length
  .max(50)                 // Maximum length
  .length(10)              // Exact length
  .email()                 // Email validation
  .url()                   // URL validation
  .regex(/pattern/)        // Custom regex
  .trim()                  // Trim whitespace
  .optional()              // Allow undefined
  .nullable()              // Allow null
  .default('value')        // Default value
```

### Number Validators

```typescript
number()                    // Basic number validation
  .min(0)                  // Minimum value
  .max(100)                // Maximum value
  .int()                   // Integer only
  .positive()              // Positive numbers only
  .nonnegative()           // Non-negative numbers
  .optional()              // Allow undefined
  .nullable()              // Allow null
  .default(0)              // Default value
```

### Object Validators

```typescript
object({                    // Object shape validation
  name: string(),
  age: number(),
})
  .optional()              // Allow undefined
  .nullable()              // Allow null
```

### Array Validators

```typescript
array(string())             // Array of strings
  .min(1)                  // Minimum items
  .max(10)                 // Maximum items
  .length(5)               // Exact length
  .unique()                // Unique items only
  .optional()              // Allow undefined
  .nullable()              // Allow null
```

## License

MIT © Tyler Dukes

---

## Key Takeaways

This TypeScript library example demonstrates:

1. **Modern Package Configuration**: Dual ESM/CommonJS builds with proper exports
2. **Type Safety**: Full TypeScript support with generics and type inference
3. **Developer Experience**: Chainable API, type guards, and helpful error messages
4. **Testing**: Comprehensive test coverage with Vitest
5. **Build Pipeline**: Optimized bundling with tsup
6. **CI/CD**: Automated testing, linting, and publishing with GitHub Actions
7. **Documentation**: Clear README with examples and API reference
8. **Maintainability**: ESLint + Prettier + strict TypeScript configuration

---

## References

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [tsup Documentation](https://tsup.egoist.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [pnpm Documentation](https://pnpm.io/)
- [NPM Package Best Practices](https://docs.npmjs.com/packages-and-modules)

---

**Status**: Active
