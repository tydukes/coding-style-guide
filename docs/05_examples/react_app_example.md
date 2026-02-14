---
title: "Complete TypeScript React Application Example"
description: "Full working example of a production-ready React application with TypeScript best practices"
author: "Tyler Dukes"
tags: [typescript, react, frontend, vite, example, best-practices, complete]
category: "Examples"
status: "active"
---

<!-- markdownlint-disable MD013 -->

## Overview

This is a complete, working example of a production-ready React application called **taskboard** - a
task management dashboard. It demonstrates all best practices from the TypeScript Style Guide,
including strict type safety, component architecture, custom hooks, comprehensive testing with Vitest
and React Testing Library, and CI/CD integration.

**Project Purpose**: A single-page task management dashboard that consumes a REST API, supports
filtering, sorting, and form validation.

---

## Project Structure

```text
taskboard/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── TaskList.tsx
│   │   ├── TaskCard.tsx
│   │   ├── TaskForm.tsx
│   │   └── ErrorBoundary.tsx
│   ├── hooks/
│   │   ├── useTasks.ts
│   │   └── useForm.ts
│   ├── services/
│   │   └── api.ts
│   ├── types/
│   │   └── index.ts
│   └── styles/
│       └── global.css
├── tests/
│   ├── components/
│   │   ├── TaskList.test.tsx
│   │   ├── TaskCard.test.tsx
│   │   └── TaskForm.test.tsx
│   ├── hooks/
│   │   └── useTasks.test.ts
│   └── setup.ts
├── public/
│   └── favicon.svg
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── eslint.config.ts
├── .prettierrc.json
├── .github/
│   └── workflows/
│       └── ci.yml
├── .pre-commit-config.yaml
├── Dockerfile
└── README.md
```

---

## package.json

```json
{
  "name": "taskboard",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src/ tests/",
    "lint:fix": "eslint --fix src/ tests/",
    "format": "prettier --write 'src/**/*.{ts,tsx}' 'tests/**/*.{ts,tsx}'",
    "format:check": "prettier --check 'src/**/*.{ts,tsx}'",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.1.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "eslint": "^9.17.0",
    "eslint-config-prettier": "^10.0.0",
    "eslint-plugin-react-hooks": "^5.1.0",
    "jsdom": "^25.0.0",
    "prettier": "^3.4.0",
    "typescript": "^5.7.0",
    "typescript-eslint": "^8.18.0",
    "vite": "^6.0.0",
    "vitest": "^3.0.0",
    "@vitest/coverage-v8": "^3.0.0"
  }
}
```

---

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"]
}
```

---

## tsconfig.node.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["vite.config.ts", "vitest.config.ts", "eslint.config.ts"]
}
```

---

## vite.config.ts

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
});
```

---

## vitest.config.ts

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/main.tsx"],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
});
```

---

## eslint.config.ts

```typescript
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    plugins: {
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        { allowExpressions: true },
      ],
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  eslintConfigPrettier,
);
```

---

## .prettierrc.json

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

---

## src/types/index.ts

```typescript
/** Valid task status values. */
export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";

/** Valid task priority levels. */
export type TaskPriority = "low" | "medium" | "high" | "critical";

/** A single task entity returned by the API. */
export interface Task {
  readonly id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  owner_id: number;
  readonly created_at: string;
  readonly updated_at: string;
}

/** Payload for creating a new task. */
export interface CreateTaskPayload {
  title: string;
  description?: string;
  priority?: TaskPriority;
}

/** Payload for updating an existing task. */
export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

/** Paginated API response wrapper. */
export interface PaginatedResponse<T> {
  tasks: T[];
  total: number;
  page: number;
  pages: number;
}

/** Standard API envelope. */
export interface ApiResponse<T> {
  status: "success" | "error";
  message: string;
  data: T;
  errors?: string[];
}

/** Filter options for the task list. */
export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  page?: number;
  perPage?: number;
}
```

---

## src/services/api.ts

