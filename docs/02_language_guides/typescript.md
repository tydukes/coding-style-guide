---
title: "TypeScript Style Guide"
description: "TypeScript coding standards for React, Next.js, and Node.js applications"
author: "Tyler Dukes"
tags: [typescript, javascript, react, nextjs, nodejs]
category: "Language Guides"
status: "active"
---

## Language Overview

**TypeScript** is a statically typed superset of JavaScript that adds optional type annotations,
interfaces, and compile-time type checking to enhance code quality and developer experience.

### Key Characteristics

- **Paradigm**: Multi-paradigm (object-oriented, functional, procedural)
- **Type System**: Static typing with type inference
- **Compilation**: Transpiles to JavaScript
- **Runtime**: Node.js (backend) or browser (frontend)
- **Frameworks**: React, Next.js, Express, NestJS

### Primary Use Cases

- Full-stack web applications (React + Next.js + Node.js)
- RESTful and GraphQL APIs
- Single Page Applications (SPAs)
- Server-Side Rendering (SSR)
- CLI tools
- Serverless functions

---

## TypeScript Configuration

### tsconfig.json for New Projects

Use `strict: true` for all new code:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
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
    "allowUnusedLabels": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "build"]
}
```

### tsconfig.json for Legacy Projects

Relax strict mode when migrating JavaScript to TypeScript:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "strict": false,
    "noImplicitAny": false,
    "strictNullChecks": false,
    "allowJs": true,
    "checkJs": false
  }
}
```

Gradually enable strict checks file-by-file with `// @ts-check` comments.

---

## Quick Reference

| **Category** | **Convention** | **Example** | **Notes** |
|-------------|----------------|-------------|-----------|
| **Naming** | | | |
| Variables | `camelCase` | `userName`, `apiResponse` | Descriptive, lowercase first letter |
| Constants | `UPPER_SNAKE_CASE` | `MAX_RETRIES`, `API_URL` | Module-level constants, all uppercase |
| Functions | `camelCase` | `getUser()`, `validateInput()` | Verbs, descriptive action names |
| Interfaces | `PascalCase` | `User`, `ApiResponse` | Nouns, no 'I' prefix (modern convention) |
| Types | `PascalCase` | `UserId`, `StatusCode` | Nouns, capitalize each word |
| Classes | `PascalCase` | `UserService`, `DataProcessor` | Nouns, capitalize each word |
| Enums | `PascalCase` | `Color`, `HttpStatus` | Singular nouns |
| Enum Members | `PascalCase` | `Color.Red`, `HttpStatus.Ok` | PascalCase (not UPPER_CASE) |
| Methods | `camelCase` | `calculateTotal()`, `isValid()` | Like functions, instance/class methods |
| Private Fields | `#privateField` | `#cache`, `#internalState` | Use private class fields (TC39) |
| **Formatting** | | | |
| Line Length | 100 characters | `// Prettier default` | Max 100 characters per line |
| Indentation | 2 spaces | `if (condition) {` | 2 spaces, never tabs |
| Semicolons | Required | `const x = 5;` | Always use semicolons |
| String Quotes | Double quotes | `"hello world"` | Prefer double, single for JSX |
| **Imports** | | | |
| Order | External, internal, types | `import React from "react"` | Group and alphabetize |
| Style | ES6 imports | `import { User } from "./types"` | Named or default imports |
| Type Imports | `import type` | `import type { User } from "./types"` | Use for type-only imports |
| **Types** | | | |
| Annotations | Explicit when needed | `const user: User = getData()` | Leverage type inference |
| Return Types | Always on functions | `function foo(): string { }` | Explicit return types required |
| Generics | `T`, `K`, `V` | `function map<T>(items: T[])` | Single letter for simple, descriptive for complex |
| **Files** | | | |
| Components | `PascalCase.tsx` | `UserProfile.tsx`, `Button.tsx` | React components |
| Utilities | `camelCase.ts` | `apiClient.ts`, `validators.ts` | Utility modules |
| Types | `camelCase.types.ts` | `user.types.ts`, `api.types.ts` | Type definition files |
| Tests | `*.test.ts` or `*.spec.ts` | `user.test.ts`, `api.spec.ts` | Co-located with source |

