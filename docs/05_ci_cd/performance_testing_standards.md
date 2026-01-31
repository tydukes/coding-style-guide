---
title: "Performance Testing Standards"
description: "Comprehensive performance testing standards using k6, JMeter, and Gatling for load testing and performance validation"
author: "Tyler Dukes"
tags: [performance-testing, k6, jmeter, gatling, load-testing, stress-testing]
category: "CI/CD"
status: "active"
---

## Overview

Performance testing ensures applications meet response time, throughput, and scalability
requirements under various load conditions. This guide covers standards for three
industry-leading tools: **k6**, **JMeter**, and **Gatling**.

### Performance Testing Types

| Type | Purpose | Duration | Load Pattern |
|------|---------|----------|--------------|
| **Load Testing** | Verify normal conditions | 5-30 min | Expected users |
| **Stress Testing** | Find breaking points | 15-60 min | Beyond capacity |
| **Spike Testing** | Handle sudden surges | 5-15 min | Sharp increase |
| **Soak Testing** | Memory leaks, degradation | 1-8 hours | Sustained load |
| **Scalability Testing** | Verify horizontal scaling | 30-60 min | Incremental increase |

### Performance Thresholds

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| **p50 Response Time** | < 200ms | < 500ms | > 500ms |
| **p95 Response Time** | < 500ms | < 1000ms | > 1000ms |
| **p99 Response Time** | < 1000ms | < 2000ms | > 2000ms |
| **Error Rate** | < 0.1% | < 1% | > 1% |
| **Throughput** | Baseline ± 10% | Baseline ± 20% | > 20% degradation |

---

## k6 Performance Testing

k6 is a modern, developer-centric load testing tool written in Go with JavaScript scripting.

### Installation

```bash
# macOS
brew install k6

# Linux (Debian/Ubuntu)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# Docker
docker run --rm -i grafana/k6 run - <script.js

# Windows
choco install k6
```

### Project Structure

```text
performance-tests/
├── k6/
│   ├── scripts/
│   │   ├── load-test.js           # Main load test
│   │   ├── stress-test.js         # Stress test scenarios
│   │   ├── spike-test.js          # Spike test scenarios
│   │   └── soak-test.js           # Endurance test
│   ├── lib/
│   │   ├── helpers.js             # Shared utilities
│   │   ├── checks.js              # Reusable checks
│   │   └── thresholds.js          # Threshold configurations
│   ├── scenarios/
│   │   ├── user-journey.js        # User flow scenarios
│   │   └── api-endpoints.js       # API-specific scenarios
│   ├── data/
│   │   ├── users.json             # Test user data
│   │   └── payloads.json          # Request payloads
│   └── config/
│       ├── environments.js        # Environment configurations
│       └── thresholds.js          # Threshold definitions
├── results/
│   └── .gitkeep
└── package.json                   # Dependencies (for k6 extensions)
```

### Basic Load Test Script

```javascript
// k6/scripts/load-test.js
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency');
const requestCount = new Counter('requests');

// Test configuration
export const options = {
  // Load test stages
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down to 0
  ],

  // Performance thresholds
  thresholds: {
    http_req_duration: [
      'p(50)<200',   // 50% of requests < 200ms
      'p(95)<500',   // 95% of requests < 500ms
      'p(99)<1000',  // 99% of requests < 1000ms
    ],
    http_req_failed: ['rate<0.01'],  // Error rate < 1%
    errors: ['rate<0.1'],             // Custom error rate < 10%
    api_latency: ['avg<300'],         // Average latency < 300ms
  },

  // Additional options
  noConnectionReuse: false,
  userAgent: 'k6-load-test/1.0',
};

// Setup function - runs once before the test
export function setup() {
  const loginRes = http.post('https://api.example.com/auth/login', {
    username: 'testuser',
    password: 'testpass',
  });

  const token = JSON.parse(loginRes.body).token;
  return { token };
}

// Default function - runs for each virtual user
export default function (data) {
  const headers = {
    'Authorization': `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  // Group related requests
  group('User API', () => {
    // GET request
    const usersRes = http.get('https://api.example.com/users', { headers });

    check(usersRes, {
      'users status is 200': (r) => r.status === 200,
      'users response time < 500ms': (r) => r.timings.duration < 500,
      'users response has data': (r) => JSON.parse(r.body).length > 0,
    }) || errorRate.add(1);

    apiLatency.add(usersRes.timings.duration);
    requestCount.add(1);
  });

  group('Order API', () => {
    // POST request with payload
    const orderPayload = JSON.stringify({
      productId: 'prod-123',
      quantity: 2,
      userId: 'user-456',
    });

    const orderRes = http.post(
      'https://api.example.com/orders',
      orderPayload,
      { headers }
    );

    check(orderRes, {
      'order created': (r) => r.status === 201,
      'order has id': (r) => JSON.parse(r.body).orderId !== undefined,
    }) || errorRate.add(1);

    apiLatency.add(orderRes.timings.duration);
    requestCount.add(1);
  });

  // Think time between iterations
  sleep(Math.random() * 3 + 1); // 1-4 seconds
}

// Teardown function - runs once after the test
export function teardown(data) {
  http.post('https://api.example.com/auth/logout', null, {
    headers: { 'Authorization': `Bearer ${data.token}` },
  });
}
```

### Stress Test Script

```javascript
// k6/scripts/stress-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  // Stress test: gradually increase beyond normal capacity
  stages: [
    { duration: '2m', target: 100 },   // Normal load
    { duration: '5m', target: 100 },   // Stay at normal
    { duration: '2m', target: 200 },   // Increase to peak
    { duration: '5m', target: 200 },   // Stay at peak
    { duration: '2m', target: 300 },   // Push beyond capacity
    { duration: '5m', target: 300 },   // Stay at stress level
    { duration: '2m', target: 400 },   // Breaking point test
    { duration: '5m', target: 400 },   // Stay at breaking point
    { duration: '5m', target: 0 },     // Recovery ramp-down
  ],

  thresholds: {
    http_req_duration: ['p(99)<2000'],  // Relaxed for stress test
    http_req_failed: ['rate<0.05'],     // Allow 5% errors under stress
    errors: ['rate<0.1'],
  },
};

export default function () {
  const res = http.get('https://api.example.com/health');

  const checkResult = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time acceptable': (r) => r.timings.duration < 2000,
  });

  if (!checkResult) {
    errorRate.add(1);
  }

  sleep(1);
}
```

### Spike Test Script

```javascript
// k6/scripts/spike-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const spikeLatency = new Trend('spike_latency');

export const options = {
  // Spike test: sudden surge of traffic
  stages: [
    { duration: '1m', target: 50 },    // Warm up
    { duration: '30s', target: 500 },  // Spike to 500 users
    { duration: '2m', target: 500 },   // Stay at spike level
    { duration: '30s', target: 50 },   // Drop back to normal
    { duration: '2m', target: 50 },    // Recovery period
    { duration: '30s', target: 500 },  // Second spike
    { duration: '2m', target: 500 },   // Stay at spike
    { duration: '1m', target: 0 },     // Ramp down
  ],

  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.1'],
    errors: ['rate<0.15'],
  },
};

export default function () {
  const res = http.get('https://api.example.com/products');

  check(res, {
    'spike handled': (r) => r.status === 200,
    'response under 3s': (r) => r.timings.duration < 3000,
  }) || errorRate.add(1);

  spikeLatency.add(res.timings.duration);
  sleep(0.5);
}
```

### Soak Test Script

```javascript
// k6/scripts/soak-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';

const errorRate = new Rate('errors');
const memoryLeakIndicator = new Counter('memory_leak_errors');

export const options = {
  // Soak test: extended duration to find memory leaks
  stages: [
    { duration: '5m', target: 100 },    // Ramp up
    { duration: '4h', target: 100 },    // Sustained load for 4 hours
    { duration: '5m', target: 0 },      // Ramp down
  ],

  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.01'],
    memory_leak_errors: ['count<10'],  // Alert if errors spike
  },
};

let iterationCount = 0;

export default function () {
  iterationCount++;

  const res = http.get('https://api.example.com/users');

  const checkResult = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time stable': (r) => r.timings.duration < 500,
  });

  if (!checkResult) {
    errorRate.add(1);

    // Track degradation over time
    if (iterationCount > 10000 && !checkResult) {
      memoryLeakIndicator.add(1);
    }
  }

  // Log progress every 10000 iterations
  if (iterationCount % 10000 === 0) {
    console.log(`Completed ${iterationCount} iterations`);
  }

  sleep(2);
}
```

### Reusable Modules

```javascript
// k6/lib/helpers.js
import { check } from 'k6';
import http from 'k6/http';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

/**
 * Make authenticated API request with standard checks
 */
export function authenticatedRequest(url, method, body, token) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  let res;
  switch (method.toUpperCase()) {
    case 'GET':
      res = http.get(url, { headers });
      break;
    case 'POST':
      res = http.post(url, JSON.stringify(body), { headers });
      break;
    case 'PUT':
      res = http.put(url, JSON.stringify(body), { headers });
      break;
    case 'DELETE':
      res = http.del(url, null, { headers });
      break;
    default:
      throw new Error(`Unsupported method: ${method}`);
  }

  return res;
}