```typescript
import type {
  ApiResponse,
  CreateTaskPayload,
  PaginatedResponse,
  Task,
  TaskFilters,
  UpdateTaskPayload,
} from "@/types";

const BASE_URL = "/api/v1";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
      ...options?.headers,
    },
    ...options,
  });

  const body = (await response.json()) as ApiResponse<T>;

  if (!response.ok || body.status === "error") {
    throw new Error(body.message ?? `Request failed: ${response.status}`);
  }

  return body.data;
}

export async function fetchTasks(
  filters: TaskFilters = {},
): Promise<PaginatedResponse<Task>> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.perPage) params.set("per_page", String(filters.perPage));

  const query = params.toString();
  return request<PaginatedResponse<Task>>(`/tasks${query ? `?${query}` : ""}`);
}

export async function fetchTask(id: number): Promise<Task> {
  return request<Task>(`/tasks/${id}`);
}

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  return request<Task>("/tasks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTask(
  id: number,
  payload: UpdateTaskPayload,
): Promise<Task> {
  return request<Task>(`/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteTask(id: number): Promise<void> {
  await request<null>(`/tasks/${id}`, { method: "DELETE" });
}
```

---

## src/hooks/useTasks.ts

```typescript
import { useCallback, useEffect, useState } from "react";

import type { CreateTaskPayload, Task, TaskFilters, UpdateTaskPayload } from "@/types";
import * as api from "@/services/api";

interface UseTasksResult {
  tasks: Task[];
  total: number;
  page: number;
  pages: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addTask: (payload: CreateTaskPayload) => Promise<void>;
  editTask: (id: number, payload: UpdateTaskPayload) => Promise<void>;
  removeTask: (id: number) => Promise<void>;
}

export function useTasks(filters: TaskFilters = {}): UseTasksResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchTasks(filters);
      setTasks(data.tasks);
      setTotal(data.total);
      setPage(data.page);
      setPages(data.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addTask = useCallback(
    async (payload: CreateTaskPayload): Promise<void> => {
      await api.createTask(payload);
      await refresh();
    },
    [refresh],
  );

  const editTask = useCallback(
    async (id: number, payload: UpdateTaskPayload): Promise<void> => {
      await api.updateTask(id, payload);
      await refresh();
    },
    [refresh],
  );

  const removeTask = useCallback(
    async (id: number): Promise<void> => {
      await api.deleteTask(id);
      await refresh();
    },
    [refresh],
  );

  return { tasks, total, page, pages, loading, error, refresh, addTask, editTask, removeTask };
}
```

---

## src/hooks/useForm.ts

```typescript
import { useCallback, useState } from "react";

type ValidationRule<T> = {
  validate: (value: T[keyof T], values: T) => boolean;
  message: string;
};

type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T>[];
};

interface UseFormResult<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  handleChange: (field: keyof T, value: T[keyof T]) => void;
  handleBlur: (field: keyof T) => void;
  handleSubmit: (onSubmit: (values: T) => Promise<void>) => () => Promise<void>;
  reset: () => void;
  isValid: boolean;
}