## Naming Conventions

```typescript
// Interfaces - PascalCase with 'I' prefix (optional, team preference)
interface User {
  id: string;
  name: string;
  email: string;
}

// Alternative without prefix (more common in modern TS)
interface User {
  id: string;
  name: string;
}

// Types - PascalCase
type UserId = string;
type UserRole = 'admin' | 'user' | 'guest';

// Classes - PascalCase
class UserService {
  private readonly repository: UserRepository;

  constructor(repository: UserRepository) {
    this.repository = repository;
  }
}

// Functions - camelCase
function getUserById(id: string): Promise<User> {
  // Implementation
}

// Variables - camelCase
const currentUser: User = { id: '1', name: 'John', email: 'john@example.com' };
const userCount = 42;

// Constants - UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';

// Enums - PascalCase for enum, UPPER_CASE for values
enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST',
}

// Generic type parameters - Single uppercase letter or PascalCase
function identity<T>(value: T): T {
  return value;
}

function map<TInput, TOutput>(
  items: TInput[],
  transform: (item: TInput) => TOutput
): TOutput[] {
  return items.map(transform);
}
```

---

## Type Definitions

### Interfaces vs Types

```typescript
// Use interfaces for object shapes (can be extended)
interface BaseUser {
  id: string;
  name: string;
}

interface AdminUser extends BaseUser {
  role: 'admin';
  permissions: string[];
}

// Use types for unions, intersections, primitives
type UserId = string;
type UserRole = 'admin' | 'user' | 'guest';
type Result<T> = { success: true; data: T } | { success: false; error: string };

// Intersection types
type TimestampedUser = User & {
  createdAt: Date;
  updatedAt: Date;
};
```

### Utility Types

```typescript
// Partial - Make all properties optional
type PartialUser = Partial<User>;

// Required - Make all properties required
type RequiredUser = Required<User>;

// Pick - Select subset of properties
type UserSummary = Pick<User, 'id' | 'name'>;

// Omit - Exclude properties
type UserWithoutEmail = Omit<User, 'email'>;

// Record - Map of keys to values
type UserMap = Record<string, User>;

// Readonly - Make properties immutable
type ReadonlyUser = Readonly<User>;

// ReturnType - Extract function return type
type GetUserResult = ReturnType<typeof getUserById>;

// Parameters - Extract function parameter types
type GetUserParams = Parameters<typeof getUserById>;

// NonNullable - Exclude null and undefined
type NonNullableString = NonNullable<string | null | undefined>;
```

---

## Generics

```typescript
// Generic function
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

// Generic interface
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

// Generic class
class Repository<T> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  findById(id: string): T | undefined {
    return this.items.find((item: any) => item.id === id);
  }

  getAll(): T[] {
    return [...this.items];
  }
}

// Constrained generics
interface HasId {
  id: string;
}

function findById<T extends HasId>(items: T[], id: string): T | undefined {
  return items.find((item) => item.id === id);
}

// Multiple type parameters
function merge<T, U>(obj1: T, obj2: U): T & U {
  return { ...obj1, ...obj2 };
}
```

---

## Enums and Const Assertions

```typescript
// String enum (preferred for serialization)
enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST',
}

// Numeric enum (avoid unless needed)
enum HttpStatus {
  OK = 200,
  NOT_FOUND = 404,
  SERVER_ERROR = 500,
}

// Const assertions (alternative to enums)
const UserRole = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  GUEST: 'GUEST',
} as const;

type UserRole = (typeof UserRole)[keyof typeof UserRole];

// Union of literal types (most flexible)
type UserRole = 'admin' | 'user' | 'guest';

// Const assertion for readonly arrays
const ALLOWED_ROLES = ['admin', 'user', 'guest'] as const;
type UserRole = (typeof ALLOWED_ROLES)[number];
```