/**
 * Standard response checks
 */
export function standardChecks(response, expectedStatus = 200) {
  const checkResult = check(response, {
    [`status is ${expectedStatus}`]: (r) => r.status === expectedStatus,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'no server errors': (r) => r.status < 500,
  });

  if (!checkResult) {
    errorRate.add(1);
  }

  return checkResult;
}

/**
 * Generate random data for testing
 */
export function randomUser() {
  return {
    username: `user_${Math.random().toString(36).substring(7)}`,
    email: `test_${Date.now()}@example.com`,
    password: 'TestPassword123!',
  };
}

/**
 * Batch requests with controlled concurrency
 */
export function batchRequests(urls, headers, batchSize = 10) {
  const requests = urls.map((url) => ({
    method: 'GET',
    url: url,
    params: { headers },
  }));

  const responses = http.batch(requests);
  return responses;
}
```

```javascript
// k6/lib/thresholds.js
/**
 * Standard threshold configurations for different test types
 */

export const loadTestThresholds = {
  http_req_duration: ['p(50)<200', 'p(95)<500', 'p(99)<1000'],
  http_req_failed: ['rate<0.01'],
  http_req_waiting: ['p(95)<400'],
  http_reqs: ['rate>100'],
};

export const stressTestThresholds = {
  http_req_duration: ['p(95)<2000', 'p(99)<5000'],
  http_req_failed: ['rate<0.05'],
  http_req_waiting: ['p(95)<1500'],
};

export const spikeTestThresholds = {
  http_req_duration: ['p(95)<3000'],
  http_req_failed: ['rate<0.1'],
};

export const soakTestThresholds = {
  http_req_duration: ['p(50)<200', 'p(95)<500', 'p(99)<1000'],
  http_req_failed: ['rate<0.01'],
  iteration_duration: ['p(95)<5000'],
};

/**
 * Get thresholds by test type
 */
export function getThresholds(testType) {
  const thresholdMap = {
    load: loadTestThresholds,
    stress: stressTestThresholds,
    spike: spikeTestThresholds,
    soak: soakTestThresholds,
  };

  return thresholdMap[testType] || loadTestThresholds;
}
```

### Scenarios Configuration

```javascript
// k6/scripts/multi-scenario.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    // Scenario 1: Constant arrival rate
    constant_load: {
      executor: 'constant-arrival-rate',
      rate: 100,                        // 100 requests per second
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVUs: 50,
      maxVUs: 100,
      exec: 'constantLoadTest',
    },

    // Scenario 2: Ramping arrival rate
    ramping_load: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      stages: [
        { duration: '2m', target: 50 },
        { duration: '3m', target: 100 },
        { duration: '2m', target: 50 },
      ],
      preAllocatedVUs: 50,
      maxVUs: 200,
      exec: 'rampingLoadTest',
      startTime: '5m',                  // Start after constant_load
    },

    // Scenario 3: Per VU iterations
    user_journey: {
      executor: 'per-vu-iterations',
      vus: 10,
      iterations: 100,
      maxDuration: '10m',
      exec: 'userJourneyTest',
      startTime: '12m',
    },

    // Scenario 4: Shared iterations
    batch_processing: {
      executor: 'shared-iterations',
      vus: 20,
      iterations: 1000,
      maxDuration: '5m',
      exec: 'batchTest',
      startTime: '22m',
    },
  },

  thresholds: {
    'http_req_duration{scenario:constant_load}': ['p(95)<500'],
    'http_req_duration{scenario:ramping_load}': ['p(95)<800'],
    'http_req_duration{scenario:user_journey}': ['p(95)<1000'],
    'http_req_duration{scenario:batch_processing}': ['p(95)<300'],
  },
};

export function constantLoadTest() {
  const res = http.get('https://api.example.com/health');
  check(res, { 'constant load OK': (r) => r.status === 200 });
}

export function rampingLoadTest() {
  const res = http.get('https://api.example.com/products');
  check(res, { 'ramping load OK': (r) => r.status === 200 });
  sleep(0.5);
}

export function userJourneyTest() {
  // Login
  const loginRes = http.post('https://api.example.com/login', {
    username: 'testuser',
    password: 'testpass',
  });
  check(loginRes, { 'login successful': (r) => r.status === 200 });

  const token = JSON.parse(loginRes.body).token;
  const headers = { 'Authorization': `Bearer ${token}` };

  sleep(1);

  // Browse products
  const productsRes = http.get('https://api.example.com/products', { headers });
  check(productsRes, { 'products loaded': (r) => r.status === 200 });

  sleep(2);

  // Add to cart
  const cartRes = http.post(
    'https://api.example.com/cart',
    JSON.stringify({ productId: 'prod-123', quantity: 1 }),
    { headers: { ...headers, 'Content-Type': 'application/json' } }
  );
  check(cartRes, { 'added to cart': (r) => r.status === 201 });

  sleep(1);

  // Checkout
  const checkoutRes = http.post('https://api.example.com/checkout', null, { headers });
  check(checkoutRes, { 'checkout completed': (r) => r.status === 200 });
}

export function batchTest() {
  const urls = [
    'https://api.example.com/products/1',
    'https://api.example.com/products/2',
    'https://api.example.com/products/3',
  ];

  const responses = http.batch(
    urls.map((url) => ({ method: 'GET', url }))
  );

  responses.forEach((res, i) => {
    check(res, { [`batch ${i} OK`]: (r) => r.status === 200 });
  });
}
```

### k6 with Browser Testing

```javascript
// k6/scripts/browser-test.js
import { browser } from 'k6/browser';
import { check } from 'k6';

export const options = {
  scenarios: {
    browser: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
  thresholds: {
    browser_web_vital_lcp: ['p(75)<2500'],  // Largest Contentful Paint
    browser_web_vital_fid: ['p(75)<100'],   // First Input Delay
    browser_web_vital_cls: ['p(75)<0.1'],   // Cumulative Layout Shift
  },
};

export default async function () {
  const page = await browser.newPage();

  try {
    // Navigate to page
    await page.goto('https://example.com');

    // Wait for content to load
    await page.waitForSelector('h1');

    // Check page title
    const title = await page.title();
    check(title, {
      'title is correct': (t) => t.includes('Example'),
    });

    // Interact with form
    await page.locator('input[name="email"]').type('test@example.com');
    await page.locator('input[name="password"]').type('password123');
    await page.locator('button[type="submit"]').click();

    // Wait for navigation
    await page.waitForNavigation();

    // Verify login success
    const welcomeText = await page.locator('.welcome-message').textContent();
    check(welcomeText, {
      'user logged in': (text) => text.includes('Welcome'),
    });

    // Take screenshot for debugging
    await page.screenshot({ path: 'results/screenshot.png' });

  } finally {
    await page.close();
  }
}
```

### k6 Cloud Integration

```javascript
// k6/scripts/cloud-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  // Cloud execution settings
  cloud: {
    projectID: 123456,
    name: 'Production Load Test',
    note: 'Weekly performance regression test',
  },

  // Distributed load zones
  ext: {
    loadimpact: {
      projectID: 123456,
      name: 'Multi-Region Load Test',
      distribution: {
        'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 40 },
        'amazon:ie:dublin': { loadZone: 'amazon:ie:dublin', percent: 30 },
        'amazon:sg:singapore': { loadZone: 'amazon:sg:singapore', percent: 30 },
      },
    },
  },

  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 0 },
  ],

  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get('https://api.example.com/users');

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

### Running k6 Tests

```bash
# Basic run
k6 run k6/scripts/load-test.js

# Run with specific VUs and duration
k6 run --vus 50 --duration 5m k6/scripts/load-test.js

# Run with environment variables
k6 run -e BASE_URL=https://staging.example.com k6/scripts/load-test.js

# Run with output to JSON
k6 run --out json=results/output.json k6/scripts/load-test.js

# Run with output to InfluxDB
k6 run --out influxdb=http://localhost:8086/k6 k6/scripts/load-test.js

# Run with output to Prometheus
k6 run --out experimental-prometheus-rw k6/scripts/load-test.js

# Run with multiple outputs
k6 run \
  --out json=results/output.json \
  --out influxdb=http://localhost:8086/k6 \
  k6/scripts/load-test.js

# Run cloud test
k6 cloud k6/scripts/cloud-test.js

# Run with specific stages override
k6 run --stage 1m:10 --stage 3m:50 --stage 1m:0 k6/scripts/load-test.js

# Run with tags
k6 run --tag environment=staging --tag version=1.2.3 k6/scripts/load-test.js
```

---

## JMeter Performance Testing

Apache JMeter is a Java-based load testing tool with a rich GUI and extensive protocol support.

### JMeter Installation

```bash
# macOS
brew install jmeter

# Linux (download and extract)
wget https://dlcdn.apache.org//jmeter/binaries/apache-jmeter-5.6.3.tgz
tar -xzf apache-jmeter-5.6.3.tgz
export PATH=$PATH:$(pwd)/apache-jmeter-5.6.3/bin

# Docker
docker run -v $(pwd):/tests justb4/jmeter \
  -n -t /tests/test-plan.jmx -l /tests/results.jtl

# Verify installation
jmeter --version
```