export function useForm<T extends Record<string, unknown>>(
  initialValues: T,
  rules: ValidationRules<T> = {},
): UseFormResult<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const validateField = useCallback(
    (field: keyof T, value: T[keyof T], allValues: T): string | undefined => {
      const fieldRules = rules[field];
      if (!fieldRules) return undefined;

      for (const rule of fieldRules) {
        if (!rule.validate(value, allValues)) {
          return rule.message;
        }
      }
      return undefined;
    },
    [rules],
  );

  const handleChange = useCallback(
    (field: keyof T, value: T[keyof T]): void => {
      setValues((prev) => {
        const next = { ...prev, [field]: value };
        const fieldError = validateField(field, value, next);
        setErrors((prevErrors) => ({ ...prevErrors, [field]: fieldError }));
        return next;
      });
    },
    [validateField],
  );

  const handleBlur = useCallback((field: keyof T): void => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleSubmit = useCallback(
    (onSubmit: (values: T) => Promise<void>) =>
      async (): Promise<void> => {
        const allErrors: Partial<Record<keyof T, string>> = {};
        for (const field of Object.keys(values) as Array<keyof T>) {
          const error = validateField(field, values[field], values);
          if (error) allErrors[field] = error;
        }
        setErrors(allErrors);
        setTouched(
          Object.fromEntries(
            Object.keys(values).map((k) => [k, true]),
          ) as Record<keyof T, boolean>,
        );
        if (Object.values(allErrors).every((e) => e === undefined)) {
          await onSubmit(values);
        }
      },
    [values, validateField],
  );

  const reset = useCallback((): void => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const isValid = Object.values(errors).every((e) => e === undefined);

  return { values, errors, touched, handleChange, handleBlur, handleSubmit, reset, isValid };
}
```

---

## src/main.tsx

```typescript
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import "./styles/global.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

---

## src/App.tsx

```typescript
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Layout } from "@/components/Layout";
import { TaskList } from "@/components/TaskList";

export function App(): React.JSX.Element {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<TaskList />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
```

---

## src/components/ErrorBoundary.tsx

```typescript
import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Uncaught error:", error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div role="alert">
          <h2>Something went wrong</h2>
          <pre>{this.state.error?.message}</pre>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

---

## src/components/Layout.tsx

```typescript
import { Outlet } from "react-router-dom";

export function Layout(): React.JSX.Element {
  return (
    <div className="layout">
      <header>
        <h1>Taskboard</h1>
        <nav>
          <a href="/">Tasks</a>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer>
        <p>Taskboard &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
```

---

## src/components/TaskCard.tsx

```typescript
import type { Task } from "@/types";

interface TaskCardProps {
  task: Task;
  onStatusChange: (id: number, status: Task["status"]) => void;
  onDelete: (id: number) => void;
}

const PRIORITY_COLORS: Record<Task["priority"], string> = {
  low: "#4caf50",
  medium: "#ff9800",
  high: "#f44336",
  critical: "#9c27b0",
};

export function TaskCard({ task, onStatusChange, onDelete }: TaskCardProps): React.JSX.Element {
  return (
    <article className="task-card" data-testid={`task-${task.id}`}>
      <header>
        <h3>{task.title}</h3>
        <span
          className="priority-badge"
          style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
        >
          {task.priority}
        </span>
      </header>

      {task.description && <p>{task.description}</p>}

      <footer>
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value as Task["status"])}
          aria-label={`Status for ${task.title}`}
        >
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <button onClick={() => onDelete(task.id)} aria-label={`Delete ${task.title}`}>
          Delete
        </button>
      </footer>
    </article>
  );
}
```

---

## src/components/TaskList.tsx

```typescript
import { useState } from "react";

import type { TaskFilters, TaskStatus } from "@/types";
import { useTasks } from "@/hooks/useTasks";
import { TaskCard } from "@/components/TaskCard";
import { TaskForm } from "@/components/TaskForm";

export function TaskList(): React.JSX.Element {
  const [filters, setFilters] = useState<TaskFilters>({});
  const { tasks, total, loading, error, addTask, editTask, removeTask } = useTasks(filters);

  if (error) {
    return <div role="alert">Error: {error}</div>;
  }

  return (
    <section>
      <div className="toolbar">
        <select
          value={filters.status ?? ""}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              status: (e.target.value || undefined) as TaskStatus | undefined,
            }))
          }
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <span>{total} tasks</span>
      </div>

      <TaskForm onSubmit={addTask} />

      {loading ? (
        <p aria-live="polite">Loading tasks...</p>
      ) : (
        <div className="task-grid">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={(id, status) => editTask(id, { status })}
              onDelete={removeTask}
            />
          ))}
          {tasks.length === 0 && <p>No tasks found.</p>}
        </div>
      )}
    </section>
  );
}
```

---

## src/components/TaskForm.tsx

```typescript
import type { CreateTaskPayload, TaskPriority } from "@/types";
import { useForm } from "@/hooks/useForm";

interface TaskFormProps {
  onSubmit: (payload: CreateTaskPayload) => Promise<void>;
}

interface FormValues {
  title: string;
  description: string;
  priority: TaskPriority;
}