---

## Module Organization

### File Structure

```text
src/
├── types/
│   ├── user.ts
│   ├── api.ts
│   └── index.ts
├── services/
│   ├── user.service.ts
│   ├── auth.service.ts
│   └── index.ts
├── utils/
│   ├── validation.ts
│   ├── formatting.ts
│   └── index.ts
└── index.ts
```

### Import/Export Conventions

```typescript
// Named exports (preferred)
// user.ts
export interface User {
  id: string;
  name: string;
}

export function createUser(name: string): User {
  return { id: crypto.randomUUID(), name };
}

// Barrel exports in index.ts
export * from './user';
export * from './admin';

// Import usage
import { User, createUser } from './types';

// Default exports (use sparingly)
export default class UserService {
  // Implementation
}

// Avoid wildcard imports
// Bad
import * as utils from './utils';

// Good
import { formatDate, validateEmail } from './utils';
```

---

## React Patterns

### Functional Components with TypeScript

```typescript
// React component with props interface
interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
  className?: string;
}

export function UserCard({ user, onEdit, className }: UserCardProps) {
  return (
    <div className={className}>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <button onClick={() => onEdit(user)}>Edit</button>
    </div>
  );
}

// Component with children
interface ContainerProps {
  children: React.ReactNode;
  title?: string;
}

export function Container({ children, title }: ContainerProps) {
  return (
    <div>
      {title && <h1>{title}</h1>}
      {children}
    </div>
  );
}

// Component with generic props
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

export function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map((item) => (
        <li key={keyExtractor(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}
```

### React Hooks with TypeScript

```typescript
// useState with type inference
const [count, setCount] = useState(0);
const [user, setUser] = useState<User | null>(null);

// useState with explicit type
const [users, setUsers] = useState<User[]>([]);

// useReducer with discriminated unions
type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DATA'; payload: User[] }
  | { type: 'SET_ERROR'; payload: string };

interface State {
  data: User[];
  loading: boolean;
  error: string | null;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_DATA':
      return { ...state, data: action.payload, loading: false };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

const [state, dispatch] = useReducer(reducer, {
  data: [],
  loading: false,
  error: null,
});

// useRef with DOM elements
const inputRef = useRef<HTMLInputElement>(null);

// useRef with mutable values
const timeoutRef = useRef<number | null>(null);

// Custom hook
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}
```

---

## Next.js Patterns

### Page Components

```typescript
// app/users/page.tsx
interface PageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function UsersPage({ params, searchParams }: PageProps) {
  const users = await fetchUsers();

  return (
    <div>
      <h1>Users</h1>
      <UserList users={users} />
    </div>
  );
}
```

### API Routes

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const users = await db.user.findMany();
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const user = await db.user.create({ data: body });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
```

### Server Actions

```typescript
// app/actions/user.ts
'use server';

import { revalidatePath } from 'next/cache';

export async function createUser(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;

    await db.user.create({ data: { name, email } });
    revalidatePath('/users');

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to create user' };
  }
}
```

---

## Node.js Patterns

### Express with TypeScript

```typescript
// src/types/express.d.ts
import { User } from './user';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// src/routes/users.ts
import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

interface CreateUserRequest {
  name: string;
  email: string;
}

