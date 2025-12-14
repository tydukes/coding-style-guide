---
title: "TypeScript Refactoring Examples"
description: "Real-world TypeScript code refactoring examples with before/after comparisons"
author: "Tyler Dukes"
tags: [typescript, refactoring, best-practices, react, nodejs]
category: "Refactoring"
status: "active"
---

Real-world examples of refactoring TypeScript code to improve type safety, maintainability, and modern best practices.

## Extract Components from Monolithic Files

### Problem: Large component file with mixed concerns

**Before** (UserDashboard.tsx - 400 lines):

```typescript
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export function UserDashboard({ userId }: { userId: string }) {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [userId]);

  async function fetchData() {
    try {
      const userRes = await axios.get(`/api/users/${userId}`);
      const ordersRes = await axios.get(`/api/users/${userId}/orders`);
      setUser(userRes.data);
      setOrders(ordersRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard">
      <div className="user-info">
        <h1>{user.name}</h1>
        <p>{user.email}</p>
        <span className={user.premium ? 'badge-premium' : 'badge-standard'}>
          {user.premium ? 'Premium' : 'Standard'}
        </span>
      </div>

      <div className="orders-section">
        <h2>Orders</h2>
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card" onClick={() => setSelectedOrder(order)}>
              <h3>Order #{order.id}</h3>
              <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
              <p>Total: ${order.total.toFixed(2)}</p>
              <span className={`status-${order.status}`}>{order.status}</span>
            </div>
          ))}
        </div>
      </div>

      {selectedOrder && (
        <div className="order-details-modal">
          <h2>Order Details</h2>
          <button onClick={() => setSelectedOrder(null)}>Close</button>
          <div>
            <h3>Order #{selectedOrder.id}</h3>
            <p>Status: {selectedOrder.status}</p>
            <h4>Items:</h4>
            <ul>
              {selectedOrder.items.map((item: any, idx: number) => (
                <li key={idx}>
                  {item.name} - Qty: {item.quantity} - ${item.price}
                </li>
              ))}
            </ul>
            <p><strong>Total: ${selectedOrder.total.toFixed(2)}</strong></p>
          </div>
        </div>
      )}
    </div>
  );
}
```

**After** (Properly separated):

```typescript
// types/user.types.ts
export interface User {
  id: string;
  name: string;
  email: string;
  premium: boolean;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  createdAt: string;
  total: number;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
}

// hooks/useUserData.ts
import { useState, useEffect } from 'react';
import type { User, Order } from '../types/user.types';
import { fetchUser, fetchUserOrders } from '../api/users';

interface UseUserDataResult {
  user: User | null;
  orders: Order[];
  loading: boolean;
  error: Error | null;
}

export function useUserData(userId: string): UseUserDataResult {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [userData, ordersData] = await Promise.all([
          fetchUser(userId),
          fetchUserOrders(userId)
        ]);
        setUser(userData);
        setOrders(ordersData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load data'));
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [userId]);

  return { user, orders, loading, error };
}

// components/UserInfo.tsx
import React from 'react';
import type { User } from '../types/user.types';

interface UserInfoProps {
  user: User;
}

export function UserInfo({ user }: UserInfoProps): JSX.Element {
  return (
    <div className="user-info">
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <span className={user.premium ? 'badge-premium' : 'badge-standard'}>
        {user.premium ? 'Premium' : 'Standard'}
      </span>
    </div>
  );
}

// components/OrderCard.tsx
import React from 'react';
import type { Order } from '../types/user.types';

interface OrderCardProps {
  order: Order;
  onClick: (order: Order) => void;
}

export function OrderCard({ order, onClick }: OrderCardProps): JSX.Element {
  return (
    <div className="order-card" onClick={() => onClick(order)}>
      <h3>Order #{order.id}</h3>
      <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
      <p>Total: ${order.total.toFixed(2)}</p>
      <span className={`status-${order.status}`}>{order.status}</span>
    </div>
  );
}

// components/OrdersList.tsx
import React from 'react';
import type { Order } from '../types/user.types';
import { OrderCard } from './OrderCard';

interface OrdersListProps {
  orders: Order[];
  onOrderSelect: (order: Order) => void;
}

export function OrdersList({ orders, onOrderSelect }: OrdersListProps): JSX.Element {
  return (
    <div className="orders-section">
      <h2>Orders</h2>
      <div className="orders-list">
        {orders.map(order => (
          <OrderCard key={order.id} order={order} onClick={onOrderSelect} />
        ))}
      </div>
    </div>
  );
}

// components/OrderDetailsModal.tsx
import React from 'react';
import type { Order } from '../types/user.types';

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
}

export function OrderDetailsModal({ order, onClose }: OrderDetailsModalProps): JSX.Element {
  return (
    <div className="order-details-modal">
      <h2>Order Details</h2>
      <button onClick={onClose}>Close</button>
      <div>
        <h3>Order #{order.id}</h3>
        <p>Status: {order.status}</p>
        <h4>Items:</h4>
        <ul>
          {order.items.map((item) => (
            <li key={item.id}>
              {item.name} - Qty: {item.quantity} - ${item.price.toFixed(2)}
            </li>
          ))}
        </ul>
        <p><strong>Total: ${order.total.toFixed(2)}</strong></p>
      </div>
    </div>
  );
}

// components/UserDashboard.tsx
import React, { useState } from 'react';
import type { Order } from '../types/user.types';
import { useUserData } from '../hooks/useUserData';
import { UserInfo } from './UserInfo';
import { OrdersList } from './OrdersList';
import { OrderDetailsModal } from './OrderDetailsModal';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

interface UserDashboardProps {
  userId: string;
}

export function UserDashboard({ userId }: UserDashboardProps): JSX.Element {
  const { user, orders, loading, error } = useUserData(userId);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !user) {
    return <ErrorMessage error={error || new Error('User not found')} />;
  }

  return (
    <div className="dashboard">
      <UserInfo user={user} />
      <OrdersList orders={orders} onOrderSelect={setSelectedOrder} />
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
```