export function TaskForm({ onSubmit }: TaskFormProps): React.JSX.Element {
  const { values, errors, touched, handleChange, handleBlur, handleSubmit, reset } =
    useForm<FormValues>(
      { title: "", description: "", priority: "medium" },
      {
        title: [
          {
            validate: (v) => typeof v === "string" && v.trim().length > 0,
            message: "Title is required",
          },
          {
            validate: (v) => typeof v === "string" && v.length <= 200,
            message: "Title must be 200 characters or fewer",
          },
        ],
      },
    );

  const submit = handleSubmit(async (formValues: FormValues): Promise<void> => {
    await onSubmit({
      title: formValues.title.trim(),
      description: formValues.description.trim() || undefined,
      priority: formValues.priority,
    });
    reset();
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      aria-label="Create task"
    >
      <div>
        <label htmlFor="title">Title</label>
        <input
          id="title"
          value={values.title}
          onChange={(e) => handleChange("title", e.target.value)}
          onBlur={() => handleBlur("title")}
          aria-invalid={touched.title && !!errors.title}
        />
        {touched.title && errors.title && <span role="alert">{errors.title}</span>}
      </div>

      <div>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={values.description}
          onChange={(e) => handleChange("description", e.target.value)}
          onBlur={() => handleBlur("description")}
        />
      </div>

      <div>
        <label htmlFor="priority">Priority</label>
        <select
          id="priority"
          value={values.priority}
          onChange={(e) => handleChange("priority", e.target.value as TaskPriority)}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <button type="submit">Add Task</button>
    </form>
  );
}
```

---

## tests/setup.ts

```typescript
import "@testing-library/jest-dom/vitest";
```

---

## tests/components/TaskCard.test.tsx

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TaskCard } from "@/components/TaskCard";
import type { Task } from "@/types";

const mockTask: Task = {
  id: 1,
  title: "Write documentation",
  description: "Add API docs",
  status: "pending",
  priority: "high",
  owner_id: 1,
  created_at: "2025-01-15T00:00:00Z",
  updated_at: "2025-01-15T00:00:00Z",
};

describe("TaskCard", () => {
  it("renders the task title and priority", () => {
    render(<TaskCard task={mockTask} onStatusChange={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText("Write documentation")).toBeInTheDocument();
    expect(screen.getByText("high")).toBeInTheDocument();
  });

  it("renders the description when present", () => {
    render(<TaskCard task={mockTask} onStatusChange={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText("Add API docs")).toBeInTheDocument();
  });

  it("calls onStatusChange when status is updated", async () => {
    const onStatusChange = vi.fn();
    const user = userEvent.setup();
    render(<TaskCard task={mockTask} onStatusChange={onStatusChange} onDelete={vi.fn()} />);

    const select = screen.getByLabelText(/status for/i);
    await user.selectOptions(select, "completed");

    expect(onStatusChange).toHaveBeenCalledWith(1, "completed");
  });

  it("calls onDelete when delete button is clicked", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(<TaskCard task={mockTask} onStatusChange={vi.fn()} onDelete={onDelete} />);

    await user.click(screen.getByLabelText(/delete/i));

    expect(onDelete).toHaveBeenCalledWith(1);
  });
});
```

---

## tests/components/TaskList.test.tsx

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TaskList } from "@/components/TaskList";
import * as api from "@/services/api";

vi.mock("@/services/api");

const mockedApi = vi.mocked(api);

describe("TaskList", () => {
  it("shows loading state initially", () => {
    mockedApi.fetchTasks.mockReturnValue(new Promise(() => {}));
    render(<TaskList />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders tasks after loading", async () => {
    mockedApi.fetchTasks.mockResolvedValue({
      tasks: [
        {
          id: 1,
          title: "Task A",
          description: "",
          status: "pending",
          priority: "medium",
          owner_id: 1,
          created_at: "2025-01-15T00:00:00Z",
          updated_at: "2025-01-15T00:00:00Z",
        },
      ],
      total: 1,
      page: 1,
      pages: 1,
    });

    render(<TaskList />);

    await waitFor(() => {
      expect(screen.getByText("Task A")).toBeInTheDocument();
    });
    expect(screen.getByText("1 tasks")).toBeInTheDocument();
  });

  it("renders error state", async () => {
    mockedApi.fetchTasks.mockRejectedValue(new Error("Network error"));
    render(<TaskList />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Network error");
    });
  });
});
```

---

## tests/components/TaskForm.test.tsx

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TaskForm } from "@/components/TaskForm";

describe("TaskForm", () => {
  it("submits a valid form", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<TaskForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/title/i), "New task");
    await user.selectOptions(screen.getByLabelText(/priority/i), "high");
    await user.click(screen.getByRole("button", { name: /add task/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: "New task",
        description: undefined,
        priority: "high",
      });
    });
  });

  it("shows validation error for empty title", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<TaskForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: /add task/i }));

    expect(screen.getByRole("alert")).toHaveTextContent("Title is required");
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
```