router.post('/users', async (req: Request<{}, {}, CreateUserRequest>, res: Response) => {
  try {
    const { name, email } = req.body;
    const user = await createUser(name, email);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.get('/users/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export { router as userRouter };
```

### NestJS Service

```typescript
// users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }
}
```

---

## Async Patterns

```typescript
// Async function with typed return
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }
  return response.json();
}

// Promise.all with type inference
const [users, posts, comments] = await Promise.all([
  fetchUsers(),
  fetchPosts(),
  fetchComments(),
]);

// Async error handling
async function safeCreateUser(name: string): Promise<User | null> {
  try {
    return await createUser(name);
  } catch (error) {
    console.error('Failed to create user:', error);
    return null;
  }
}

// Async generators
async function* fetchPagedUsers(pageSize: number): AsyncGenerator<User[], void, unknown> {
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const users = await fetchUsersPage(page, pageSize);
    if (users.length === 0) {
      hasMore = false;
    } else {
      yield users;
      page++;
    }
  }
}

// Usage
for await (const userPage of fetchPagedUsers(10)) {
  console.log(`Processing ${userPage.length} users`);
}
```

---

## Error Handling

```typescript
// Custom error classes
class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ValidationError extends Error {
  constructor(
    public field: string,
    message: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Result type pattern
type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

async function fetchUser(id: string): Promise<Result<User>> {
  try {
    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return { success: false, error: new Error('User not found') };
    }
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

// Usage
const result = await fetchUser('123');
if (result.success) {
  console.log(result.data.name);
} else {
  console.error(result.error.message);
}

// Type guards for error handling
function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

try {
  await fetchUser('123');
} catch (error) {
  if (isApiError(error)) {
    console.error(`API Error ${error.statusCode}: ${error.message}`);
  } else {
    console.error('Unknown error:', error);
  }
}
```

---

## Testing with Jest/Vitest

```typescript
// sum.test.ts
import { describe, it, expect } from 'vitest';

describe('sum', () => {
  it('should add two numbers', () => {
    expect(sum(1, 2)).toBe(3);
  });

  it('should handle negative numbers', () => {
    expect(sum(-1, -2)).toBe(-3);
  });
});

// Mocking
import { vi } from 'vitest';

interface UserRepository {
  findById(id: string): Promise<User | null>;
}

const mockRepository: UserRepository = {
  findById: vi.fn(async (id: string) => ({
    id,
    name: 'Test User',
    email: 'test@example.com',
  })),
};

// React component testing
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('UserCard', () => {
  it('should render user information', () => {
    const user = { id: '1', name: 'John Doe', email: 'john@example.com' };
    render(<UserCard user={user} onEdit={vi.fn()} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should call onEdit when button is clicked', async () => {
    const user = { id: '1', name: 'John Doe', email: 'john@example.com' };
    const onEdit = vi.fn();
    render(<UserCard user={user} onEdit={onEdit} />);

    await userEvent.click(screen.getByRole('button', { name: /edit/i }));

    expect(onEdit).toHaveBeenCalledWith(user);
  });
});
```

---

## Common Pitfalls

### Type Assertions vs Type Guards

**Issue**: Using type assertions (`as`) bypasses type checking and can cause runtime errors if the assertion is incorrect.

**Example**:

```typescript
// Bad - Type assertion with no runtime check
function processUser(data: unknown) {
  const user = data as User;  // No runtime validation!
  console.log(user.email.toLowerCase());  // Runtime error if data isn't a User
}
```

**Solution**: Use type guards for runtime type checking.

```typescript
// Good - Type guard with runtime check
function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'email' in data &&
    typeof (data as User).email === 'string'
  );
}

function processUser(data: unknown) {
  if (!isUser(data)) {
    throw new Error('Invalid user data');
  }
  console.log(data.email.toLowerCase());  // Type-safe
}
```

**Key Points**:

- Type assertions don't perform runtime checks
- Use type guards (`is` operator) for validation
- Prefer `unknown` over `any` for better type safety
- Validate external data (APIs, user input) at runtime

### Optional Chaining with Nullish Coalescing

**Issue**: Confusing `?.` (optional chaining) with `||` for defaults causes bugs with falsy values.

**Example**:

```typescript
// Bad - || treats 0 and "" as missing
interface Config {
  timeout?: number;
  retries?: number;
}

const config: Config = { timeout: 0, retries: 0 };
const timeout = config.timeout || 30;  // Returns 30, not 0!
const retries = config.retries || 3;   // Returns 3, not 0!
```

**Solution**: Use `??` (nullish coalescing) for defaults.

```typescript
// Good - ?? only checks for null/undefined
const config: Config = { timeout: 0, retries: 0 };
const timeout = config.timeout ?? 30;  // Returns 0 ✅
const retries = config.retries ?? 3;   // Returns 0 ✅
```

**Key Points**:

- `||` treats `0`, `""`, `false` as missing
- `??` only checks for `null` and `undefined`
- Use `?.` for safe property access
- Combine: `obj?.prop ?? defaultValue`

### Promise Error Handling

**Issue**: Unhandled promise rejections cause silent failures in production.

**Example**:

```typescript
// Bad - Unhandled promise rejection
async function fetchUserData(id: string) {
  const response = await fetch(`/api/users/${id}`);  // No error handling
  return response.json();  // Can throw
}

// Fires off request and forgets about errors
fetchUserData('123');  // Unhandled rejection!
```

**Solution**: Always handle promise rejections with try/catch or .catch().

```typescript
// Good - Proper error handling
async function fetchUserData(id: string): Promise<User> {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    if (!isUser(data)) {
      throw new Error('Invalid user data');
    }
    return data;
  } catch (error) {
    logger.error('Failed to fetch user', { id, error });
    throw error;  // Re-throw or return fallback
  }
}

// Usage with error handling
fetchUserData('123')
  .then(user => console.log(user))
  .catch(error => console.error('Error:', error));
```

**Key Points**:

- Always use try/catch with async/await
- Add `.catch()` to promise chains
- Check `response.ok` for HTTP errors
- Validate response data structure
- Log errors before re-throwing

### Enum vs Union Types

**Issue**: Enums compile to runtime objects, increasing bundle size and creating reverse mapping confusion.

**Example**:

```typescript
// Bad - Enum creates runtime object
enum UserRole {
  Admin = 'ADMIN',
  User = 'USER',
  Guest = 'GUEST'
}

// Compiled output (adds ~100 bytes):
// var UserRole;
// (function (UserRole) {
//   UserRole["Admin"] = "ADMIN";
//   UserRole["User"] = "USER";
//   UserRole["Guest"] = "GUEST";
// })(UserRole || (UserRole = {}));
```

**Solution**: Use const enums or union types for zero runtime cost.

```typescript
// Good - Union type (no runtime code)
type UserRole = 'ADMIN' | 'USER' | 'GUEST';

// Good - Const enum (inlined at compile time)
const enum UserRole {
  Admin = 'ADMIN',
  User = 'USER',
  Guest = 'GUEST'
}

// Usage remains the same
function checkRole(role: UserRole) {
  if (role === 'ADMIN') {
    // ...
  }
}
```

**Key Points**:

- Regular enums create runtime objects
- Union types have zero runtime cost
- Const enums are inlined (no runtime object)
- Use union types for API types
- Prefer const enums if you need enum features

### Type Widening in Let

**Issue**: TypeScript infers wider types for `let` variables, losing literal type information.

**Example**:

```typescript
// Bad - Type widened to string
let status = 'pending';  // Type: string (not 'pending')
type Status = 'pending' | 'completed' | 'failed';

function updateStatus(s: Status) { /* ... */ }
updateStatus(status);  // Error: string not assignable to Status!
```

**Solution**: Use `const` or explicit type annotations.

```typescript
// Good - Use const for literals
const status = 'pending';  // Type: 'pending' ✅
updateStatus(status);  // Works!

// Good - Explicit type annotation
let status: Status = 'pending';  // Type: Status ✅
updateStatus(status);  // Works!

// Good - as const assertion
let config = {
  timeout: 30,
  retries: 3
} as const;  // Type: { readonly timeout: 30; readonly retries: 3 }
```

**Key Points**:

- `let` infers wider types (string not 'hello')
- `const` preserves literal types
- Use `as const` for readonly literal types
- Add explicit type annotations when needed

### Array Mutation Type Issues

**Issue**: Array methods like `.push()` mutate arrays, causing type errors with readonly arrays.

**Example**:

```typescript
// Bad - Mutating readonly array
interface Props {
  readonly items: ReadonlyArray<string>;
}

function addItem(props: Props, item: string) {
  props.items.push(item);  // Error: push doesn't exist on ReadonlyArray!
}
```

**Solution**: Use immutable array operations.

```typescript
// Good - Create new array instead of mutating
interface Props {
  readonly items: ReadonlyArray<string>;
}

function addItem(props: Props, item: string): ReadonlyArray<string> {
  return [...props.items, item];  // Creates new array
}

// Good - Immutable operations
const filtered = items.filter(x => x !== 'remove');  // New array
const mapped = items.map(x => x.toUpperCase());      // New array
const sorted = [...items].sort();                    // Copy then sort
```

**Key Points**:

- `ReadonlyArray<T>` prevents mutation
- Use spread operator to create copies
- Array methods (map, filter) return new arrays
- Sort/reverse mutate; copy first: `[...arr].sort()`
- Prefer immutable operations in React/Redux

---

## Anti-Patterns

### ❌ Avoid: any Type

```typescript
// Bad
function processData(data: any) {
  return data.value;
}

// Good - Use unknown for truly unknown types
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: number }).value;
  }
  throw new Error('Invalid data');
}