**Improvements**:

- ✅ Separated into focused, single-responsibility components
- ✅ Proper TypeScript interfaces (no `any` types)
- ✅ Custom hook for data fetching logic
- ✅ Reusable components
- ✅ Better error handling
- ✅ Easier to test each component

---

## Replace `any` with Proper Types

### Problem: Unsafe `any` types throughout codebase

**Before**:

```typescript
interface ApiResponse {
  data: any;
  status: number;
}

async function fetchData(url: string): Promise<any> {
  const response = await fetch(url);
  return response.json();
}

function processUser(user: any) {
  return {
    name: user.name.toUpperCase(),
    email: user.email.toLowerCase(),
    age: new Date().getFullYear() - new Date(user.birthdate).getFullYear()
  };
}

const users: any[] = await fetchData('/api/users');
const processed = users.map(processUser);
```

**After**:

```typescript
// Define specific response types
interface User {
  id: string;
  name: string;
  email: string;
  birthdate: string;
}

interface ProcessedUser {
  name: string;
  email: string;
  age: number;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

// Type-safe fetch with generics
async function fetchData<T>(url: string): Promise<ApiResponse<T>> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return {
    data,
    status: response.status
  };
}

// Type-safe user processing
function processUser(user: User): ProcessedUser {
  const birthYear = new Date(user.birthdate).getFullYear();
  const currentYear = new Date().getFullYear();

  return {
    name: user.name.toUpperCase(),
    email: user.email.toLowerCase(),
    age: currentYear - birthYear
  };
}

// Usage with full type safety
const response = await fetchData<User[]>('/api/users');
const users: User[] = response.data;
const processed: ProcessedUser[] = users.map(processUser);
```

**Improvements**:

- ✅ Zero `any` types
- ✅ Generic types for reusability
- ✅ Compile-time type checking
- ✅ Better IDE autocomplete
- ✅ Prevents runtime errors

---

## Simplify Async/Await Chains

### Problem: Callback hell with promises

**Before**:

