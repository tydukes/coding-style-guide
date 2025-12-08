---
title: "Testing Strategies Documentation"
description: "Comprehensive guide to testing strategies including unit testing, integration testing, E2E testing, performance testing, and test automation for all supported languages"
author: "Tyler Dukes"
date: "2025-12-01"
tags: [testing, unit-tests, integration-tests, e2e, performance, automation, tdd, bdd]
category: "CI/CD"
status: "active"
version: "1.0.0"
---

## Introduction

This guide provides comprehensive testing strategies and best practices for all supported languages and frameworks.
It covers unit testing, integration testing, end-to-end testing, performance testing, and continuous testing in
CI/CD pipelines.

---

## Table of Contents

1. [Testing Pyramid](#testing-pyramid)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [End-to-End Testing](#end-to-end-testing)
5. [Performance Testing](#performance-testing)
6. [Security Testing](#security-testing)
7. [Test Automation](#test-automation)
8. [CI/CD Integration](#cicd-integration)
9. [Best Practices](#best-practices)

---

## Testing Pyramid

### Concept

```text
        /\
       /  \
      / E2E \
     /________\
    /          \
   / Integration\
  /______________\
 /                \
/   Unit Tests     \
/____________________\
```

**Distribution**:

- **Unit Tests**: 70% - Fast, isolated, test individual components
- **Integration Tests**: 20% - Test component interactions
- **E2E Tests**: 10% - Test complete user workflows

### Benefits

- **Fast Feedback**: Unit tests run quickly, catching issues early
- **Cost Efficiency**: Unit tests are cheaper to write and maintain
- **Reliability**: Pyramid structure provides stable, maintainable test suite
- **Coverage**: Comprehensive coverage across all layers

---

## Unit Testing

### Python (pytest)

**Installation**:

```bash
pip install pytest pytest-cov pytest-mock pytest-asyncio
```

**Example test**:

```python
## tests/test_calculator.py
import pytest
from src.calculator import Calculator

class TestCalculator:
    """Test suite for Calculator class."""

    @pytest.fixture
    def calculator(self):
        """Fixture to create Calculator instance."""
        return Calculator()

    def test_add(self, calculator):
        """Test addition operation."""
        result = calculator.add(2, 3)
        assert result == 5

    def test_divide(self, calculator):
        """Test division operation."""
        result = calculator.divide(10, 2)
        assert result == 5

    def test_divide_by_zero(self, calculator):
        """Test division by zero raises ValueError."""
        with pytest.raises(ValueError, match="Cannot divide by zero"):
            calculator.divide(10, 0)

    @pytest.mark.parametrize("a,b,expected", [
        (1, 1, 2),
        (2, 3, 5),
        (-1, 1, 0),
        (0, 0, 0),
    ])
    def test_add_parametrized(self, calculator, a, b, expected):
        """Test addition with multiple inputs."""
        assert calculator.add(a, b) == expected
```

**pytest.ini**:

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts =
    -v
    --strict-markers
    --cov=src
    --cov-report=html
    --cov-report=term-missing
    --cov-fail-under=80
markers =
    slow: marks tests as slow
    integration: marks tests as integration tests
    unit: marks tests as unit tests
```

**Run tests**:

```bash
## Run all tests
pytest

## Run with coverage
pytest --cov=src --cov-report=html

## Run specific test
pytest tests/test_calculator.py::TestCalculator::test_add

## Run with markers
pytest -m unit
pytest -m "not slow"

## Run in parallel
pytest -n auto
```

### JavaScript/TypeScript (Jest)

**Installation**:

```bash
npm install --save-dev jest @types/jest ts-jest @testing-library/jest-dom
```

**jest.config.js**:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.spec.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
```

**Example test**:

```typescript
// tests/calculator.test.ts
import { Calculator } from '../src/calculator';

describe('Calculator', () => {
  let calculator: Calculator;

  beforeEach(() => {
    calculator = new Calculator();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('add', () => {
    it('should add two numbers correctly', () => {
      const result = calculator.add(2, 3);
      expect(result).toBe(5);
    });

    it.each([
      [1, 1, 2],
      [2, 3, 5],
      [-1, 1, 0],
      [0, 0, 0],
    ])('should add %i and %i to equal %i', (a, b, expected) => {
      expect(calculator.add(a, b)).toBe(expected);
    });
  });

  describe('divide', () => {
    it('should divide two numbers correctly', () => {
      const result = calculator.divide(10, 2);
      expect(result).toBe(5);
    });

    it('should throw error when dividing by zero', () => {
      expect(() => calculator.divide(10, 0)).toThrow('Cannot divide by zero');
    });
  });
});
```

**Mocking example**:

```typescript
// tests/user-service.test.ts
import { UserService } from '../src/user-service';
import { UserRepository } from '../src/user-repository';

jest.mock('../src/user-repository');

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
    userService = new UserService(mockUserRepository);
  });

  it('should get user by id', async () => {
    const mockUser = { id: 1, name: 'John' };
    mockUserRepository.findById.mockResolvedValue(mockUser);

    const result = await userService.getUser(1);

    expect(result).toEqual(mockUser);
    expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
  });
});
```

**Run tests**:

```bash
## Run all tests
npm test

## Run with coverage
npm test -- --coverage

## Run in watch mode
npm test -- --watch

## Run specific test
npm test -- calculator.test.ts

## Update snapshots
npm test -- -u
```

### Go (testing package)

**Example test**:

```go
// calculator_test.go
package calculator

import (
    "testing"
)

func TestAdd(t *testing.T) {
    tests := []struct {
        name     string
        a, b     int
        expected int
    }{
        {"positive numbers", 2, 3, 5},
        {"negative numbers", -1, -1, -2},
        {"zero", 0, 0, 0},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result := Add(tt.a, tt.b)
            if result != tt.expected {
                t.Errorf("Add(%d, %d) = %d; want %d",
                    tt.a, tt.b, result, tt.expected)
            }
        })
    }
}

func BenchmarkAdd(b *testing.B) {
    for i := 0; i < b.N; i++ {
        Add(2, 3)
    }
}
```

**Run tests**:

```bash
## Run all tests
go test ./...

## Run with coverage
go test -cover ./...
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out

## Run benchmarks
go test -bench=. ./...

## Run with race detector
go test -race ./...
```

---

## Integration Testing

### Database Integration (Python)

**Using testcontainers**:

```python
## tests/integration/test_user_repository.py
import pytest
from testcontainers.postgres import PostgresContainer
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.models import Base, User
from src.repositories import UserRepository

@pytest.fixture(scope="module")
def postgres_container():
    """Start PostgreSQL container for testing."""
    with PostgresContainer("postgres:15-alpine") as postgres:
        yield postgres

@pytest.fixture(scope="module")
def db_engine(postgres_container):
    """Create database engine."""
    engine = create_engine(postgres_container.get_connection_url())
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)

@pytest.fixture
def db_session(db_engine):
    """Create database session for each test."""
    Session = sessionmaker(bind=db_engine)
    session = Session()
    yield session
    session.rollback()
    session.close()

class TestUserRepository:
    """Integration tests for UserRepository."""

    def test_create_user(self, db_session):
        """Test creating a user in database."""
        repo = UserRepository(db_session)
        user = repo.create(name="John Doe", email="john@example.com")

        assert user.id is not None
        assert user.name == "John Doe"
        assert user.email == "john@example.com"

    def test_find_user_by_email(self, db_session):
        """Test finding user by email."""
        repo = UserRepository(db_session)
        repo.create(name="Jane Doe", email="jane@example.com")

        user = repo.find_by_email("jane@example.com")

        assert user is not None
        assert user.name == "Jane Doe"
```

### API Integration (TypeScript)

**Using supertest**:

```typescript
// tests/integration/user-api.test.ts
import request from 'supertest';
import { App } from '../../src/app';
import { Database } from '../../src/database';

describe('User API Integration Tests', () => {
  let app: Express.Application;
  let db: Database;

  beforeAll(async () => {
    db = await Database.connect(process.env.TEST_DATABASE_URL);
    app = new App(db).express;
  });

  afterAll(async () => {
    await db.disconnect();
  });

  beforeEach(async () => {
    await db.clear();
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'John Doe',
        email: 'john@example.com',
      });
      expect(response.body.id).toBeDefined();
    });

    it('should return 400 for invalid email', async () => {
      await request(app)
        .post('/api/users')
        .send({
          name: 'John Doe',
          email: 'invalid-email',
        })
        .expect(400);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by id', async () => {
      const createResponse = await request(app)
        .post('/api/users')
        .send({ name: 'Jane Doe', email: 'jane@example.com' });

      const userId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: userId,
        name: 'Jane Doe',
        email: 'jane@example.com',
      });
    });
  });
});
```

### Docker Compose Integration

**docker-compose.test.yml**:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: testuser
      POSTGRES_PASSWORD: testpass
      POSTGRES_DB: testdb
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://testuser:testpass@postgres:5432/testdb
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    command: npm test

  api-tests:
    build:
      context: .
      dockerfile: Dockerfile.test
    environment:
      API_URL: http://api:3000
    depends_on:
      - api
    command: npm run test:integration
```

**Run integration tests**:

```bash
## Start services and run tests
docker-compose -f docker-compose.test.yml up --abort-on-container-exit

## Cleanup
docker-compose -f docker-compose.test.yml down -v
```

---

## End-to-End Testing

### Playwright (Web)

**Installation**:

```bash
npm install --save-dev @playwright/test
npx playwright install
```

**playwright.config.ts**:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Example E2E test**:

```typescript
// tests/e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toHaveText('Dashboard');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error')).toHaveText('Invalid credentials');
  });

  test('should validate required fields', async ({ page }) => {
    await page.click('button[type="submit"]');

    await expect(page.locator('input[name="email"]:invalid')).toBeVisible();
    await expect(page.locator('input[name="password"]:invalid')).toBeVisible();
  });
});
```

**Page Object Model**:

```typescript
// tests/e2e/pages/login.page.ts
import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }

  async getErrorMessage() {
    return this.page.locator('.error').textContent();
  }
}

