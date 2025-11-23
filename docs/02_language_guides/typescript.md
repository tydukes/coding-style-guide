---
title: "TypeScript Style Guide"
description: "TypeScript coding standards for React, Next.js, and Node.js applications"
author: "Tyler Dukes"
date: "2025-10-28"
tags: [typescript, javascript, react, nextjs, nodejs]
category: "Language Guides"
status: "needs-expansion"
version: "0.1.0"
---


- Strict ESLint + Prettier + full type safety.
- Use `tsconfig.json` with `strict: true`.

## Canonical example

```ts
// @module: util
export function sum(a: number, b: number): number { return a + b }
```