```typescript
function deployApplication(appId: string) {
  return validateApp(appId)
    .then(app => {
      return buildApp(app)
        .then(buildResult => {
          return runTests(buildResult)
            .then(testResult => {
              if (testResult.passed) {
                return deployToStaging(buildResult)
                  .then(stagingResult => {
                    return validateStaging(stagingResult)
                      .then(validationResult => {
                        if (validationResult.success) {
                          return deployToProduction(buildResult);
                        }
                        throw new Error('Staging validation failed');
                      });
                  });
              }
              throw new Error('Tests failed');
            });
        });
    })
    .catch(error => {
      console.error('Deployment failed:', error);
      throw error;
    });
}
```

**After**:

```typescript
interface App {
  id: string;
  name: string;
  version: string;
}

interface BuildResult {
  app: App;
  artifactUrl: string;
  buildTime: number;
}

interface TestResult {
  passed: boolean;
  coverage: number;
  failedTests: string[];
}

interface DeploymentResult {
  environment: 'staging' | 'production';
  url: string;
  deployedAt: Date;
}

interface ValidationResult {
  success: boolean;
  healthChecks: Record<string, boolean>;
}

class DeploymentError extends Error {
  constructor(
    message: string,
    public readonly stage: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'DeploymentError';
  }
}

async function deployApplication(appId: string): Promise<DeploymentResult> {
  try {
    // Step 1: Validate application
    const app = await validateApp(appId);

    // Step 2: Build application
    const buildResult = await buildApp(app);

    // Step 3: Run tests
    const testResult = await runTests(buildResult);
    if (!testResult.passed) {
      throw new DeploymentError(
        'Tests failed',
        'testing',
        { failedTests: testResult.failedTests }
      );
    }

    // Step 4: Deploy to staging
    const stagingResult = await deployToStaging(buildResult);

    // Step 5: Validate staging environment
    const validationResult = await validateStaging(stagingResult);
    if (!validationResult.success) {
      throw new DeploymentError(
        'Staging validation failed',
        'validation',
        { healthChecks: validationResult.healthChecks }
      );
    }

    // Step 6: Deploy to production
    const productionResult = await deployToProduction(buildResult);

    return productionResult;

  } catch (error) {
    if (error instanceof DeploymentError) {
      console.error(`Deployment failed at ${error.stage}:`, error.message, error.details);
    } else {
      console.error('Unexpected deployment error:', error);
    }
    throw error;
  }
}
```

**Improvements**:

- ✅ Linear, readable async/await flow
- ✅ Proper error handling with custom error class
- ✅ Type-safe at every step
- ✅ Clear separation of deployment stages
- ✅ Better error context

---

## Use Modern ES6+ Features

### Problem: Legacy JavaScript patterns

**Before**:

```typescript
var UserService = (function() {
  var apiUrl = 'https://api.example.com';
  var cache = {};

  function fetchUser(userId) {
    if (cache[userId]) {
      return Promise.resolve(cache[userId]);
    }

    return fetch(apiUrl + '/users/' + userId)
      .then(function(response) {
        return response.json();
      })
      .then(function(user) {
        cache[userId] = user;
        return user;
      });
  }

  function formatUserName(user) {
    return user.firstName + ' ' + user.lastName;
  }

  function getUsersByRole(users, role) {
    var filtered = [];
    for (var i = 0; i < users.length; i++) {
      if (users[i].role === role) {
        filtered.push(users[i]);
      }
    }
    return filtered;
  }

  return {
    fetchUser: fetchUser,
    formatUserName: formatUserName,
    getUsersByRole: getUsersByRole
  };
})();
```

**After**:

```typescript
interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user' | 'guest';
  email: string;
}

class UserService {
  private readonly apiUrl = 'https://api.example.com';
  private readonly cache = new Map<string, User>();

  async fetchUser(userId: string): Promise<User> {
    // Check cache first
    const cached = this.cache.get(userId);
    if (cached) {
      return cached;
    }

    // Fetch from API
    const response = await fetch(`${this.apiUrl}/users/${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.status}`);
    }

    const user: User = await response.json();
    this.cache.set(userId, user);

    return user;
  }

  formatUserName(user: User): string {
    return `${user.firstName} ${user.lastName}`;
  }

  getUsersByRole(users: User[], role: User['role']): User[] {
    return users.filter(user => user.role === role);
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

// Usage
const userService = new UserService();
const user = await userService.fetchUser('123');
const fullName = userService.formatUserName(user);
const admins = userService.getUsersByRole([user], 'admin');
```