// Better - Define proper types
interface DataWithValue {
  value: number;
}

function processData(data: DataWithValue) {
  return data.value;
}
```

### ❌ Avoid: Non-null Assertions

```typescript
// Bad - Using ! can hide bugs
const user = users.find((u) => u.id === id)!;

// Good - Handle null case explicitly
const user = users.find((u) => u.id === id);
if (!user) {
  throw new Error('User not found');
}
```

### ❌ Avoid: Type Assertions Without Validation

```typescript
// Bad - Unsafe type assertion
const data = JSON.parse(response) as User;

// Good - Validate before asserting
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string'
  );
}

const data = JSON.parse(response);
if (!isUser(data)) {
  throw new Error('Invalid user data');
}
```

### ❌ Avoid: Implicit any in Function Parameters

```typescript
// Bad - Implicit any
function processItems(items) {  // ❌ Parameter has implicit 'any' type
  return items.map(item => item.value);
}

// Good - Explicit types
interface Item {
  value: number;
}

function processItems(items: Item[]): number[] {  // ✅ Fully typed
  return items.map(item => item.value);
}
```

### ❌ Avoid: Using Enums for String Constants

```typescript
// Bad - Enums generate runtime code
enum Color {  // ❌ Adds unnecessary runtime code
  Red = 'red',
  Green = 'green',
  Blue = 'blue'
}