---

## tests/hooks/useTasks.test.ts

```typescript
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useTasks } from "@/hooks/useTasks";
import * as api from "@/services/api";

vi.mock("@/services/api");

const mockedApi = vi.mocked(api);

const emptyPage = { tasks: [], total: 0, page: 1, pages: 0 };

describe("useTasks", () => {
  it("fetches tasks on mount", async () => {
    mockedApi.fetchTasks.mockResolvedValue(emptyPage);

    const { result } = renderHook(() => useTasks());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockedApi.fetchTasks).toHaveBeenCalledTimes(1);
    expect(result.current.tasks).toEqual([]);
  });

  it("sets error on fetch failure", async () => {
    mockedApi.fetchTasks.mockRejectedValue(new Error("Offline"));

    const { result } = renderHook(() => useTasks());

    await waitFor(() => expect(result.current.error).toBe("Offline"));
  });

  it("addTask calls API and refreshes", async () => {
    mockedApi.fetchTasks.mockResolvedValue(emptyPage);
    mockedApi.createTask.mockResolvedValue({
      id: 1,
      title: "New",
      description: "",
      status: "pending",
      priority: "medium",
      owner_id: 1,
      created_at: "",
      updated_at: "",
    });

    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addTask({ title: "New" });
    });

    expect(mockedApi.createTask).toHaveBeenCalledWith({ title: "New" });
    expect(mockedApi.fetchTasks).toHaveBeenCalledTimes(2);
  });
});
```

---

## Dockerfile

```dockerfile
# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:1.27-alpine AS runtime

COPY --from=builder /app/dist /usr/share/nginx/html

# SPA routing: serve index.html for all paths
RUN printf 'server {\n\
  listen 80;\n\
  root /usr/share/nginx/html;\n\
  location / {\n\
    try_files $uri $uri/ /index.html;\n\
  }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

---

## .github/workflows/ci.yml

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: ESLint
        run: npm run lint

      - name: Prettier
        run: npm run format:check

      - name: Type check
        run: npm run typecheck

  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: ["20", "22"]
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:coverage

      - name: Upload coverage
        if: matrix.node-version == '22'
        uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: coverage/

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload build
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
```

---

## .pre-commit-config.yaml

```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v5.0.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-json
      - id: check-added-large-files

  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v9.17.0
    hooks:
      - id: eslint
        files: \.(ts|tsx)$
        additional_dependencies:
          - eslint@9.17.0
          - typescript-eslint@8.18.0
          - eslint-config-prettier@10.0.0
          - eslint-plugin-react-hooks@5.1.0

  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: v3.4.0
    hooks:
      - id: prettier
        types_or: [typescript, tsx, json, css]
```

---

## Key Takeaways

This complete React application example demonstrates:

1. **Strict TypeScript Configuration**: `strict: true` with `noUnusedLocals` and `noUnusedParameters` catches errors at compile time
2. **Component Architecture**: Presentational components (`TaskCard`) separated from stateful containers (`TaskList`)
3. **Custom Hooks**: `useTasks` encapsulates all data fetching logic with loading, error, and pagination state
4. **Generic Form Hook**: `useForm` provides reusable validation with per-field rules and touched tracking
5. **Typed API Client**: `api.ts` provides full type safety from request to response
6. **Error Boundary**: Class-based error boundary catches rendering errors with graceful fallback
7. **Comprehensive Testing**: Vitest with React Testing Library for component, hook, and integration tests
8. **Accessibility**: ARIA labels, roles, and `aria-live` regions for screen reader support
9. **Multi-stage Docker Build**: Node.js builder plus lightweight nginx for production serving
10. **Vite Configuration**: Path aliases, vendor chunking, API proxy, and source maps

The application is production-ready and follows React + TypeScript best practices for structure,
type safety, and testability.

---

**Status**: Active