// Usage in test
import { LoginPage } from './pages/login.page';

test('should login with page object', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password123');
  await expect(page).toHaveURL('/dashboard');
});
```

**Run tests**:

```bash
## Run all E2E tests
npx playwright test

## Run in headed mode
npx playwright test --headed

## Run specific browser
npx playwright test --project=chromium

## Debug mode
npx playwright test --debug

## Show report
npx playwright show-report
```

### Cypress (Alternative)

**Installation**:

```bash
npm install --save-dev cypress
npx cypress open
```

**cypress.config.ts**:

```typescript
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    video: false,
    screenshotOnRunFailure: true,
  },
});
```

**Example test**:

```typescript
// cypress/e2e/login.cy.ts
describe('Login Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should login successfully', () => {
    cy.get('input[name="email"]').type('user@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/dashboard');
    cy.get('h1').should('contain', 'Dashboard');
  });

  it('should show error for invalid credentials', () => {
    cy.get('input[name="email"]').type('user@example.com');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    cy.get('.error').should('be.visible').and('contain', 'Invalid credentials');
  });
});
```

---

## Performance Testing

### k6 (Load Testing)

**Installation**:

```bash
## macOS
brew install k6

## Linux
wget https://github.com/grafana/k6/releases/download/v0.48.0/k6-v0.48.0-linux-amd64.tar.gz
tar -xzf k6-v0.48.0-linux-amd64.tar.gz
sudo mv k6-v0.48.0-linux-amd64/k6 /usr/local/bin/
```

**Example load test**:

```javascript
// tests/load/api-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiTrend = new Trend('api_duration');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '3m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 100 },  // Ramp up to 100 users
    { duration: '3m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.1'],
  },
};