### JMeter Project Structure

```text
performance-tests/
├── jmeter/
│   ├── test-plans/
│   │   ├── load-test.jmx          # Main load test plan
│   │   ├── stress-test.jmx        # Stress test plan
│   │   └── api-test.jmx           # API-specific tests
│   ├── fragments/
│   │   ├── auth-fragment.jmx      # Reusable auth fragment
│   │   └── common-assertions.jmx  # Shared assertions
│   ├── data/
│   │   ├── users.csv              # User credentials
│   │   └── test-data.csv          # Test data
│   ├── lib/
│   │   └── custom-samplers.jar    # Custom Java samplers
│   ├── scripts/
│   │   ├── run-test.sh            # Test runner script
│   │   └── generate-report.sh     # Report generator
│   └── reports/
│       └── .gitkeep
└── docker-compose.yml             # JMeter with InfluxDB/Grafana
```

### Basic Test Plan (XML)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!-- jmeter/test-plans/load-test.jmx -->
<jmeterTestPlan version="1.2" properties="5.0">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="API Load Test">
      <stringProp name="TestPlan.comments">Load test for REST API</stringProp>
      <boolProp name="TestPlan.functional_mode">false</boolProp>
      <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>
      <elementProp name="TestPlan.user_defined_variables" elementType="Arguments">
        <collectionProp name="Arguments.arguments">
          <elementProp name="BASE_URL" elementType="Argument">
            <stringProp name="Argument.name">BASE_URL</stringProp>
            <stringProp name="Argument.value">${__P(baseUrl,https://api.example.com)}</stringProp>
          </elementProp>
          <elementProp name="THINK_TIME" elementType="Argument">
            <stringProp name="Argument.name">THINK_TIME</stringProp>
            <stringProp name="Argument.value">${__P(thinkTime,1000)}</stringProp>
          </elementProp>
        </collectionProp>
      </elementProp>
    </TestPlan>
    <hashTree>
      <!-- Thread Group Configuration -->
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="Load Test Users">
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController">
          <boolProp name="LoopController.continue_forever">false</boolProp>
          <intProp name="LoopController.loops">-1</intProp>
        </elementProp>
        <stringProp name="ThreadGroup.num_threads">${__P(threads,100)}</stringProp>
        <stringProp name="ThreadGroup.ramp_time">${__P(rampUp,60)}</stringProp>
        <boolProp name="ThreadGroup.scheduler">true</boolProp>
        <stringProp name="ThreadGroup.duration">${__P(duration,300)}</stringProp>
        <stringProp name="ThreadGroup.delay">0</stringProp>
        <boolProp name="ThreadGroup.same_user_on_next_iteration">true</boolProp>
      </ThreadGroup>
      <hashTree>
        <!-- HTTP Request Defaults -->
        <ConfigTestElement guiclass="HttpDefaultsGui" testclass="ConfigTestElement" testname="HTTP Defaults">
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments">
            <collectionProp name="Arguments.arguments"/>
          </elementProp>
          <stringProp name="HTTPSampler.domain">${BASE_URL}</stringProp>
          <stringProp name="HTTPSampler.protocol">https</stringProp>
          <stringProp name="HTTPSampler.contentEncoding">UTF-8</stringProp>
          <stringProp name="HTTPSampler.connect_timeout">5000</stringProp>
          <stringProp name="HTTPSampler.response_timeout">30000</stringProp>
        </ConfigTestElement>
        <hashTree/>

        <!-- Header Manager -->
        <HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="HTTP Headers">
          <collectionProp name="HeaderManager.headers">
            <elementProp name="Content-Type" elementType="Header">
              <stringProp name="Header.name">Content-Type</stringProp>
              <stringProp name="Header.value">application/json</stringProp>
            </elementProp>
            <elementProp name="Accept" elementType="Header">
              <stringProp name="Header.name">Accept</stringProp>
              <stringProp name="Header.value">application/json</stringProp>
            </elementProp>
            <elementProp name="Authorization" elementType="Header">
              <stringProp name="Header.name">Authorization</stringProp>
              <stringProp name="Header.value">Bearer ${auth_token}</stringProp>
            </elementProp>
          </collectionProp>
        </HeaderManager>
        <hashTree/>

        <!-- Login Request -->
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="Login">
          <boolProp name="HTTPSampler.postBodyRaw">true</boolProp>
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments">
            <collectionProp name="Arguments.arguments">
              <elementProp name="" elementType="HTTPArgument">
                <boolProp name="HTTPArgument.always_encode">false</boolProp>
                <stringProp name="Argument.value">{"username":"${username}","password":"${password}"}</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
            </collectionProp>
          </elementProp>
          <stringProp name="HTTPSampler.path">/auth/login</stringProp>
          <stringProp name="HTTPSampler.method">POST</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
        </HTTPSamplerProxy>
        <hashTree>
          <!-- JSON Extractor for Token -->
          <JSONPostProcessor guiclass="JSONPostProcessorGui" testclass="JSONPostProcessor" testname="Extract Token">
            <stringProp name="JSONPostProcessor.referenceNames">auth_token</stringProp>
            <stringProp name="JSONPostProcessor.jsonPathExprs">$.token</stringProp>
            <stringProp name="JSONPostProcessor.match_numbers">1</stringProp>
            <stringProp name="JSONPostProcessor.defaultValues">NO_TOKEN</stringProp>
          </JSONPostProcessor>
          <hashTree/>

          <!-- Response Assertion -->
          <ResponseAssertion guiclass="AssertionGui" testclass="ResponseAssertion" testname="Login Success">
            <collectionProp name="Asserion.test_strings">
              <stringProp name="49586">200</stringProp>
            </collectionProp>
            <stringProp name="Assertion.test_field">Assertion.response_code</stringProp>
            <boolProp name="Assertion.assume_success">false</boolProp>
            <intProp name="Assertion.test_type">8</intProp>
          </ResponseAssertion>
          <hashTree/>

          <!-- Duration Assertion -->
          <DurationAssertion guiclass="DurationAssertionGui" testclass="DurationAssertion" testname="Response Time Check">
            <stringProp name="DurationAssertion.duration">500</stringProp>
          </DurationAssertion>
          <hashTree/>
        </hashTree>

        <!-- Get Users Request -->
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="Get Users">
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments">
            <collectionProp name="Arguments.arguments"/>
          </elementProp>
          <stringProp name="HTTPSampler.path">/users</stringProp>
          <stringProp name="HTTPSampler.method">GET</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
        </HTTPSamplerProxy>
        <hashTree>
          <ResponseAssertion guiclass="AssertionGui" testclass="ResponseAssertion" testname="Users Response OK">
            <collectionProp name="Asserion.test_strings">
              <stringProp name="49586">200</stringProp>
            </collectionProp>
            <stringProp name="Assertion.test_field">Assertion.response_code</stringProp>
            <intProp name="Assertion.test_type">8</intProp>
          </ResponseAssertion>
          <hashTree/>

          <JSONPathAssertion guiclass="JSONPathAssertionGui" testclass="JSONPathAssertion" testname="Has Users">
            <stringProp name="JSON_PATH">$.length()</stringProp>
            <stringProp name="EXPECTED_VALUE">0</stringProp>
            <boolProp name="JSONVALIDATION">true</boolProp>
            <boolProp name="EXPECT_NULL">false</boolProp>
            <boolProp name="INVERT">true</boolProp>
          </JSONPathAssertion>
          <hashTree/>
        </hashTree>

        <!-- Think Time -->
        <ConstantTimer guiclass="ConstantTimerGui" testclass="ConstantTimer" testname="Think Time">
          <stringProp name="ConstantTimer.delay">${THINK_TIME}</stringProp>
        </ConstantTimer>
        <hashTree/>

        <!-- View Results Tree (for debugging, disable in actual tests) -->
        <ResultCollector guiclass="ViewResultsFullVisualizer" testclass="ResultCollector" testname="View Results Tree" enabled="false">
          <boolProp name="ResultCollector.error_logging">false</boolProp>
          <objProp>
            <name>saveConfig</name>
            <value class="SampleSaveConfiguration">
              <time>true</time>
              <latency>true</latency>
              <timestamp>true</timestamp>
              <success>true</success>
              <label>true</label>
              <code>true</code>
              <message>true</message>
              <threadName>true</threadName>
              <dataType>true</dataType>
              <encoding>false</encoding>
              <assertions>true</assertions>
              <subresults>true</subresults>
              <responseData>false</responseData>
              <samplerData>false</samplerData>
              <xml>false</xml>
              <fieldNames>true</fieldNames>
              <responseHeaders>false</responseHeaders>
              <requestHeaders>false</requestHeaders>
              <responseDataOnError>false</responseDataOnError>
              <saveAssertionResultsFailureMessage>true</saveAssertionResultsFailureMessage>
              <assertionsResultsToSave>0</assertionsResultsToSave>
              <bytes>true</bytes>
              <sentBytes>true</sentBytes>
              <url>true</url>
              <threadCounts>true</threadCounts>
              <idleTime>true</idleTime>
              <connectTime>true</connectTime>
            </value>
          </objProp>
          <stringProp name="filename"></stringProp>
        </ResultCollector>
        <hashTree/>

        <!-- Summary Report -->
        <ResultCollector guiclass="SummaryReport" testclass="ResultCollector" testname="Summary Report">
          <boolProp name="ResultCollector.error_logging">false</boolProp>
          <objProp>
            <name>saveConfig</name>
            <value class="SampleSaveConfiguration">
              <time>true</time>
              <latency>true</latency>
              <timestamp>true</timestamp>
              <success>true</success>
              <label>true</label>
              <code>true</code>
              <message>true</message>
              <threadName>true</threadName>
              <dataType>true</dataType>
              <encoding>false</encoding>
              <assertions>true</assertions>
              <subresults>true</subresults>
              <responseData>false</responseData>
              <samplerData>false</samplerData>
              <xml>false</xml>
              <fieldNames>true</fieldNames>
              <responseHeaders>false</responseHeaders>
              <requestHeaders>false</requestHeaders>
              <responseDataOnError>false</responseDataOnError>
              <saveAssertionResultsFailureMessage>true</saveAssertionResultsFailureMessage>
              <assertionsResultsToSave>0</assertionsResultsToSave>
              <bytes>true</bytes>
              <sentBytes>true</sentBytes>
              <url>true</url>
              <threadCounts>true</threadCounts>
              <idleTime>true</idleTime>
              <connectTime>true</connectTime>
            </value>
          </objProp>
          <stringProp name="filename">reports/summary.csv</stringProp>
        </ResultCollector>
        <hashTree/>
      </hashTree>
    </hashTree>
  </hashTree>
</jmeterTestPlan>
```

### Ultimate Thread Group (Stepping)

```xml
<!-- jmeter/test-plans/stepping-thread-group.jmx -->
<kg.apc.jmeter.threads.UltimateThreadGroup guiclass="kg.apc.jmeter.threads.UltimateThreadGroupGui"
    testclass="kg.apc.jmeter.threads.UltimateThreadGroup" testname="Stepping Load">
  <collectionProp name="ultimatethreadgroupdata">
    <!-- Start 10 threads, ramp over 30s, hold 60s, shutdown 10s -->
    <collectionProp name="1">
      <stringProp name="1">10</stringProp>
      <stringProp name="2">0</stringProp>
      <stringProp name="3">30</stringProp>
      <stringProp name="4">60</stringProp>
      <stringProp name="5">10</stringProp>
    </collectionProp>
    <!-- Start additional 20 threads after 30s -->
    <collectionProp name="2">
      <stringProp name="1">20</stringProp>
      <stringProp name="2">30</stringProp>
      <stringProp name="3">30</stringProp>
      <stringProp name="4">60</stringProp>
      <stringProp name="5">10</stringProp>
    </collectionProp>
    <!-- Start additional 30 threads after 60s -->
    <collectionProp name="3">
      <stringProp name="1">30</stringProp>
      <stringProp name="2">60</stringProp>
      <stringProp name="3">30</stringProp>
      <stringProp name="4">60</stringProp>
      <stringProp name="5">10</stringProp>
    </collectionProp>
  </collectionProp>
</kg.apc.jmeter.threads.UltimateThreadGroup>
```

### CSV Data Set Configuration

```xml
<!-- CSV Data Set for parameterized testing -->
<CSVDataSet guiclass="TestBeanGUI" testclass="CSVDataSet" testname="User Data">
  <stringProp name="filename">data/users.csv</stringProp>
  <stringProp name="fileEncoding">UTF-8</stringProp>
  <stringProp name="variableNames">username,password,email</stringProp>
  <boolProp name="ignoreFirstLine">true</boolProp>
  <stringProp name="delimiter">,</stringProp>
  <boolProp name="quotedData">true</boolProp>
  <boolProp name="recycle">true</boolProp>
  <boolProp name="stopThread">false</boolProp>
  <stringProp name="shareMode">shareMode.all</stringProp>
</CSVDataSet>
```

```csv
username,password,email
user1,Pass123!,user1@example.com
user2,Pass456!,user2@example.com
user3,Pass789!,user3@example.com
```

### JSR223 Groovy Scripts

```groovy
// Pre-processor: Generate dynamic data
// jmeter/scripts/generate-data.groovy
import groovy.json.JsonOutput
import java.util.UUID

// Generate unique order ID
def orderId = UUID.randomUUID().toString()
vars.put("orderId", orderId)

// Generate random product quantity
def quantity = new Random().nextInt(10) + 1
vars.put("quantity", quantity.toString())

// Generate timestamp
def timestamp = System.currentTimeMillis()
vars.put("timestamp", timestamp.toString())

// Build request payload
def payload = [
    orderId: orderId,
    productId: "prod-${new Random().nextInt(100)}",
    quantity: quantity,
    timestamp: timestamp
]
vars.put("orderPayload", JsonOutput.toJson(payload))

log.info("Generated order: ${orderId}")
```

```groovy
// Post-processor: Parse and validate response
// jmeter/scripts/validate-response.groovy
import groovy.json.JsonSlurper

def response = prev.getResponseDataAsString()
def jsonSlurper = new JsonSlurper()

try {
    def json = jsonSlurper.parseText(response)

    // Extract values for subsequent requests
    if (json.id) {
        vars.put("createdId", json.id.toString())
    }

    // Validate response structure
    if (!json.containsKey("status")) {
        prev.setSuccessful(false)
        prev.setResponseMessage("Missing 'status' field in response")
    }

    // Log response time categories
    def responseTime = prev.getTime()
    if (responseTime < 200) {
        log.info("FAST: ${responseTime}ms")
    } else if (responseTime < 500) {
        log.info("NORMAL: ${responseTime}ms")
    } else {
        log.warn("SLOW: ${responseTime}ms")
    }

} catch (Exception e) {
    prev.setSuccessful(false)
    prev.setResponseMessage("JSON parsing failed: ${e.message}")
    log.error("Parse error: ${e.message}")
}
```

```groovy
// Assertion: Custom threshold validation
// jmeter/scripts/threshold-assertion.groovy
def responseTime = prev.getTime()
def statusCode = prev.getResponseCode()

// Define thresholds
def p95Threshold = 500
def p99Threshold = 1000
def maxErrorRate = 0.01

// Validate response time
if (responseTime > p99Threshold) {
    AssertionResult.setFailure(true)
    AssertionResult.setFailureMessage(
        "Response time ${responseTime}ms exceeds p99 threshold ${p99Threshold}ms"
    )
}

// Validate status code
def validCodes = ["200", "201", "204"]
if (!validCodes.contains(statusCode)) {
    AssertionResult.setFailure(true)
    AssertionResult.setFailureMessage(
        "Unexpected status code: ${statusCode}"
    )
}
```

### Running JMeter Tests

```bash
# Run test in non-GUI mode
jmeter -n -t jmeter/test-plans/load-test.jmx -l results/results.jtl

# Run with properties
jmeter -n -t jmeter/test-plans/load-test.jmx \
  -Jthreads=200 \
  -JrampUp=120 \
  -Jduration=600 \
  -JbaseUrl=https://staging.example.com \
  -l results/results.jtl

# Run with external properties file
jmeter -n -t jmeter/test-plans/load-test.jmx \
  -q jmeter/config/staging.properties \
  -l results/results.jtl

# Generate HTML report
jmeter -g results/results.jtl -o reports/html-report/

# Run and generate report in one command
jmeter -n -t jmeter/test-plans/load-test.jmx \
  -l results/results.jtl \
  -e -o reports/html-report/

# Run distributed test
jmeter -n -t jmeter/test-plans/load-test.jmx \
  -R server1.example.com,server2.example.com \
  -l results/results.jtl

# Run with heap settings
JVM_ARGS="-Xms2g -Xmx4g" jmeter -n -t jmeter/test-plans/load-test.jmx \
  -l results/results.jtl
```

### JMeter Properties File

```properties
# jmeter/config/staging.properties

# Test Configuration
threads=100
rampUp=60
duration=300
thinkTime=1000

# Target Environment
baseUrl=https://staging-api.example.com
protocol=https

# Timeouts
connect.timeout=5000
response.timeout=30000

# Reporting
jmeter.save.saveservice.output_format=csv
jmeter.save.saveservice.response_data=false
jmeter.save.saveservice.samplerData=false
jmeter.save.saveservice.assertion_results_failure_message=true

# Performance Tuning
httpclient4.retrycount=0
httpsampler.ignore_failed_embedded_resources=true
```

### JMeter Docker Compose

```yaml
# docker-compose.yml
services:
  jmeter:
    image: justb4/jmeter:latest
    volumes:
      - ./jmeter:/tests
      - ./results:/results
    command: >
      -n
      -t /tests/test-plans/load-test.jmx
      -l /results/results.jtl
      -e -o /results/report
      -Jthreads=100
      -JrampUp=60
      -Jduration=300

  influxdb:
    image: influxdb:2.7
    ports:
      - "8086:8086"
    environment:
      - DOCKER_INFLUXDB_INIT_MODE=setup
      - DOCKER_INFLUXDB_INIT_USERNAME=admin
      - DOCKER_INFLUXDB_INIT_PASSWORD=adminpassword
      - DOCKER_INFLUXDB_INIT_ORG=performance
      - DOCKER_INFLUXDB_INIT_BUCKET=jmeter
    volumes:
      - influxdb-data:/var/lib/influxdb2

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources
    depends_on:
      - influxdb

volumes:
  influxdb-data:
  grafana-data:
```

---

## Gatling Performance Testing

Gatling is a Scala-based load testing tool designed for ease of use and high performance.

### Gatling Installation

```bash
# macOS
brew install gatling

# Linux/Windows (download and extract)
wget https://repo1.maven.org/maven2/io/gatling/highcharts/gatling-charts-highcharts-bundle/3.10.5/gatling-charts-highcharts-bundle-3.10.5-bundle.zip
unzip gatling-charts-highcharts-bundle-3.10.5-bundle.zip

# Docker
docker run -it --rm \
  -v $(pwd)/simulations:/opt/gatling/user-files/simulations \
  -v $(pwd)/results:/opt/gatling/results \
  denvazh/gatling

# Maven project (recommended)
mvn archetype:generate \
  -DarchetypeGroupId=io.gatling.highcharts \
  -DarchetypeArtifactId=gatling-highcharts-maven-archetype
```

### Project Structure (Maven)

```text
performance-tests/
├── gatling/
│   ├── src/
│   │   ├── test/
│   │   │   ├── scala/
│   │   │   │   ├── simulations/
│   │   │   │   │   ├── LoadSimulation.scala
│   │   │   │   │   ├── StressSimulation.scala
│   │   │   │   │   └── SpikeSimulation.scala
│   │   │   │   ├── scenarios/
│   │   │   │   │   ├── UserScenarios.scala
│   │   │   │   │   └── ApiScenarios.scala
│   │   │   │   ├── requests/
│   │   │   │   │   ├── AuthRequests.scala
│   │   │   │   │   └── UserRequests.scala
│   │   │   │   └── config/
│   │   │   │       └── TestConfig.scala
│   │   │   └── resources/
│   │   │       ├── gatling.conf
│   │   │       ├── logback.xml
│   │   │       └── data/
│   │   │           └── users.csv
│   │   └── main/scala/
│   │       └── .gitkeep
│   └── pom.xml
└── results/
    └── .gitkeep
```

### Maven Configuration

```xml
<!-- gatling/pom.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>performance-tests</artifactId>
    <version>1.0.0</version>

    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <gatling.version>3.10.5</gatling.version>
        <scala.version>2.13.12</scala.version>
        <gatling-maven-plugin.version>4.8.2</gatling-maven-plugin.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>io.gatling.highcharts</groupId>
            <artifactId>gatling-charts-highcharts</artifactId>
            <version>${gatling.version}</version>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>io.gatling</groupId>
            <artifactId>gatling-core</artifactId>
            <version>${gatling.version}</version>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>io.gatling</groupId>
                <artifactId>gatling-maven-plugin</artifactId>
                <version>${gatling-maven-plugin.version}</version>
                <configuration>
                    <simulationClass>simulations.LoadSimulation</simulationClass>
                    <runMultipleSimulations>false</runMultipleSimulations>
                    <includes>
                        <include>simulations.*</include>
                    </includes>
                </configuration>
            </plugin>
            <plugin>
                <groupId>net.alchim31.maven</groupId>
                <artifactId>scala-maven-plugin</artifactId>
                <version>4.8.1</version>
                <executions>
                    <execution>
                        <goals>
                            <goal>testCompile</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

### Gatling Configuration

```hocon
# gatling/src/test/resources/gatling.conf
gatling {
  core {
    outputDirectoryBaseName = "results"
    runDescription = "Performance Test Run"
    encoding = "utf-8"
    simulationClass = "simulations.LoadSimulation"

    extract {
      regex {
        cacheMaxCapacity = 200
      }
      xpath {
        cacheMaxCapacity = 200
      }
      jsonPath {
        cacheMaxCapacity = 200
      }
      css {
        cacheMaxCapacity = 200
      }
    }
  }

  http {
    fetchedCssCacheMaxCapacity = 200
    fetchedHtmlCacheMaxCapacity = 200
    perUserCacheMaxCapacity = 200
    warmUpUrl = "https://api.example.com/health"
    enableGA = false

    ssl {
      trustStore {
        type = ""
        file = ""
        password = ""
        algorithm = ""
      }
    }
  }

  data {
    writers = [console, file]
    console {
      light = false
      writePeriod = 5
    }
    file {
      bufferSize = 8192
    }
    leak {
      noActivityTimeout = 30
    }
  }

  charting {
    indicators {
      lowerBound = 200
      higherBound = 500
      percentile1 = 50
      percentile2 = 75
      percentile3 = 95
      percentile4 = 99
    }
  }
}
```

### Basic Load Simulation

```scala
// gatling/src/test/scala/simulations/LoadSimulation.scala
package simulations

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._

class LoadSimulation extends Simulation {

  // HTTP Protocol Configuration
  val httpProtocol = http
    .baseUrl("https://api.example.com")
    .acceptHeader("application/json")
    .acceptEncodingHeader("gzip, deflate")
    .acceptLanguageHeader("en-US,en;q=0.9")
    .userAgentHeader("Gatling/LoadTest")
    .shareConnections

  // Feeder for test data
  val userFeeder = csv("data/users.csv").circular

  // Authentication scenario
  val authenticate = exec(
    http("Login")
      .post("/auth/login")
      .header("Content-Type", "application/json")
      .body(StringBody("""{"username":"${username}","password":"${password}"}"""))
      .check(status.is(200))
      .check(jsonPath("$.token").saveAs("authToken"))
  )

  // User journey scenario
  val userJourney = scenario("User Journey")
    .feed(userFeeder)
    .exec(authenticate)
    .pause(1.second, 3.seconds)
    .exec(
      http("Get Users")
        .get("/users")
        .header("Authorization", "Bearer ${authToken}")
        .check(status.is(200))
        .check(responseTimeInMillis.lt(500))
        .check(jsonPath("$[*]").count.gt(0))
    )
    .pause(500.milliseconds, 1.second)
    .exec(
      http("Get User Profile")
        .get("/users/${userId}")
        .header("Authorization", "Bearer ${authToken}")
        .check(status.is(200))
        .check(jsonPath("$.email").exists)
    )
    .pause(1.second, 2.seconds)
    .exec(
      http("Create Order")
        .post("/orders")
        .header("Authorization", "Bearer ${authToken}")
        .header("Content-Type", "application/json")
        .body(StringBody(
          """{
            |  "productId": "prod-123",
            |  "quantity": 2,
            |  "userId": "${userId}"
            |}""".stripMargin
        ))
        .check(status.is(201))
        .check(jsonPath("$.orderId").saveAs("orderId"))
    )
    .pause(500.milliseconds)
    .exec(
      http("Get Order Status")
        .get("/orders/${orderId}")
        .header("Authorization", "Bearer ${authToken}")
        .check(status.is(200))
        .check(jsonPath("$.status").is("pending"))
    )

  // Load test setup
  setUp(
    userJourney.inject(
      // Ramp up phase
      rampUsers(50).during(2.minutes),
      // Steady state
      constantUsersPerSec(10).during(5.minutes),
      // Peak load
      rampUsersPerSec(10).to(20).during(2.minutes),
      constantUsersPerSec(20).during(5.minutes),
      // Ramp down
      rampUsersPerSec(20).to(0).during(2.minutes)
    )
  ).protocols(httpProtocol)
   .assertions(
     global.responseTime.max.lt(2000),
     global.responseTime.percentile(95).lt(500),
     global.responseTime.percentile(99).lt(1000),
     global.successfulRequests.percent.gt(99),
     global.requestsPerSec.gt(100)
   )
}
```

### Stress Test Simulation

```scala
// gatling/src/test/scala/simulations/StressSimulation.scala
package simulations

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._

class StressSimulation extends Simulation {

  val httpProtocol = http
    .baseUrl("https://api.example.com")
    .acceptHeader("application/json")
    .shareConnections

  val healthCheck = scenario("Stress Test")
    .exec(
      http("Health Check")
        .get("/health")
        .check(status.in(200, 503))  // Accept 503 under stress
    )
    .pause(100.milliseconds, 500.milliseconds)

  setUp(
    healthCheck.inject(
      // Normal load
      constantUsersPerSec(50).during(2.minutes),
      // Stress level 1
      rampUsersPerSec(50).to(100).during(1.minute),
      constantUsersPerSec(100).during(3.minutes),
      // Stress level 2
      rampUsersPerSec(100).to(200).during(1.minute),
      constantUsersPerSec(200).during(3.minutes),
      // Breaking point test
      rampUsersPerSec(200).to(500).during(2.minutes),
      constantUsersPerSec(500).during(3.minutes),
      // Recovery
      rampUsersPerSec(500).to(0).during(2.minutes)
    )
  ).protocols(httpProtocol)
   .assertions(
     // Relaxed assertions for stress test
     global.responseTime.percentile(95).lt(2000),
     global.successfulRequests.percent.gt(95)
   )
}
```

### Spike Test Simulation

```scala
// gatling/src/test/scala/simulations/SpikeSimulation.scala
package simulations

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._

class SpikeSimulation extends Simulation {

  val httpProtocol = http
    .baseUrl("https://api.example.com")
    .acceptHeader("application/json")

  val apiRequest = scenario("Spike Test")
    .exec(
      http("API Request")
        .get("/products")
        .check(status.in(200, 429, 503))
    )
    .pause(200.milliseconds)

  setUp(
    apiRequest.inject(
      // Warm up
      constantUsersPerSec(10).during(1.minute),
      // First spike
      atOnceUsers(500),
      constantUsersPerSec(50).during(2.minutes),
      // Second spike (larger)
      atOnceUsers(1000),
      constantUsersPerSec(100).during(2.minutes),
      // Recovery period
      nothingFor(30.seconds),
      // Normal traffic resumption
      constantUsersPerSec(10).during(2.minutes)
    )
  ).protocols(httpProtocol)
   .assertions(
     global.responseTime.percentile(95).lt(3000),
     global.successfulRequests.percent.gt(90)
   )
}
```

### Reusable Request Objects

```scala
// gatling/src/test/scala/requests/AuthRequests.scala
package requests

import io.gatling.core.Predef._
import io.gatling.http.Predef._

object AuthRequests {

  val login = http("Login")
    .post("/auth/login")
    .header("Content-Type", "application/json")
    .body(StringBody(
      """{
        |  "username": "${username}",
        |  "password": "${password}"
        |}""".stripMargin
    ))
    .check(status.is(200))
    .check(jsonPath("$.token").saveAs("authToken"))
    .check(jsonPath("$.userId").saveAs("userId"))
    .check(responseTimeInMillis.saveAs("loginTime"))

  val refreshToken = http("Refresh Token")
    .post("/auth/refresh")
    .header("Authorization", "Bearer ${authToken}")
    .check(status.is(200))
    .check(jsonPath("$.token").saveAs("authToken"))

  val logout = http("Logout")
    .post("/auth/logout")
    .header("Authorization", "Bearer ${authToken}")
    .check(status.is(204))
}
```

```scala
// gatling/src/test/scala/requests/UserRequests.scala
package requests

import io.gatling.core.Predef._
import io.gatling.http.Predef._

object UserRequests {

  private def authHeader = Map("Authorization" -> "Bearer ${authToken}")

  val getUsers = http("Get Users")
    .get("/users")
    .headers(authHeader)
    .check(status.is(200))
    .check(jsonPath("$[*].id").findAll.saveAs("userIds"))

  val getUserProfile = http("Get User Profile")
    .get("/users/${targetUserId}")
    .headers(authHeader)
    .check(status.is(200))
    .check(jsonPath("$.email").exists)

  def createUser(name: String, email: String) = http("Create User")
    .post("/users")
    .headers(authHeader + ("Content-Type" -> "application/json"))
    .body(StringBody(
      s"""{
         |  "name": "$name",
         |  "email": "$email"
         |}""".stripMargin
    ))
    .check(status.is(201))
    .check(jsonPath("$.id").saveAs("createdUserId"))

  val updateUser = http("Update User")
    .put("/users/${userId}")
    .headers(authHeader + ("Content-Type" -> "application/json"))
    .body(StringBody("""{"name": "Updated Name"}"""))
    .check(status.is(200))

  val deleteUser = http("Delete User")
    .delete("/users/${userId}")
    .headers(authHeader)
    .check(status.is(204))
}
```

### Reusable Scenarios

```scala
// gatling/src/test/scala/scenarios/UserScenarios.scala
package scenarios

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import requests.{AuthRequests, UserRequests}
import scala.concurrent.duration._

object UserScenarios {

  val simpleUserFlow = scenario("Simple User Flow")
    .exec(AuthRequests.login)
    .pause(1.second)
    .exec(UserRequests.getUsers)
    .pause(500.milliseconds)
    .exec(AuthRequests.logout)

  val fullUserJourney = scenario("Full User Journey")
    .exec(AuthRequests.login)
    .pause(1.second, 2.seconds)
    .repeat(3) {
      exec(UserRequests.getUsers)
        .pause(500.milliseconds)
        .exec(session => {
          val userIds = session("userIds").as[Seq[String]]
          if (userIds.nonEmpty) {
            val randomUserId = userIds(scala.util.Random.nextInt(userIds.length))
            session.set("targetUserId", randomUserId)
          } else {
            session
          }
        })
        .doIf(session => session.contains("targetUserId")) {
          exec(UserRequests.getUserProfile)
        }
        .pause(1.second, 3.seconds)
    }
    .exec(AuthRequests.logout)

  val adminUserFlow = scenario("Admin User Flow")
    .exec(AuthRequests.login)
    .pause(1.second)
    .exec(UserRequests.getUsers)
    .pause(500.milliseconds)
    .exec(
      UserRequests.createUser(
        name = "Test User ${__Random(1000,9999)}",
        email = "test${__Random(1000,9999)}@example.com"
      )
    )
    .pause(500.milliseconds)
    .exec(UserRequests.updateUser)
    .pause(500.milliseconds)
    .exec(UserRequests.deleteUser)
    .exec(AuthRequests.logout)

  val longRunningSession = scenario("Long Running Session")
    .exec(AuthRequests.login)
    .forever {
      exec(UserRequests.getUsers)
        .pause(5.seconds, 10.seconds)
        .doIf(session => {
          val loginTime = session("loginTime").as[Int]
          loginTime > 0 && scala.util.Random.nextInt(10) == 0
        }) {
          exec(AuthRequests.refreshToken)
        }
    }
}
```

### Running Gatling Tests

```bash
# Run with Maven
mvn gatling:test

# Run specific simulation
mvn gatling:test -Dgatling.simulationClass=simulations.LoadSimulation

# Run with system properties
mvn gatling:test \
  -DbaseUrl=https://staging.example.com \
  -Dusers=100 \
  -Dduration=300

# Run with Gatling standalone
./gatling.sh -s simulations.LoadSimulation

# Run with Docker
docker run -it --rm \
  -v $(pwd)/src/test/scala:/opt/gatling/user-files/simulations \
  -v $(pwd)/src/test/resources:/opt/gatling/user-files/resources \
  -v $(pwd)/results:/opt/gatling/results \
  denvazh/gatling \
  -s simulations.LoadSimulation

# Generate report only
./gatling.sh -ro results/simulation-20240115
```

### Gatling with CI Environment Variables

```scala
// gatling/src/test/scala/config/TestConfig.scala
package config

object TestConfig {
  val baseUrl: String = sys.env.getOrElse("BASE_URL", "https://api.example.com")
  val users: Int = sys.env.getOrElse("USERS", "100").toInt
  val duration: Int = sys.env.getOrElse("DURATION", "300").toInt
  val rampUp: Int = sys.env.getOrElse("RAMP_UP", "60").toInt

  object Thresholds {
    val p95ResponseTime: Int = sys.env.getOrElse("P95_THRESHOLD", "500").toInt
    val p99ResponseTime: Int = sys.env.getOrElse("P99_THRESHOLD", "1000").toInt
    val errorRate: Double = sys.env.getOrElse("ERROR_RATE", "0.01").toDouble
  }
}
```

```scala
// Using configuration in simulation
package simulations

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import config.TestConfig
import scala.concurrent.duration._

class ConfigurableSimulation extends Simulation {

  val httpProtocol = http
    .baseUrl(TestConfig.baseUrl)
    .acceptHeader("application/json")

  val scenario1 = scenario("Configurable Load Test")
    .exec(http("API Call").get("/api/endpoint"))
    .pause(1.second)

  setUp(
    scenario1.inject(
      rampUsers(TestConfig.users).during(TestConfig.rampUp.seconds),
      constantUsersPerSec(TestConfig.users / 10).during(TestConfig.duration.seconds)
    )
  ).protocols(httpProtocol)
   .assertions(
     global.responseTime.percentile(95).lt(TestConfig.Thresholds.p95ResponseTime),
     global.responseTime.percentile(99).lt(TestConfig.Thresholds.p99ResponseTime),
     global.failedRequests.percent.lt(TestConfig.Thresholds.errorRate * 100)
   )
}
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/performance-tests.yml
name: Performance Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production
      test_type:
        description: 'Test type'
        required: true
        default: 'load'
        type: choice
        options:
          - load
          - stress
          - spike
          - soak
      duration:
        description: 'Test duration (minutes)'
        required: false
        default: '10'

env:
  K6_CLOUD_PROJECT_ID: ${{ secrets.K6_CLOUD_PROJECT_ID }}
  K6_CLOUD_TOKEN: ${{ secrets.K6_CLOUD_TOKEN }}

jobs:
  k6-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
            --keyserver hkp://keyserver.ubuntu.com:80 \
            --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
            | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Run k6 Load Test
        run: |
          k6 run \
            -e BASE_URL=${{ vars.BASE_URL }} \
            -e TEST_TYPE=${{ inputs.test_type || 'load' }} \
            --out json=results/k6-output.json \
            k6/scripts/${{ inputs.test_type || 'load' }}-test.js
        continue-on-error: true

      - name: Upload k6 Results
        uses: actions/upload-artifact@v4
        with:
          name: k6-results
          path: results/
          retention-days: 30

      - name: Check Thresholds
        run: |
          if grep -q '"thresholds":{"failures":\[' results/k6-output.json; then
            echo "Performance thresholds exceeded!"
            exit 1
          fi

  jmeter-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Run JMeter Test
        run: |
          wget -q https://dlcdn.apache.org//jmeter/binaries/apache-jmeter-5.6.3.tgz
          tar -xzf apache-jmeter-5.6.3.tgz

          ./apache-jmeter-5.6.3/bin/jmeter -n \
            -t jmeter/test-plans/load-test.jmx \
            -JbaseUrl=${{ vars.BASE_URL }} \
            -Jthreads=100 \
            -Jduration=${{ inputs.duration || '10' }}m \
            -l results/jmeter-results.jtl \
            -e -o results/jmeter-report

      - name: Upload JMeter Results
        uses: actions/upload-artifact@v4
        with:
          name: jmeter-results
          path: results/
          retention-days: 30

  gatling-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: maven

      - name: Run Gatling Test
        working-directory: gatling
        run: |
          mvn gatling:test \
            -Dgatling.simulationClass=simulations.LoadSimulation \
            -DbaseUrl=${{ vars.BASE_URL }}

      - name: Upload Gatling Results
        uses: actions/upload-artifact@v4
        with:
          name: gatling-results
          path: gatling/target/gatling/
          retention-days: 30

  performance-report:
    needs: [k6-tests, jmeter-tests, gatling-tests]
    runs-on: ubuntu-latest
    if: always()
    steps:
      - name: Download all artifacts
        uses: actions/download-artifact@v4

      - name: Generate Summary Report
        run: |
          echo "# Performance Test Results" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "## Test Configuration" >> $GITHUB_STEP_SUMMARY
          echo "- Environment: ${{ inputs.environment || 'staging' }}" >> $GITHUB_STEP_SUMMARY
          echo "- Test Type: ${{ inputs.test_type || 'load' }}" >> $GITHUB_STEP_SUMMARY
          echo "- Duration: ${{ inputs.duration || '10' }} minutes" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "## Results" >> $GITHUB_STEP_SUMMARY
          echo "See artifacts for detailed reports." >> $GITHUB_STEP_SUMMARY

      - name: Create Issue on Failure
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: 'Performance Test Failed',
              body: `Performance tests failed on ${new Date().toISOString()}\n\nRun: ${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`,
              labels: ['performance', 'automated']
            });
```

### GitLab CI Pipeline

```yaml
# .gitlab-ci.yml
stages:
  - build
  - test
  - performance
  - report

variables:
  BASE_URL: ${CI_ENVIRONMENT_URL}
  K6_VERSION: "0.49.0"

.performance-base:
  stage: performance
  tags:
    - performance
  rules:
    - if: $CI_PIPELINE_SOURCE == "schedule"
    - if: $CI_PIPELINE_SOURCE == "web"
    - if: $CI_COMMIT_BRANCH == "main"
      changes:
        - "src/**/*"
        - "api/**/*"

k6-load-test:
  extends: .performance-base
  image: grafana/k6:${K6_VERSION}
  script:
    - k6 run
        -e BASE_URL=${BASE_URL}
        --out json=/results/k6-output.json
        k6/scripts/load-test.js
  artifacts:
    when: always
    paths:
      - results/
    reports:
      performance: results/k6-output.json
    expire_in: 30 days

jmeter-load-test:
  extends: .performance-base
  image: justb4/jmeter:latest
  script:
    - jmeter -n
        -t jmeter/test-plans/load-test.jmx
        -JbaseUrl=${BASE_URL}
        -Jthreads=100
        -Jduration=300
        -l results/jmeter-results.jtl
        -e -o results/jmeter-report
  artifacts:
    when: always
    paths:
      - results/
    expire_in: 30 days

gatling-load-test:
  extends: .performance-base
  image: denvazh/gatling:latest
  script:
    - cd gatling
    - mvn gatling:test
        -Dgatling.simulationClass=simulations.LoadSimulation
        -DbaseUrl=${BASE_URL}
  artifacts:
    when: always
    paths:
      - gatling/target/gatling/
    expire_in: 30 days

performance-report:
  stage: report
  needs:
    - k6-load-test
    - jmeter-load-test
    - gatling-load-test
  script:
    - echo "Generating performance summary..."
    - python scripts/generate-perf-report.py
  artifacts:
    reports:
      metrics: results/metrics.txt
```

### Jenkins Pipeline

```groovy
// Jenkinsfile
pipeline {
    agent any

    parameters {
        choice(
            name: 'ENVIRONMENT',
            choices: ['staging', 'production'],
            description: 'Target environment'
        )
        choice(
            name: 'TEST_TYPE',
            choices: ['load', 'stress', 'spike', 'soak'],
            description: 'Type of performance test'
        )
        string(
            name: 'DURATION',
            defaultValue: '10',
            description: 'Test duration in minutes'
        )
        string(
            name: 'USERS',
            defaultValue: '100',
            description: 'Number of concurrent users'
        )
    }

    environment {
        BASE_URL = credentials('perf-test-url')
        K6_CLOUD_TOKEN = credentials('k6-cloud-token')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('k6 Tests') {
            agent {
                docker {
                    image 'grafana/k6:latest'
                    args '-v $WORKSPACE:/workspace'
                }
            }
            steps {
                sh """
                    k6 run \\
                        -e BASE_URL=${BASE_URL} \\
                        -e TEST_TYPE=${params.TEST_TYPE} \\
                        --out json=/workspace/results/k6-output.json \\
                        /workspace/k6/scripts/${params.TEST_TYPE}-test.js
                """
            }
            post {
                always {
                    archiveArtifacts artifacts: 'results/k6-*', fingerprint: true
                }
            }
        }

        stage('JMeter Tests') {
            steps {
                sh """
                    docker run --rm \\
                        -v \$(pwd):/tests \\
                        justb4/jmeter \\
                        -n -t /tests/jmeter/test-plans/${params.TEST_TYPE}-test.jmx \\
                        -JbaseUrl=${BASE_URL} \\
                        -Jthreads=${params.USERS} \\
                        -Jduration=\$((${params.DURATION} * 60)) \\
                        -l /tests/results/jmeter-results.jtl \\
                        -e -o /tests/results/jmeter-report
                """
            }
            post {
                always {
                    archiveArtifacts artifacts: 'results/jmeter-*/**', fingerprint: true
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'results/jmeter-report',
                        reportFiles: 'index.html',
                        reportName: 'JMeter Report'
                    ])
                }
            }
        }

        stage('Gatling Tests') {
            steps {
                dir('gatling') {
                    sh """
                        mvn gatling:test \\
                            -Dgatling.simulationClass=simulations.${params.TEST_TYPE.capitalize()}Simulation \\
                            -DbaseUrl=${BASE_URL} \\
                            -Dusers=${params.USERS} \\
                            -Dduration=\$((${params.DURATION} * 60))
                    """
                }
            }
            post {
                always {
                    gatlingArchive()
                }
            }
        }

        stage('Performance Analysis') {
            steps {
                script {
                    def k6Results = readJSON file: 'results/k6-output.json'

                    if (k6Results.metrics.http_req_duration.p95 > 500) {
                        unstable('P95 response time exceeded 500ms threshold')
                    }

                    if (k6Results.metrics.http_req_failed.rate > 0.01) {
                        error('Error rate exceeded 1% threshold')
                    }
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        failure {
            emailext(
                subject: "Performance Test Failed: ${currentBuild.fullDisplayName}",
                body: """
                    Performance tests failed.

                    Environment: ${params.ENVIRONMENT}
                    Test Type: ${params.TEST_TYPE}

                    Check the build: ${env.BUILD_URL}
                """,
                recipientProviders: [requestor(), developers()]
            )
        }
    }
}
```

---

## Monitoring and Reporting

### Grafana Dashboard Configuration

```json
{
  "dashboard": {
    "title": "Performance Test Dashboard",
    "uid": "perf-test-dashboard",
    "panels": [
      {
        "title": "Response Time Percentiles",
        "type": "timeseries",
        "targets": [
          {
            "query": "SELECT percentile(\"value\", 50) AS \"p50\", percentile(\"value\", 95) AS \"p95\", percentile(\"value\", 99) AS \"p99\" FROM \"http_req_duration\" WHERE $timeFilter GROUP BY time($__interval)",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "ms",
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {"color": "green", "value": null},
                {"color": "yellow", "value": 200},
                {"color": "red", "value": 500}
              ]
            }
          }
        }
      },
      {
        "title": "Requests per Second",
        "type": "stat",
        "targets": [
          {
            "query": "SELECT non_negative_derivative(count(\"value\"), 1s) AS \"rps\" FROM \"http_reqs\" WHERE $timeFilter GROUP BY time($__interval)",
            "refId": "A"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "gauge",
        "targets": [
          {
            "query": "SELECT mean(\"value\") * 100 AS \"error_rate\" FROM \"http_req_failed\" WHERE $timeFilter",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "max": 10,
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {"color": "green", "value": null},
                {"color": "yellow", "value": 1},
                {"color": "red", "value": 5}
              ]
            }
          }
        }
      },
      {
        "title": "Active Virtual Users",
        "type": "timeseries",
        "targets": [
          {
            "query": "SELECT mean(\"value\") FROM \"vus\" WHERE $timeFilter GROUP BY time($__interval)",
            "refId": "A"
          }
        ]
      }
    ]
  }
}
```

### InfluxDB Backend Configuration

```yaml
# docker-compose.monitoring.yml
services:
  influxdb:
    image: influxdb:2.7
    ports:
      - "8086:8086"
    environment:
      - DOCKER_INFLUXDB_INIT_MODE=setup
      - DOCKER_INFLUXDB_INIT_USERNAME=admin
      - DOCKER_INFLUXDB_INIT_PASSWORD=${INFLUXDB_PASSWORD}
      - DOCKER_INFLUXDB_INIT_ORG=performance
      - DOCKER_INFLUXDB_INIT_BUCKET=k6
      - DOCKER_INFLUXDB_INIT_ADMIN_TOKEN=${INFLUXDB_TOKEN}
    volumes:
      - influxdb-data:/var/lib/influxdb2
    healthcheck:
      test: ["CMD", "influx", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
      - GF_INSTALL_PLUGINS=grafana-k6-app
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    depends_on:
      influxdb:
        condition: service_healthy

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.enable-remote-write-receiver'

volumes:
  influxdb-data:
  grafana-data:
  prometheus-data:
```

### Performance Baseline Script

```python
#!/usr/bin/env python3
"""
Performance baseline comparison script.
Compares current test results against established baselines.
"""

import json
import sys
from pathlib import Path
from typing import Dict, Any

# Baseline thresholds
BASELINE = {
    "http_req_duration": {
        "p50": 200,  # ms
        "p95": 500,
        "p99": 1000,
    },
    "http_req_failed": {
        "rate": 0.01,  # 1%
    },
    "http_reqs": {
        "rate": 100,  # requests/second minimum
    },
}

# Tolerance for regression (percentage)
REGRESSION_TOLERANCE = 0.10  # 10%


def load_results(file_path: str) -> Dict[str, Any]:
    """Load k6 JSON results."""
    with open(file_path, "r") as f:
        return json.load(f)


def check_threshold(
    metric_name: str,
    current_value: float,
    baseline_value: float,
    is_lower_better: bool = True,
) -> tuple[bool, str]:
    """Check if current value is within acceptable range of baseline."""
    if is_lower_better:
        threshold = baseline_value * (1 + REGRESSION_TOLERANCE)
        passed = current_value <= threshold
        comparison = "≤"
    else:
        threshold = baseline_value * (1 - REGRESSION_TOLERANCE)
        passed = current_value >= threshold
        comparison = "≥"

    status = "PASS" if passed else "FAIL"
    message = f"{metric_name}: {current_value:.2f} {comparison} {threshold:.2f} ({status})"

    return passed, message


def analyze_results(results: Dict[str, Any]) -> tuple[bool, list[str]]:
    """Analyze performance results against baseline."""
    messages = []
    all_passed = True

    metrics = results.get("metrics", {})

    # Check response time percentiles
    if "http_req_duration" in metrics:
        duration = metrics["http_req_duration"]
        for percentile in ["p50", "p95", "p99"]:
            if percentile in duration and percentile in BASELINE["http_req_duration"]:
                passed, msg = check_threshold(
                    f"http_req_duration.{percentile}",
                    duration[percentile],
                    BASELINE["http_req_duration"][percentile],
                )
                messages.append(msg)
                all_passed = all_passed and passed

    # Check error rate
    if "http_req_failed" in metrics:
        failed = metrics["http_req_failed"]
        if "rate" in failed:
            passed, msg = check_threshold(
                "http_req_failed.rate",
                failed["rate"],
                BASELINE["http_req_failed"]["rate"],
            )
            messages.append(msg)
            all_passed = all_passed and passed

    # Check throughput (higher is better)
    if "http_reqs" in metrics:
        reqs = metrics["http_reqs"]
        if "rate" in reqs:
            passed, msg = check_threshold(
                "http_reqs.rate",
                reqs["rate"],
                BASELINE["http_reqs"]["rate"],
                is_lower_better=False,
            )
            messages.append(msg)
            all_passed = all_passed and passed

    return all_passed, messages


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python baseline_check.py <results.json>")
        sys.exit(1)

    results_file = sys.argv[1]

    if not Path(results_file).exists():
        print(f"Results file not found: {results_file}")
        sys.exit(1)

    results = load_results(results_file)
    passed, messages = analyze_results(results)

    print("=" * 60)
    print("Performance Baseline Analysis")
    print("=" * 60)

    for msg in messages:
        print(msg)

    print("=" * 60)

    if passed:
        print("Overall: PASSED - All metrics within acceptable range")
        sys.exit(0)
    else:
        print("Overall: FAILED - Performance regression detected")
        sys.exit(1)


if __name__ == "__main__":
    main()
```

---

## Anti-Patterns to Avoid

### Unrealistic User Behavior

```javascript
// Bad - No think time, unrealistic request rate
export default function () {
  http.get('https://api.example.com/users');
  http.get('https://api.example.com/orders');
  http.get('https://api.example.com/products');
  // No pauses between requests - unrealistic
}

// Good - Realistic think time and user behavior
export default function () {
  http.get('https://api.example.com/users');
  sleep(randomIntBetween(1, 3));  // User reads the page

  http.get('https://api.example.com/orders');
  sleep(randomIntBetween(2, 5));  // User browses orders

  http.get('https://api.example.com/products');
  sleep(randomIntBetween(1, 4));
}
```

### Missing Correlation

```javascript
// Bad - Hardcoded IDs
export default function () {
  http.get('https://api.example.com/users/123');  // Hardcoded ID
  http.post('https://api.example.com/orders', {
    userId: '123',  // Same hardcoded ID
  });
}

// Good - Dynamic correlation
export default function () {
  const usersRes = http.get('https://api.example.com/users');
  const users = JSON.parse(usersRes.body);
  const randomUser = users[Math.floor(Math.random() * users.length)];

  http.get(`https://api.example.com/users/${randomUser.id}`);
  http.post('https://api.example.com/orders', {
    userId: randomUser.id,
  });
}
```

### Insufficient Warm-up

```javascript
// Bad - No warm-up period
export const options = {
  vus: 100,
  duration: '5m',  // Immediate full load
};

// Good - Gradual ramp-up
export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Warm-up
    { duration: '5m', target: 100 },  // Target load
    { duration: '2m', target: 0 },    // Ramp down
  ],
};
```

### Ignoring Error Handling

```javascript
// Bad - No error handling
export default function () {
  const res = http.get('https://api.example.com/users');
  const users = JSON.parse(res.body);  // Will fail if response is error
  console.log(users.length);
}