// Good - Use const objects or unions
const Color = {  // ✅ No runtime overhead (with as const)
  Red: 'red',
  Green: 'green',
  Blue: 'blue'
} as const;

type Color = typeof Color[keyof typeof Color];

// Or even better - Use union types
type Color = 'red' | 'green' | 'blue';  // ✅ Pure type, no runtime
```

### ❌ Avoid: Overusing Optional Chaining

```typescript
// Bad - Optional chaining everywhere
function getUserEmail(user?: User) {
  return user?.profile?.contact?.email?.toLowerCase();  // ❌ Hard to debug
}

// Good - Explicit null checks
function getUserEmail(user: User | undefined): string | undefined {
  if (!user?.profile?.contact?.email) {  // ✅ Clear validation
    return undefined;
  }
  return user.profile.contact.email.toLowerCase();
}

// Better - Validate at boundaries
function getUserEmail(user: User): string {  // ✅ Require valid user
  if (!user.profile?.contact?.email) {
    throw new Error('User email not found');
  }
  return user.profile.contact.email.toLowerCase();
}
```

### ❌ Avoid: Generic any[] Arrays

```typescript
// Bad - Generic array
function processItems(items: any[]) {  // ❌ Loses all type safety
  return items.map(item => item.id);
}

// Good - Typed arrays
interface Item {
  id: string;
  name: string;
}