export default function () {
  const url = 'https://api.example.com/users';
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = http.get(url, params);

  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'response has data': (r) => r.json('data') !== undefined,
  });

  errorRate.add(!success);
  apiTrend.add(response.timings.duration);

  sleep(1);
}
```

**Run load test**:

```bash
## Run test
k6 run tests/load/api-load-test.js

## Run with specific VUs and duration
k6 run --vus 100 --duration 30s tests/load/api-load-test.js

## Output to InfluxDB
k6 run --out influxdb=http://localhost:8086/mydb tests/load/api-load-test.js
```

### Apache JMeter

**Installation**:

```bash
## macOS
brew install jmeter

## Manual download
wget https://dlcdn.apache.org//jmeter/binaries/apache-jmeter-5.6.2.tgz
tar -xzf apache-jmeter-5.6.2.tgz
```

**Run JMeter**:

```bash
## GUI mode
jmeter

## CLI mode
jmeter -n -t test-plan.jmx -l results.jtl -e -o report/

## With variables
jmeter -n -t test-plan.jmx -Jusers=100 -Jduration=300
```

### Locust (Python)

**Installation**:

```bash
pip install locust
```

**locustfile.py**:

```python
from locust import HttpUser, task, between

class WebsiteUser(HttpUser):
    wait_time = between(1, 3)

    @task(3)
    def view_items(self):
        """View items endpoint (higher weight)."""
        self.client.get("/api/items")

    @task(1)
    def view_item(self):
        """View single item."""
        item_id = 1
        self.client.get(f"/api/items/{item_id}")

    @task(2)
    def create_item(self):
        """Create new item."""
        self.client.post("/api/items", json={
            "name": "Test Item",
            "description": "Test Description"
        })

    def on_start(self):
        """Login before starting tasks."""
        self.client.post("/api/login", json={
            "email": "user@example.com",
            "password": "password123"
        })