// Good - Proper error handling
export default function () {
  const res = http.get('https://api.example.com/users');

  if (!check(res, { 'status is 200': (r) => r.status === 200 })) {
    console.error(`Request failed: ${res.status}`);
    return;
  }

  try {
    const users = JSON.parse(res.body);
    console.log(users.length);
  } catch (e) {
    console.error(`Parse error: ${e.message}`);
  }
}
```

### Testing from Single Location

```javascript
// Bad - Single location (doesn't reflect real traffic distribution)
export const options = {
  vus: 100,
  duration: '5m',
};

// Good - Multi-region distribution (k6 Cloud)
export const options = {
  ext: {
    loadimpact: {
      distribution: {
        'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 40 },
        'amazon:ie:dublin': { loadZone: 'amazon:ie:dublin', percent: 30 },
        'amazon:sg:singapore': { loadZone: 'amazon:sg:singapore', percent: 30 },
      },
    },
  },
};
```

---

## References

### Official Documentation

- [k6 Documentation](https://k6.io/docs/)
- [Apache JMeter User Manual](https://jmeter.apache.org/usermanual/index.html)
- [Gatling Documentation](https://gatling.io/docs/gatling/)

### Best Practices

- [k6 Best Practices](https://k6.io/docs/testing-guides/api-load-testing/)
- [JMeter Best Practices](https://jmeter.apache.org/usermanual/best-practices.html)
- [Gatling Best Practices](https://gatling.io/docs/gatling/reference/current/http/http_protocol/)

### Monitoring Integration

- [k6 with InfluxDB](https://k6.io/docs/results-visualization/influxdb/)
- [k6 with Grafana](https://k6.io/docs/results-visualization/grafana-dashboards/)
- [JMeter Backend Listener](https://jmeter.apache.org/usermanual/realtime-results.html)
- [Gatling Metrics](https://gatling.io/docs/gatling/reference/current/stats/timings/)

### Cloud Services

- [k6 Cloud](https://k6.io/cloud/)
- [BlazeMeter (JMeter Cloud)](https://www.blazemeter.com/)
- [Gatling Enterprise](https://gatling.io/enterprise/)

---

**Maintainer**: Tyler Dukes