**Improvements**:

- ✅ ES6 class instead of IIFE
- ✅ Async/await instead of promise chains
- ✅ Template literals instead of string concatenation
- ✅ Array methods (filter) instead of loops
- ✅ Map instead of plain object for cache
- ✅ Proper TypeScript types throughout
- ✅ Private fields with readonly where appropriate

---

## Apply Functional Programming Patterns

### Problem: Imperative, mutation-heavy code

**Before**:

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
}

function processProducts(products: Product[]) {
  // Apply discount
  for (let i = 0; i < products.length; i++) {
    if (products[i].category === 'electronics') {
      products[i].price = products[i].price * 0.9;
    }
  }

  // Filter in-stock
  let inStock = [];
  for (let i = 0; i < products.length; i++) {
    if (products[i].inStock) {
      inStock.push(products[i]);
    }
  }

  // Sort by price
  for (let i = 0; i < inStock.length - 1; i++) {
    for (let j = 0; j < inStock.length - i - 1; j++) {
      if (inStock[j].price > inStock[j + 1].price) {
        let temp = inStock[j];
        inStock[j] = inStock[j + 1];
        inStock[j + 1] = temp;
      }
    }
  }

  // Group by category
  let grouped: any = {};
  for (let i = 0; i < inStock.length; i++) {
    let category = inStock[i].category;
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(inStock[i]);
  }

  return grouped;
}
```

**After**:

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
}

interface DiscountedProduct extends Product {
  originalPrice: number;
  discountApplied: boolean;
}

// Pure function: Apply discount without mutation
function applyDiscount(product: Product): DiscountedProduct {
  const ELECTRONICS_DISCOUNT = 0.10;
  const isElectronics = product.category === 'electronics';

  return {
    ...product,
    originalPrice: product.price,
    price: isElectronics ? product.price * (1 - ELECTRONICS_DISCOUNT) : product.price,
    discountApplied: isElectronics
  };
}

// Pure function: Filter in-stock products
const isInStock = (product: Product): boolean => product.inStock;

// Pure function: Sort by price (ascending)
const byPrice = (a: Product, b: Product): number => a.price - b.price;

// Pure function: Group by category
function groupByCategory<T extends Product>(
  products: T[]
): Map<string, T[]> {
  return products.reduce((groups, product) => {
    const category = product.category;
    const existing = groups.get(category) ?? [];
    groups.set(category, [...existing, product]);
    return groups;
  }, new Map<string, T[]>());
}

// Compose the pipeline
function processProducts(products: Product[]): Map<string, DiscountedProduct[]> {
  return groupByCategory(
    products
      .map(applyDiscount)
      .filter(isInStock)
      .sort(byPrice)
  );
}

// Alternative: Pipe pattern for clarity
function pipe<T>(...fns: Array<(arg: T) => T>) {
  return (value: T) => fns.reduce((acc, fn) => fn(acc), value);
}

const processProductsPipe = (products: Product[]) =>
  pipe(
    (p: Product[]) => p.map(applyDiscount),
    (p: DiscountedProduct[]) => p.filter(isInStock),
    (p: DiscountedProduct[]) => p.sort(byPrice),
    (p: DiscountedProduct[]) => groupByCategory(p)
  )(products);
```

**Improvements**:

- ✅ Pure functions (no mutations)
- ✅ Immutable data transformations
- ✅ Composable, reusable functions
- ✅ Declarative style
- ✅ Type-safe generics
- ✅ Easy to test each function independently

---

## Resources

### Tools

- **TypeScript Compiler** (`tsc`): Type checking
- **ESLint**: Code linting with TypeScript rules
- **Prettier**: Code formatting
- **ts-node**: TypeScript execution
- **TypeDoc**: Documentation generation

### Related Documentation

- [TypeScript Style Guide](../02_language_guides/typescript.md)
- [TypeScript Library Example](../05_examples/typescript_library_example.md)
- [Testing Strategies](../05_ci_cd/testing_strategies.md)

---

**Version**: 1.0.0