```

**Run Locust**:

```bash
## Web UI
locust -f locustfile.py --host=https://api.example.com

## Headless
locust -f locustfile.py \
  --host=https://api.example.com \
  --users 100 \
  --spawn-rate 10 \
  --run-time 5m \
  --headless
```

---

## Security Testing

### OWASP ZAP (API Testing)

**zap-api-scan.yaml**:

```yaml
## ZAP API scan configuration
env:
  contexts:
    - name: api-context
      urls:
        - https://api.example.com
      includePaths:
        - https://api.example.com/api/.*
      excludePaths:
        - https://api.example.com/api/health

  vars:
    apiKey: ${API_KEY}

jobs:
  - type: openapi
    parameters:
      apiFile: openapi.yaml
      apiUrl: https://api.example.com
      targetUrl: https://api.example.com

  - type: passiveScan-config
    parameters:
      maxAlertsPerRule: 10

  - type: activeScan
    parameters:
      context: api-context
      policy: API-Scan
```

**Run scan**:

```bash
docker run -v $(pwd):/zap/wrk/:rw \
  zaproxy/zap-stable \
  zap-api-scan.py \
  -t https://api.example.com/openapi.json \
  -f openapi \
  -c zap-api-scan.yaml \
  -r zap-api-report.html
```

---

## Test Automation

### Contract Testing (Pact)

**Consumer test (TypeScript)**:

```typescript
// tests/contract/user-service.pact.ts
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { UserService } from '../../src/user-service';

const provider = new PactV3({
  consumer: 'UserServiceConsumer',
  provider: 'UserAPI',
});