function processItems(items: Item[]): string[] {  // ✅ Type-safe
  return items.map(item => item.id);
}

// Or use generics for reusability
function processItems<T extends { id: string }>(items: T[]): string[] {
  return items.map(item => item.id);
}
```

### ❌ Avoid: Disabling TypeScript Checks

```typescript
// Bad - Disabling type checking
// @ts-ignore  // ❌ Hides real errors
const result = dangerousOperation();

// @ts-nocheck  // ❌ Disables checking for entire file
function processData(data) {
  return data.value;
}

// Good - Fix the root cause
function dangerousOperation(): unknown {  // ✅ Proper typing
  // Implementation
  return {};
}

const result = dangerousOperation();
if (isValidResult(result)) {
  // Use result safely
}
```

---

## Tool Configuration

### ESLint Configuration

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint", "react", "react-hooks"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "react/react-in-jsx-scope": "off"
  }
}
```

### Prettier Configuration

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

### package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "tsc && next build",
    "start": "next start",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \"**/*.{ts,tsx,json,md}\"",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:coverage": "vitest --coverage"
  }
}
```

---

## See Also

### Related Language Guides

- [Python Style Guide](python.md) - Similar modern type-safe development
- [JavaScript/JSON Guide](json.md) - JSON data structures and APIs
- [Bash Style Guide](bash.md) - Build scripts and automation

### Development Tools & Practices

- [IDE Integration Guide](../05_ci_cd/ide_integration_guide.md) - VS Code, WebStorm setup
- [Pre-commit Hooks Guide](../05_ci_cd/precommit_hooks_guide.md) - ESLint, Prettier automation
- [Local Validation Setup](../05_ci_cd/local_validation_setup.md) - Node.js, npm/pnpm setup

### Testing & Quality

- [Testing Strategies](../05_ci_cd/testing_strategies.md) - Jest, Playwright, Cypress patterns
- [Security Scanning Guide](../05_ci_cd/security_scanning_guide.md) - npm audit, Snyk integration

### CI/CD Integration

- [GitHub Actions Guide](../05_ci_cd/github_actions_guide.md) - Node.js workflow examples
- [GitLab CI Guide](../05_ci_cd/gitlab_ci_guide.md) - TypeScript pipeline configuration
- [AI Validation Pipeline](../05_ci_cd/ai_validation_pipeline.md) - Automated code review

### Infrastructure & Deployment

- [AWS CDK Guide](cdk.md) - Infrastructure as Code with TypeScript
- [Dockerfile Guide](dockerfile.md) - Node.js containerization
- [Docker Compose Guide](docker_compose.md) - Multi-container applications

### Templates & Examples

- [TypeScript Library Example](../05_examples/typescript_library_example.md) - Complete library setup

### Core Documentation

- [Getting Started Guide](../01_overview/getting_started.md) - Repository setup
- [Metadata Schema Reference](../03_metadata_schema/schema_reference.md) - Frontmatter requirements
- [Principles](../01_overview/principles.md) - Style guide philosophy

---

## References

### Official Documentation

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

### Frameworks

- [Next.js with TypeScript](https://nextjs.org/docs/basic-features/typescript)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Express with TypeScript](https://expressjs.com/)

### Tools

- [ESLint TypeScript Plugin](https://typescript-eslint.io/)
- [Prettier](https://prettier.io/)
- [Vitest](https://vitest.dev/)
- [ts-node](https://typestrong.org/ts-node/)

### Best Practices

- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [Effective TypeScript](https://effectivetypescript.com/)

---

**Version**: 1.0.0
**Status**: Active