describe('User Service Contract', () => {
  it('should get user by id', async () => {
    await provider
      .given('user 1 exists')
      .uponReceiving('a request for user 1')
      .withRequest({
        method: 'GET',
        path: '/api/users/1',
        headers: {
          Accept: 'application/json',
        },
      })
      .willRespondWith({
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          id: MatchersV3.integer(1),
          name: MatchersV3.string('John Doe'),
          email: MatchersV3.regex('john@example.com', '\\S+@\\S+'),
        },
      })
      .executeTest(async (mockServer) => {
        const userService = new UserService(mockServer.url);
        const user = await userService.getUser(1);

        expect(user).toMatchObject({
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
        });
      });
  });
});
```

### Mutation Testing (Python - mutmut)

**Installation**:

```bash
pip install mutmut
```

**Configuration (.mutmut.toml)**:

```toml
[mutmut]
paths_to_mutate = src/
tests_dir = tests/
runner = pytest
```

**Run mutation testing**:

```bash
## Run mutation tests
mutmut run

## Show results
mutmut results

## Show surviving mutants
mutmut show
```

---

## CI/CD Integration

### GitHub Actions - Complete Test Suite

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ['3.10', '3.11', '3.12']
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}

      - name: Install dependencies
        run: |
          pip install -e .[test]

      - name: Run unit tests
        run: |
          pytest tests/unit -v --cov=src --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Run integration tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb
          REDIS_URL: redis://localhost:6379
        run: |
          pytest tests/integration -v

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npx playwright test

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

  performance-tests:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Run k6 load test
        uses: grafana/k6-action@v0.3.1
        with:
          filename: tests/load/api-load-test.js

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: k6-results
          path: summary.json
```

---

## Best Practices

### Test Organization

**Directory structure**:

```text
tests/
├── unit/                    # Unit tests
│   ├── test_calculator.py
│   └── test_validator.py
├── integration/             # Integration tests
│   ├── test_database.py
│   └── test_api.py
├── e2e/                     # End-to-end tests
│   ├── login.spec.ts
│   └── checkout.spec.ts
├── load/                    # Performance tests
│   └── api-load-test.js
├── fixtures/                # Test data
│   └── users.json
├── helpers/                 # Test utilities
│   └── test-helpers.ts
└── conftest.py             # Pytest configuration
```

### Test Naming Conventions

```python
## Good naming
def test_user_creation_with_valid_email_succeeds():
    pass

def test_division_by_zero_raises_value_error():
    pass

## Poor naming
def test_user():
    pass

def test_1():
    pass
```

### AAA Pattern (Arrange-Act-Assert)

```python
def test_user_login():
    # Arrange
    user = User(email="test@example.com", password="password123")
    auth_service = AuthService()

    # Act
    result = auth_service.login(user.email, user.password)

    # Assert
    assert result.success is True
    assert result.token is not None
```

### Test Independence

```python
## Good - Each test is independent
def test_create_user():
    user = create_user("test@example.com")
    assert user.email == "test@example.com"

def test_delete_user():
    user = create_user("delete@example.com")
    delete_user(user.id)
    assert get_user(user.id) is None

## Bad - Tests depend on execution order
def test_create_user():
    global user_id
    user = create_user("test@example.com")
    user_id = user.id

def test_delete_user():
    delete_user(user_id)  # Depends on previous test
```

### Coverage Goals

- **Statements**: 80% minimum
- **Branches**: 75% minimum
- **Functions**: 80% minimum
- **Lines**: 80% minimum

### Continuous Testing

1. **Run tests locally** before pushing
2. **Run tests in CI** on every push
3. **Block merges** if tests fail
4. **Monitor test execution time**
5. **Review flaky tests** regularly

---

## Resources

- [pytest Documentation](https://docs.pytest.org/)
- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [k6 Documentation](https://k6.io/docs/)
- [Testing Best Practices](https://testingjavascript.com/)

---

**Next Steps:**

- Review the [CI/CD Integration](github_actions_guide.md) for automated testing
- See [Security Scanning Guide](security_scanning_guide.md) for security testing
- Check [Pre-commit Hooks Guide](precommit_hooks_guide.md) for local test execution
