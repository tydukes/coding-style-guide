---
title: "Distributed Tracing and Structured Logging Guide"
description: "Comprehensive guide to distributed tracing with OpenTelemetry, structured logging with JSON, log aggregation patterns, and observability best practices"
author: "Tyler Dukes"
tags: [observability, tracing, logging, opentelemetry, jaeger, zipkin, structlog, elk, loki, cloudwatch]
category: "CI/CD"
status: "active"
---

## Introduction

This guide provides comprehensive standards for implementing distributed tracing and structured logging
across microservices and distributed systems. It covers OpenTelemetry instrumentation, structured logging
patterns, log aggregation strategies, and observability best practices.

---

## Table of Contents

1. [Observability Philosophy](#observability-philosophy)
2. [Distributed Tracing](#distributed-tracing)
3. [Structured Logging](#structured-logging)
4. [Log Aggregation](#log-aggregation)
5. [Correlation and Context](#correlation-and-context)
6. [Error Tracking](#error-tracking)
7. [Metrics Integration](#metrics-integration)
8. [CI/CD Integration](#cicd-integration)
9. [Best Practices](#best-practices)

---

## Observability Philosophy

### The Three Pillars of Observability

```text
┌─────────────────────────────────────────────────────────────┐
│                  Observability Stack                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │   TRACES    │  │    LOGS     │  │   METRICS   │        │
│   │             │  │             │  │             │        │
│   │  What path  │  │  What       │  │  What is    │        │
│   │  did the    │  │  happened   │  │  the system │        │
│   │  request    │  │  at each    │  │  state over │        │
│   │  take?      │  │  point?     │  │  time?      │        │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│          │                │                │                │
│          └────────────────┼────────────────┘                │
│                           │                                 │
│                    ┌──────▼──────┐                         │
│                    │ Correlation │                         │
│                    │     ID      │                         │
│                    └─────────────┘                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Key Principles**:

- **Traces** show the journey of a request across services
- **Logs** provide detailed context at each processing point
- **Metrics** quantify system behavior over time
- **Correlation IDs** tie all three together

### Observability Standards

```text
┌─────────────────┬─────────────────────────────────────────┐
│ Standard        │ Description                             │
├─────────────────┼─────────────────────────────────────────┤
│ OpenTelemetry   │ Vendor-neutral instrumentation standard │
│ W3C Trace       │ HTTP trace context propagation          │
│ JSON Logs       │ Machine-parseable structured logs       │
│ Semantic Conv.  │ Consistent attribute naming             │
└─────────────────┴─────────────────────────────────────────┘
```

---

## Distributed Tracing

### OpenTelemetry Setup (Python)

**Installation**:

```bash
pip install opentelemetry-api \
    opentelemetry-sdk \
    opentelemetry-exporter-otlp \
    opentelemetry-instrumentation-requests \
    opentelemetry-instrumentation-flask \
    opentelemetry-instrumentation-sqlalchemy \
    opentelemetry-instrumentation-redis
```

**Tracer configuration**:

```python
# src/observability/tracing.py
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource, SERVICE_NAME, SERVICE_VERSION
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
from opentelemetry.sdk.trace.sampling import (
    ParentBasedTraceIdRatio,
    TraceIdRatioBased,
)

def configure_tracer(
    service_name: str,
    service_version: str,
    otlp_endpoint: str = "localhost:4317",
    sample_rate: float = 1.0,
    debug: bool = False,
) -> trace.Tracer:
    """Configure OpenTelemetry tracer with OTLP exporter."""

    resource = Resource.create({
        SERVICE_NAME: service_name,
        SERVICE_VERSION: service_version,
        "deployment.environment": os.getenv("ENVIRONMENT", "development"),
        "host.name": os.getenv("HOSTNAME", "unknown"),
    })

    sampler = ParentBasedTraceIdRatio(sample_rate)

    provider = TracerProvider(
        resource=resource,
        sampler=sampler,
    )

    otlp_exporter = OTLPSpanExporter(
        endpoint=otlp_endpoint,
        insecure=True,
    )
    provider.add_span_processor(
        BatchSpanProcessor(otlp_exporter)
    )

    if debug:
        provider.add_span_processor(
            BatchSpanProcessor(ConsoleSpanExporter())
        )

    trace.set_tracer_provider(provider)

    return trace.get_tracer(service_name, service_version)

tracer = configure_tracer(
    service_name="order-service",
    service_version="1.2.3",
    otlp_endpoint=os.getenv("OTLP_ENDPOINT", "localhost:4317"),
    sample_rate=float(os.getenv("TRACE_SAMPLE_RATE", "0.1")),
)
```

**Auto-instrumentation**:

```python
# src/observability/auto_instrument.py
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from opentelemetry.instrumentation.celery import CeleryInstrumentor
from opentelemetry.instrumentation.psycopg2 import Psycopg2Instrumentor

def instrument_all(app=None, engine=None):
    """Apply auto-instrumentation to common libraries."""

    RequestsInstrumentor().instrument()

    Psycopg2Instrumentor().instrument()

    RedisInstrumentor().instrument()

    CeleryInstrumentor().instrument()

    if app:
        FlaskInstrumentor().instrument_app(app)

    if engine:
        SQLAlchemyInstrumentor().instrument(engine=engine)
```

**Manual span creation**:

```python
# src/services/order_service.py
from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode

tracer = trace.get_tracer(__name__)

class OrderService:
    """Order processing service with tracing."""

    def create_order(self, user_id: str, items: list) -> Order:
        """Create a new order with full tracing."""
        with tracer.start_as_current_span(
            "create_order",
            attributes={
                "user.id": user_id,
                "order.item_count": len(items),
            }
        ) as span:
            try:
                order = self._validate_and_create(user_id, items)

                span.set_attribute("order.id", order.id)
                span.set_attribute("order.total", float(order.total))
                span.set_status(Status(StatusCode.OK))

                return order

            except ValidationError as e:
                span.set_status(Status(StatusCode.ERROR, str(e)))
                span.record_exception(e)
                raise

    def _validate_and_create(self, user_id: str, items: list) -> Order:
        """Validate items and create order."""
        with tracer.start_as_current_span("validate_items") as span:
            validated_items = []
            for item in items:
                validated = self._validate_item(item)
                validated_items.append(validated)
            span.set_attribute("validated_count", len(validated_items))

        with tracer.start_as_current_span("check_inventory") as span:
            inventory_status = self.inventory_client.check_availability(
                [i["product_id"] for i in validated_items]
            )
            span.set_attribute("all_available", inventory_status.all_available)

        with tracer.start_as_current_span("calculate_pricing") as span:
            pricing = self.pricing_service.calculate(validated_items)
            span.set_attribute("subtotal", float(pricing.subtotal))
            span.set_attribute("tax", float(pricing.tax))
            span.set_attribute("total", float(pricing.total))

        with tracer.start_as_current_span("persist_order") as span:
            order = Order(
                user_id=user_id,
                items=validated_items,
                pricing=pricing,
            )
            self.repository.save(order)
            span.set_attribute("order.id", order.id)

        return order

    def _validate_item(self, item: dict) -> dict:
        """Validate a single order item."""
        with tracer.start_as_current_span(
            "validate_item",
            attributes={"product.id": item.get("product_id")}
        ):
            product = self.product_client.get(item["product_id"])
            if not product:
                raise ValidationError(f"Product not found: {item['product_id']}")
            return {
                "product_id": product.id,
                "name": product.name,
                "price": product.price,
                "quantity": item["quantity"],
            }
```

**Context propagation**:

```python
# src/observability/propagation.py
from opentelemetry import trace
from opentelemetry.propagate import inject, extract
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator
import requests

propagator = TraceContextTextMapPropagator()

def make_traced_request(method: str, url: str, **kwargs) -> requests.Response:
    """Make HTTP request with trace context propagation."""
    headers = kwargs.pop("headers", {})

    inject(headers)

    return requests.request(method, url, headers=headers, **kwargs)

def extract_context_from_request(request) -> trace.Context:
    """Extract trace context from incoming HTTP request."""
    return extract(request.headers)

def traced_request_handler(func):
    """Decorator to extract trace context and create span for request handlers."""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        context = extract(request.headers)

        tracer = trace.get_tracer(__name__)
        with tracer.start_as_current_span(
            f"{request.method} {request.path}",
            context=context,
            attributes={
                "http.method": request.method,
                "http.url": request.url,
                "http.route": request.path,
                "http.user_agent": request.headers.get("User-Agent", ""),
            }
        ) as span:
            try:
                response = func(*args, **kwargs)
                span.set_attribute("http.status_code", response.status_code)
                return response
            except Exception as e:
                span.record_exception(e)
                span.set_status(Status(StatusCode.ERROR, str(e)))
                raise

    return wrapper
```

**Async tracing**:

```python
# src/observability/async_tracing.py
import asyncio
from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode

tracer = trace.get_tracer(__name__)

async def traced_async_operation(name: str, coro, **attributes):
    """Execute async operation with tracing."""
    with tracer.start_as_current_span(name, attributes=attributes) as span:
        try:
            result = await coro
            span.set_status(Status(StatusCode.OK))
            return result
        except Exception as e:
            span.record_exception(e)
            span.set_status(Status(StatusCode.ERROR, str(e)))
            raise

class AsyncOrderProcessor:
    """Async order processor with tracing."""

    async def process_order(self, order_id: str) -> dict:
        """Process order with parallel traced operations."""
        with tracer.start_as_current_span(
            "process_order",
            attributes={"order.id": order_id}
        ) as span:
            order = await self.repository.get(order_id)
            span.set_attribute("order.status", order.status)

            results = await asyncio.gather(
                traced_async_operation(
                    "validate_payment",
                    self.payment_service.validate(order.payment_id),
                    payment_id=order.payment_id,
                ),
                traced_async_operation(
                    "reserve_inventory",
                    self.inventory_service.reserve(order.items),
                    item_count=len(order.items),
                ),
                traced_async_operation(
                    "calculate_shipping",
                    self.shipping_service.calculate(order.shipping_address),
                    address_country=order.shipping_address.country,
                ),
            )

            payment_valid, inventory_reserved, shipping_cost = results

            span.set_attribute("payment.valid", payment_valid)
            span.set_attribute("inventory.reserved", inventory_reserved)
            span.set_attribute("shipping.cost", float(shipping_cost))

            return {
                "order_id": order_id,
                "payment_valid": payment_valid,
                "inventory_reserved": inventory_reserved,
                "shipping_cost": shipping_cost,
            }
```

### OpenTelemetry Setup (TypeScript)

**Installation**:

```bash
npm install @opentelemetry/api \
    @opentelemetry/sdk-node \
    @opentelemetry/auto-instrumentations-node \
    @opentelemetry/exporter-trace-otlp-grpc \
    @opentelemetry/resources \
    @opentelemetry/semantic-conventions
```

**Tracer configuration**:

```typescript
// src/observability/tracing.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { Resource } from '@opentelemetry/resources';
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions';
import { ParentBasedSampler, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';
import { diag, DiagConsoleLogger, DiagLogLevel, trace, Span, SpanStatusCode } from '@opentelemetry/api';

interface TracingConfig {
  serviceName: string;
  serviceVersion: string;
  otlpEndpoint?: string;
  sampleRate?: number;
  debug?: boolean;
}

export function initializeTracing(config: TracingConfig): NodeSDK {
  const {
    serviceName,
    serviceVersion,
    otlpEndpoint = 'localhost:4317',
    sampleRate = 1.0,
    debug = false,
  } = config;

  if (debug) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
  }

  const resource = new Resource({
    [SEMRESATTRS_SERVICE_NAME]: serviceName,
    [SEMRESATTRS_SERVICE_VERSION]: serviceVersion,
    [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
    'host.name': process.env.HOSTNAME || 'unknown',
  });

  const traceExporter = new OTLPTraceExporter({
    url: `http://${otlpEndpoint}`,
  });

  const sampler = new ParentBasedSampler({
    root: new TraceIdRatioBasedSampler(sampleRate),
  });

  const sdk = new NodeSDK({
    resource,
    traceExporter,
    sampler,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-http': {
          ignoreIncomingPaths: ['/health', '/ready', '/metrics'],
        },
      }),
    ],
  });

  sdk.start();

  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error) => console.error('Error terminating tracing', error))
      .finally(() => process.exit(0));
  });

  return sdk;
}

export const tracer = trace.getTracer('order-service', '1.0.0');
```

**Manual span creation**:

```typescript
// src/services/order.service.ts
import { trace, Span, SpanStatusCode, context } from '@opentelemetry/api';

const tracer = trace.getTracer('order-service');

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: string;
}

export class OrderService {
  async createOrder(userId: string, items: OrderItem[]): Promise<Order> {
    return tracer.startActiveSpan(
      'createOrder',
      {
        attributes: {
          'user.id': userId,
          'order.item_count': items.length,
        },
      },
      async (span: Span) => {
        try {
          const order = await this.validateAndCreate(userId, items);

          span.setAttributes({
            'order.id': order.id,
            'order.total': order.total,
          });
          span.setStatus({ code: SpanStatusCode.OK });

          return order;
        } catch (error) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : 'Unknown error',
          });
          span.recordException(error as Error);
          throw error;
        } finally {
          span.end();
        }
      }
    );
  }

  private async validateAndCreate(userId: string, items: OrderItem[]): Promise<Order> {
    const validatedItems = await tracer.startActiveSpan(
      'validateItems',
      async (span: Span) => {
        try {
          const validated = await Promise.all(
            items.map((item) => this.validateItem(item))
          );
          span.setAttribute('validated_count', validated.length);
          return validated;
        } finally {
          span.end();
        }
      }
    );

    const inventoryStatus = await tracer.startActiveSpan(
      'checkInventory',
      async (span: Span) => {
        try {
          const status = await this.inventoryClient.checkAvailability(
            validatedItems.map((i) => i.productId)
          );
          span.setAttribute('all_available', status.allAvailable);
          return status;
        } finally {
          span.end();
        }
      }
    );

    const pricing = await tracer.startActiveSpan(
      'calculatePricing',
      async (span: Span) => {
        try {
          const result = await this.pricingService.calculate(validatedItems);
          span.setAttributes({
            subtotal: result.subtotal,
            tax: result.tax,
            total: result.total,
          });
          return result;
        } finally {
          span.end();
        }
      }
    );

    return tracer.startActiveSpan(
      'persistOrder',
      async (span: Span) => {
        try {
          const order: Order = {
            id: this.generateId(),
            userId,
            items: validatedItems,
            total: pricing.total,
            status: 'pending',
          };
          await this.repository.save(order);
          span.setAttribute('order.id', order.id);
          return order;
        } finally {
          span.end();
        }
      }
    );
  }

  private async validateItem(item: OrderItem): Promise<OrderItem> {
    return tracer.startActiveSpan(
      'validateItem',
      { attributes: { 'product.id': item.productId } },
      async (span: Span) => {
        try {
          const product = await this.productClient.get(item.productId);
          if (!product) {
            throw new Error(`Product not found: ${item.productId}`);
          }
          return { ...item, price: product.price };
        } finally {
          span.end();
        }
      }
    );
  }
}
```

**Context propagation**:

```typescript
// src/observability/propagation.ts
import { context, propagation, trace, SpanStatusCode } from '@opentelemetry/api';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

propagation.setGlobalPropagator(new W3CTraceContextPropagator());

export async function tracedHttpRequest<T>(
  config: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  const headers: Record<string, string> = {
    ...(config.headers as Record<string, string>),
  };

  propagation.inject(context.active(), headers);

  return axios.request<T>({ ...config, headers });
}

export function extractContextFromHeaders(
  headers: Record<string, string | string[] | undefined>
): ReturnType<typeof propagation.extract> {
  const normalizedHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value) {
      normalizedHeaders[key.toLowerCase()] = Array.isArray(value) ? value[0] : value;
    }
  }
  return propagation.extract(context.active(), normalizedHeaders);
}

export function tracedRequestHandler(handlerName: string) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = async function (req: Request, res: Response, ...args: unknown[]) {
      const extractedContext = extractContextFromHeaders(
        req.headers as Record<string, string>
      );

      return context.with(extractedContext, async () => {
        const tracer = trace.getTracer('http-server');
        return tracer.startActiveSpan(
          `${req.method} ${handlerName}`,
          {
            attributes: {
              'http.method': req.method,
              'http.url': req.url,
              'http.route': handlerName,
              'http.user_agent': req.headers['user-agent'] || '',
            },
          },
          async (span) => {
            try {
              const result = await originalMethod.apply(this, [req, res, ...args]);
              span.setAttribute('http.status_code', res.statusCode);
              span.setStatus({ code: SpanStatusCode.OK });
              return result;
            } catch (error) {
              span.recordException(error as Error);
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: (error as Error).message,
              });
              throw error;
            } finally {
              span.end();
            }
          }
        );
      });
    };

    return descriptor;
  };
}
```

### Span Naming Conventions

```python
# Span naming standards
SPAN_NAMING_CONVENTIONS = {
    # HTTP spans
    "http_server": "{method} {route}",
    "http_client": "HTTP {method}",

    # Database spans
    "db_query": "{db.system} {db.operation}",
    "db_statement": "{db.system} {db.operation} {db.sql.table}",

    # Messaging spans
    "message_publish": "{messaging.system} publish",
    "message_receive": "{messaging.system} receive",
    "message_process": "{messaging.system} process",

    # RPC spans
    "rpc_client": "{rpc.system}/{rpc.service}/{rpc.method}",
    "rpc_server": "{rpc.system}/{rpc.service}/{rpc.method}",

    # Internal spans
    "internal": "{component}.{operation}",
}

# Examples
SPAN_NAMES = {
    "http_server": "GET /api/users/{id}",
    "http_client": "HTTP POST",
    "db_query": "postgresql SELECT",
    "db_statement": "postgresql SELECT users",
    "message_publish": "kafka publish",
    "message_receive": "rabbitmq receive",
    "rpc_client": "grpc/UserService/GetUser",
    "internal": "OrderService.validateItems",
}
```

### Sampling Strategies

```python
# src/observability/sampling.py
from opentelemetry.sdk.trace.sampling import (
    Sampler,
    SamplingResult,
    Decision,
    ParentBased,
    TraceIdRatioBased,
    ALWAYS_ON,
    ALWAYS_OFF,
)
from opentelemetry.trace import Link, SpanKind
from opentelemetry.util.types import Attributes

class PrioritySampler(Sampler):
    """Sample based on request priority and error status."""

    def __init__(self, default_rate: float = 0.1, high_priority_rate: float = 1.0):
        self.default_rate = default_rate
        self.high_priority_rate = high_priority_rate
        self.default_sampler = TraceIdRatioBased(default_rate)
        self.high_priority_sampler = TraceIdRatioBased(high_priority_rate)

    def should_sample(
        self,
        parent_context,
        trace_id: int,
        name: str,
        kind: SpanKind = None,
        attributes: Attributes = None,
        links: list[Link] = None,
    ) -> SamplingResult:
        attributes = attributes or {}

        if attributes.get("error", False):
            return SamplingResult(Decision.RECORD_AND_SAMPLE, attributes)

        if attributes.get("priority") == "high":
            return self.high_priority_sampler.should_sample(
                parent_context, trace_id, name, kind, attributes, links
            )

        if name.startswith("health") or name.startswith("ready"):
            return SamplingResult(Decision.DROP, attributes)

        return self.default_sampler.should_sample(
            parent_context, trace_id, name, kind, attributes, links
        )

    def get_description(self) -> str:
        return f"PrioritySampler(default={self.default_rate}, high={self.high_priority_rate})"

class AdaptiveSampler(Sampler):
    """Adaptive sampler that adjusts rate based on traffic volume."""

    def __init__(
        self,
        target_traces_per_second: float = 10.0,
        min_rate: float = 0.001,
        max_rate: float = 1.0,
    ):
        self.target_tps = target_traces_per_second
        self.min_rate = min_rate
        self.max_rate = max_rate
        self._request_count = 0
        self._last_adjustment = time.time()
        self._current_rate = max_rate
        self._lock = threading.Lock()

    def should_sample(
        self,
        parent_context,
        trace_id: int,
        name: str,
        kind: SpanKind = None,
        attributes: Attributes = None,
        links: list[Link] = None,
    ) -> SamplingResult:
        with self._lock:
            self._request_count += 1
            self._maybe_adjust_rate()

        sampler = TraceIdRatioBased(self._current_rate)
        return sampler.should_sample(
            parent_context, trace_id, name, kind, attributes, links
        )

    def _maybe_adjust_rate(self):
        """Adjust sampling rate based on recent traffic."""
        now = time.time()
        elapsed = now - self._last_adjustment

        if elapsed >= 1.0:
            actual_tps = self._request_count / elapsed
            if actual_tps > 0:
                self._current_rate = min(
                    self.max_rate,
                    max(self.min_rate, self.target_tps / actual_tps)
                )
            self._request_count = 0
            self._last_adjustment = now

    def get_description(self) -> str:
        return f"AdaptiveSampler(target_tps={self.target_tps})"

SAMPLING_CONFIG = {
    "development": {
        "type": "always_on",
        "rate": 1.0,
    },
    "staging": {
        "type": "ratio",
        "rate": 0.5,
    },
    "production": {
        "type": "adaptive",
        "target_tps": 100,
        "min_rate": 0.001,
        "max_rate": 0.1,
    },
}
```

---

## Structured Logging

### Python (structlog)

**Installation**:

```bash
pip install structlog python-json-logger
```

**Logger configuration**:

```python
# src/observability/logging.py
import logging
import sys
from typing import Any, Dict, Optional

import structlog
from structlog.types import EventDict, Processor

def add_trace_context(
    logger: logging.Logger,
    method_name: str,
    event_dict: EventDict
) -> EventDict:
    """Add OpenTelemetry trace context to log events."""
    from opentelemetry import trace

    span = trace.get_current_span()
    if span.is_recording():
        ctx = span.get_span_context()
        event_dict["trace_id"] = format(ctx.trace_id, "032x")
        event_dict["span_id"] = format(ctx.span_id, "016x")
        event_dict["trace_flags"] = ctx.trace_flags

    return event_dict

def add_service_context(
    logger: logging.Logger,
    method_name: str,
    event_dict: EventDict
) -> EventDict:
    """Add service context to log events."""
    import os

    event_dict["service"] = os.getenv("SERVICE_NAME", "unknown")
    event_dict["version"] = os.getenv("SERVICE_VERSION", "unknown")
    event_dict["environment"] = os.getenv("ENVIRONMENT", "development")
    event_dict["host"] = os.getenv("HOSTNAME", "unknown")

    return event_dict

def configure_logging(
    level: str = "INFO",
    json_format: bool = True,
    add_trace: bool = True,
) -> structlog.BoundLogger:
    """Configure structured logging with structlog."""

    shared_processors: list[Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.UnicodeDecoder(),
        add_service_context,
    ]

    if add_trace:
        shared_processors.append(add_trace_context)

    if json_format:
        renderer = structlog.processors.JSONRenderer()
    else:
        renderer = structlog.dev.ConsoleRenderer(colors=True)

    structlog.configure(
        processors=shared_processors + [
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    formatter = structlog.stdlib.ProcessorFormatter(
        foreign_pre_chain=shared_processors,
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            renderer,
        ],
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.handlers = []
    root_logger.addHandler(handler)
    root_logger.setLevel(getattr(logging, level.upper()))

    for logger_name in ["uvicorn", "uvicorn.error", "uvicorn.access"]:
        logging.getLogger(logger_name).handlers = []
        logging.getLogger(logger_name).propagate = True

    return structlog.get_logger()

logger = configure_logging(
    level=os.getenv("LOG_LEVEL", "INFO"),
    json_format=os.getenv("LOG_FORMAT", "json") == "json",
)
```

**Structured logging usage**:

```python
# src/services/user_service.py
import structlog
from structlog.contextvars import bind_contextvars, clear_contextvars

logger = structlog.get_logger()

class UserService:
    """User service with structured logging."""

    def login(self, email: str, password: str, request_context: dict) -> dict:
        """Handle user login with comprehensive logging."""
        bind_contextvars(
            request_id=request_context.get("request_id"),
            client_ip=request_context.get("client_ip"),
            user_agent=request_context.get("user_agent"),
        )

        logger.info(
            "login_attempt",
            email=email,
            auth_method="password",
        )

        try:
            user = self.repository.find_by_email(email)
            if not user:
                logger.warning(
                    "login_failed",
                    email=email,
                    reason="user_not_found",
                )
                raise AuthenticationError("Invalid credentials")

            if not self.verify_password(password, user.password_hash):
                logger.warning(
                    "login_failed",
                    email=email,
                    user_id=user.id,
                    reason="invalid_password",
                    failed_attempts=user.failed_login_attempts + 1,
                )
                self._record_failed_attempt(user)
                raise AuthenticationError("Invalid credentials")

            if not user.is_active:
                logger.warning(
                    "login_failed",
                    email=email,
                    user_id=user.id,
                    reason="account_inactive",
                )
                raise AuthenticationError("Account is inactive")

            token = self.create_token(user)

            logger.info(
                "login_success",
                user_id=user.id,
                email=user.email,
                role=user.role,
                mfa_enabled=user.mfa_enabled,
            )

            return {
                "user_id": user.id,
                "token": token,
                "expires_in": 3600,
            }

        except AuthenticationError:
            raise
        except Exception as e:
            logger.error(
                "login_error",
                email=email,
                error_type=type(e).__name__,
                error_message=str(e),
                exc_info=True,
            )
            raise
        finally:
            clear_contextvars()

    def create_user(self, user_data: dict) -> User:
        """Create a new user with audit logging."""
        logger.info(
            "user_creation_started",
            email=user_data.get("email"),
            role=user_data.get("role", "user"),
        )

        try:
            if self.repository.find_by_email(user_data["email"]):
                logger.warning(
                    "user_creation_failed",
                    email=user_data["email"],
                    reason="email_exists",
                )
                raise ValidationError("Email already registered")

            user = User(
                email=user_data["email"],
                name=user_data["name"],
                role=user_data.get("role", "user"),
            )
            user.set_password(user_data["password"])
            self.repository.save(user)

            logger.info(
                "user_created",
                user_id=user.id,
                email=user.email,
                role=user.role,
            )

            return user

        except ValidationError:
            raise
        except Exception as e:
            logger.error(
                "user_creation_error",
                email=user_data.get("email"),
                error_type=type(e).__name__,
                error_message=str(e),
                exc_info=True,
            )
            raise
```

**Context manager for request logging**:

```python
# src/middleware/logging_middleware.py
import time
import uuid
from contextlib import contextmanager

import structlog
from structlog.contextvars import bind_contextvars, clear_contextvars

logger = structlog.get_logger()

@contextmanager
def request_logging_context(request):
    """Context manager for request-scoped logging."""
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    start_time = time.time()

    bind_contextvars(
        request_id=request_id,
        method=request.method,
        path=request.path,
        client_ip=request.remote_addr,
        user_agent=request.headers.get("User-Agent", ""),
    )

    logger.info("request_started")

    try:
        yield request_id
    except Exception as e:
        logger.error(
            "request_error",
            error_type=type(e).__name__,
            error_message=str(e),
            exc_info=True,
        )
        raise
    finally:
        duration_ms = (time.time() - start_time) * 1000
        logger.info(
            "request_completed",
            duration_ms=round(duration_ms, 2),
        )
        clear_contextvars()

def logging_middleware(app):
    """Flask middleware for request logging."""
    @app.before_request
    def before_request():
        request.start_time = time.time()
        request.request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))

        bind_contextvars(
            request_id=request.request_id,
            method=request.method,
            path=request.path,
            client_ip=request.remote_addr,
        )

        logger.info("request_started")

    @app.after_request
    def after_request(response):
        duration_ms = (time.time() - request.start_time) * 1000

        logger.info(
            "request_completed",
            status_code=response.status_code,
            duration_ms=round(duration_ms, 2),
            response_size=response.content_length,
        )

        response.headers["X-Request-ID"] = request.request_id

        clear_contextvars()
        return response

    return app
```

### TypeScript (pino)

**Installation**:

```bash
npm install pino pino-pretty pino-http
```

**Logger configuration**:

```typescript
// src/observability/logging.ts
import pino, { Logger, LoggerOptions } from 'pino';
import { trace, context } from '@opentelemetry/api';

interface ServiceContext {
  service: string;
  version: string;
  environment: string;
  host: string;
}

function getServiceContext(): ServiceContext {
  return {
    service: process.env.SERVICE_NAME || 'unknown',
    version: process.env.SERVICE_VERSION || 'unknown',
    environment: process.env.NODE_ENV || 'development',
    host: process.env.HOSTNAME || 'unknown',
  };
}

function getTraceContext(): Record<string, string> | undefined {
  const span = trace.getSpan(context.active());
  if (!span) return undefined;

  const spanContext = span.spanContext();
  return {
    trace_id: spanContext.traceId,
    span_id: spanContext.spanId,
    trace_flags: spanContext.traceFlags.toString(),
  };
}

export function createLogger(name: string): Logger {
  const isDevelopment = process.env.NODE_ENV === 'development';

  const options: LoggerOptions = {
    name,
    level: process.env.LOG_LEVEL || 'info',
    base: getServiceContext(),
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
    },
    mixin: () => {
      const traceContext = getTraceContext();
      return traceContext ? { ...traceContext } : {};
    },
  };

  if (isDevelopment) {
    return pino({
      ...options,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    });
  }

  return pino(options);
}

export const logger = createLogger('app');
```

**Structured logging usage**:

```typescript
// src/services/user.service.ts
import { createLogger } from '../observability/logging';

const logger = createLogger('UserService');

interface LoginContext {
  requestId: string;
  clientIp: string;
  userAgent: string;
}

export class UserService {
  async login(email: string, password: string, context: LoginContext): Promise<LoginResult> {
    const childLogger = logger.child({
      request_id: context.requestId,
      client_ip: context.clientIp,
      user_agent: context.userAgent,
    });

    childLogger.info({ email, auth_method: 'password' }, 'login_attempt');

    try {
      const user = await this.repository.findByEmail(email);

      if (!user) {
        childLogger.warn({ email, reason: 'user_not_found' }, 'login_failed');
        throw new AuthenticationError('Invalid credentials');
      }

      const passwordValid = await this.verifyPassword(password, user.passwordHash);
      if (!passwordValid) {
        childLogger.warn(
          {
            email,
            user_id: user.id,
            reason: 'invalid_password',
            failed_attempts: user.failedLoginAttempts + 1,
          },
          'login_failed'
        );
        await this.recordFailedAttempt(user);
        throw new AuthenticationError('Invalid credentials');
      }

      if (!user.isActive) {
        childLogger.warn(
          { email, user_id: user.id, reason: 'account_inactive' },
          'login_failed'
        );
        throw new AuthenticationError('Account is inactive');
      }

      const token = await this.createToken(user);

      childLogger.info(
        {
          user_id: user.id,
          email: user.email,
          role: user.role,
          mfa_enabled: user.mfaEnabled,
        },
        'login_success'
      );

      return { userId: user.id, token, expiresIn: 3600 };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }

      childLogger.error(
        {
          email,
          error_type: error.constructor.name,
          error_message: error.message,
          stack: error.stack,
        },
        'login_error'
      );
      throw error;
    }
  }

  async createUser(userData: CreateUserDto): Promise<User> {
    logger.info(
      { email: userData.email, role: userData.role || 'user' },
      'user_creation_started'
    );

    try {
      const existingUser = await this.repository.findByEmail(userData.email);
      if (existingUser) {
        logger.warn({ email: userData.email, reason: 'email_exists' }, 'user_creation_failed');
        throw new ValidationError('Email already registered');
      }

      const user = new User({
        email: userData.email,
        name: userData.name,
        role: userData.role || 'user',
      });
      await user.setPassword(userData.password);
      await this.repository.save(user);

      logger.info(
        { user_id: user.id, email: user.email, role: user.role },
        'user_created'
      );

      return user;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      logger.error(
        {
          email: userData.email,
          error_type: error.constructor.name,
          error_message: error.message,
          stack: error.stack,
        },
        'user_creation_error'
      );
      throw error;
    }
  }
}
```

**HTTP request logging middleware**:

```typescript
// src/middleware/logging.middleware.ts
import pinoHttp from 'pino-http';
import { createLogger } from '../observability/logging';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';

const logger = createLogger('http');

export const httpLoggingMiddleware = pinoHttp({
  logger,
  genReqId: (req) => req.headers['x-request-id'] || uuidv4(),
  customProps: (req) => ({
    request_id: req.id,
  }),
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} completed`;
  },
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} failed: ${err.message}`;
  },
  customAttributeKeys: {
    req: 'request',
    res: 'response',
    err: 'error',
    responseTime: 'duration_ms',
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      path: req.path,
      query: req.query,
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
        host: req.headers.host,
      },
    }),
    res: (res) => ({
      status_code: res.statusCode,
      headers: {
        'content-type': res.getHeader('content-type'),
        'content-length': res.getHeader('content-length'),
      },
    }),
  },
});

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}
```

### Log Level Standards

```python
# Log level usage standards
LOG_LEVELS = {
    "DEBUG": {
        "description": "Detailed diagnostic information for debugging",
        "examples": [
            "Variable values during execution",
            "Function entry/exit points",
            "Cache hits/misses",
            "Query parameters",
        ],
        "production": False,
    },
    "INFO": {
        "description": "General operational events",
        "examples": [
            "Request started/completed",
            "User login/logout",
            "Background job started/completed",
            "Configuration loaded",
        ],
        "production": True,
    },
    "WARNING": {
        "description": "Unexpected but handled situations",
        "examples": [
            "Deprecated API usage",
            "Retry after transient failure",
            "Rate limit approaching",
            "Authentication failure",
        ],
        "production": True,
    },
    "ERROR": {
        "description": "Error conditions that should be investigated",
        "examples": [
            "Unhandled exceptions",
            "External service failures",
            "Database connection errors",
            "Invalid data received",
        ],
        "production": True,
    },
    "CRITICAL": {
        "description": "System-wide failures requiring immediate attention",
        "examples": [
            "Application startup failure",
            "Data corruption detected",
            "Security breach detected",
            "Critical resource exhausted",
        ],
        "production": True,
    },
}
```

### Log Field Standards

```python
# Standard log field naming conventions
STANDARD_LOG_FIELDS = {
    # Request context
    "request_id": "Unique request identifier (UUID)",
    "trace_id": "Distributed trace ID",
    "span_id": "Current span ID",
    "parent_span_id": "Parent span ID",

    # HTTP context
    "http.method": "HTTP method (GET, POST, etc.)",
    "http.url": "Full request URL",
    "http.path": "Request path",
    "http.status_code": "Response status code",
    "http.duration_ms": "Request duration in milliseconds",
    "http.client_ip": "Client IP address",
    "http.user_agent": "User agent string",

    # User context
    "user.id": "User identifier",
    "user.email": "User email (if allowed by policy)",
    "user.role": "User role or permission level",

    # Service context
    "service.name": "Service name",
    "service.version": "Service version",
    "service.environment": "Deployment environment",
    "service.host": "Host name or container ID",

    # Error context
    "error.type": "Exception class name",
    "error.message": "Error message",
    "error.stack": "Stack trace",
    "error.code": "Application error code",

    # Business context
    "order.id": "Order identifier",
    "payment.id": "Payment identifier",
    "product.id": "Product identifier",
    "transaction.id": "Transaction identifier",

    # Performance context
    "db.query_time_ms": "Database query time",
    "cache.hit": "Cache hit/miss boolean",
    "external.service": "External service name",
    "external.duration_ms": "External call duration",
}

LOG_FIELD_EXAMPLES = {
    "login_success": {
        "event": "login_success",
        "level": "info",
        "timestamp": "2024-01-15T10:30:00.000Z",
        "request_id": "550e8400-e29b-41d4-a716-446655440000",
        "trace_id": "abcd1234567890abcdef1234567890ab",
        "span_id": "1234567890abcdef",
        "service": "auth-service",
        "version": "1.2.3",
        "environment": "production",
        "user.id": "usr_123456",
        "user.email": "user@example.com",
        "user.role": "admin",
        "http.client_ip": "192.168.1.100",
        "http.user_agent": "Mozilla/5.0...",
        "auth_method": "password",
        "mfa_enabled": True,
    },
    "request_completed": {
        "event": "request_completed",
        "level": "info",
        "timestamp": "2024-01-15T10:30:00.500Z",
        "request_id": "550e8400-e29b-41d4-a716-446655440000",
        "trace_id": "abcd1234567890abcdef1234567890ab",
        "http.method": "POST",
        "http.path": "/api/orders",
        "http.status_code": 201,
        "http.duration_ms": 245.5,
        "db.query_count": 3,
        "db.total_time_ms": 45.2,
    },
}
```

---

## Log Aggregation

### ELK Stack Configuration

**Filebeat configuration**:

```yaml
# filebeat.yml
filebeat.inputs:
  - type: container
    paths:
      - '/var/lib/docker/containers/*/*.log'
    processors:
      - add_kubernetes_metadata:
          host: ${NODE_NAME}
          matchers:
            - logs_path:
                logs_path: '/var/lib/docker/containers/'

  - type: log
    paths:
      - '/var/log/app/*.log'
    json.keys_under_root: true
    json.add_error_key: true
    json.message_key: message

processors:
  - decode_json_fields:
      fields: ['message']
      target: ''
      overwrite_keys: true
      add_error_key: true

  - add_host_metadata:
      when.not.contains.tags: forwarded

  - add_cloud_metadata: ~

  - add_fields:
      target: ''
      fields:
        environment: ${ENVIRONMENT:development}

output.elasticsearch:
  hosts: ['${ELASTICSEARCH_HOST:localhost:9200}']
  index: 'logs-%{[service.name]}-%{+yyyy.MM.dd}'
  pipeline: 'logs-pipeline'

setup.template:
  name: 'logs'
  pattern: 'logs-*'
  settings:
    index.number_of_shards: 1
    index.number_of_replicas: 1

setup.ilm:
  enabled: true
  rollover_alias: 'logs'
  pattern: '{now/d}-000001'
  policy_name: 'logs-policy'

logging.level: info
logging.to_files: true
logging.files:
  path: /var/log/filebeat
  name: filebeat
  keepfiles: 7
  permissions: 0644
```

**Elasticsearch index template**:

```json
{
  "index_patterns": ["logs-*"],
  "template": {
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 1,
      "index.lifecycle.name": "logs-policy",
      "index.lifecycle.rollover_alias": "logs"
    },
    "mappings": {
      "dynamic_templates": [
        {
          "strings_as_keywords": {
            "match_mapping_type": "string",
            "mapping": {
              "type": "keyword",
              "ignore_above": 1024
            }
          }
        }
      ],
      "properties": {
        "@timestamp": { "type": "date" },
        "level": { "type": "keyword" },
        "event": { "type": "keyword" },
        "message": { "type": "text" },
        "service": { "type": "keyword" },
        "version": { "type": "keyword" },
        "environment": { "type": "keyword" },
        "host": { "type": "keyword" },
        "request_id": { "type": "keyword" },
        "trace_id": { "type": "keyword" },
        "span_id": { "type": "keyword" },
        "user": {
          "properties": {
            "id": { "type": "keyword" },
            "email": { "type": "keyword" },
            "role": { "type": "keyword" }
          }
        },
        "http": {
          "properties": {
            "method": { "type": "keyword" },
            "path": { "type": "keyword" },
            "status_code": { "type": "integer" },
            "duration_ms": { "type": "float" },
            "client_ip": { "type": "ip" }
          }
        },
        "error": {
          "properties": {
            "type": { "type": "keyword" },
            "message": { "type": "text" },
            "stack": { "type": "text" }
          }
        }
      }
    }
  }
}
```

**ILM Policy**:

```json
{
  "policy": {
    "phases": {
      "hot": {
        "min_age": "0ms",
        "actions": {
          "rollover": {
            "max_age": "1d",
            "max_primary_shard_size": "50gb"
          },
          "set_priority": {
            "priority": 100
          }
        }
      },
      "warm": {
        "min_age": "7d",
        "actions": {
          "shrink": {
            "number_of_shards": 1
          },
          "forcemerge": {
            "max_num_segments": 1
          },
          "set_priority": {
            "priority": 50
          }
        }
      },
      "cold": {
        "min_age": "30d",
        "actions": {
          "set_priority": {
            "priority": 0
          },
          "freeze": {}
        }
      },
      "delete": {
        "min_age": "90d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
```

### Grafana Loki Configuration

**Promtail configuration**:

```yaml
# promtail-config.yml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push
    tenant_id: default
    batchwait: 1s
    batchsize: 1048576
    timeout: 10s

scrape_configs:
  - job_name: containers
    static_configs:
      - targets:
          - localhost
        labels:
          job: containerlogs
          __path__: /var/lib/docker/containers/*/*log

    pipeline_stages:
      - json:
          expressions:
            output: log
            stream: stream
            timestamp: time

      - json:
          expressions:
            level: level
            event: event
            service: service
            trace_id: trace_id
            span_id: span_id
            request_id: request_id
          source: output

      - labels:
          level:
          service:
          event:

      - timestamp:
          source: timestamp
          format: RFC3339Nano

      - output:
          source: output

  - job_name: kubernetes-pods
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels:
          - __meta_kubernetes_pod_controller_name
        regex: ([0-9a-z-.]+?)(-[0-9a-f]{8,10})?
        action: replace
        target_label: __tmp_controller_name
      - source_labels:
          - __meta_kubernetes_pod_label_app_kubernetes_io_name
          - __meta_kubernetes_pod_label_app
          - __tmp_controller_name
          - __meta_kubernetes_pod_name
        regex: ^;*([^;]+)(;.*)?$
        action: replace
        target_label: app
      - source_labels:
          - __meta_kubernetes_pod_annotation_kubernetes_io_config_hash
        action: replace
        target_label: __tmp_pod_label_hash
      - source_labels:
          - __meta_kubernetes_namespace
        action: replace
        target_label: namespace
      - action: replace
        replacement: /var/log/pods/*$1/*.log
        separator: /
        source_labels:
          - __meta_kubernetes_pod_uid
          - __meta_kubernetes_pod_container_name
        target_label: __path__

    pipeline_stages:
      - cri: {}
      - json:
          expressions:
            level: level
            event: event
            trace_id: trace_id
      - labels:
          level:
          event:
```

**LogQL query examples**:

```bash
# Find all errors in the last hour
{job="containerlogs", level="error"} | json | line_format "{{.event}}: {{.message}}"

# Count errors by service
sum by (service) (count_over_time({level="error"}[1h]))

# Find slow requests (> 1000ms)
{job="containerlogs"} | json | http_duration_ms > 1000

# Trace a specific request
{job="containerlogs"} | json | request_id="550e8400-e29b-41d4-a716-446655440000"

# Find all logs for a trace
{job="containerlogs"} | json | trace_id="abcd1234567890abcdef1234567890ab"

# Error rate by service over time
sum by (service) (rate({level="error"}[5m]))

# Top 10 slowest endpoints
topk(10, avg by (http_path) (
  avg_over_time({job="containerlogs"} | json | unwrap http_duration_ms [1h])
))

# Login failures by reason
sum by (reason) (count_over_time({event="login_failed"}[1h]))
```

### AWS CloudWatch Configuration

**CloudWatch Logs agent configuration**:

```json
{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "cwagent"
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/app/*.log",
            "log_group_name": "/app/${ENVIRONMENT}/${SERVICE_NAME}",
            "log_stream_name": "{instance_id}",
            "timezone": "UTC",
            "timestamp_format": "%Y-%m-%dT%H:%M:%S.%fZ",
            "multi_line_start_pattern": "{",
            "encoding": "utf-8"
          }
        ]
      }
    },
    "log_stream_name": "default",
    "force_flush_interval": 5
  }
}
```

**CloudWatch Logs Insights queries**:

```sql
-- Find all errors in the last hour
fields @timestamp, @message, service, error.type, error.message
| filter level = "error"
| sort @timestamp desc
| limit 100

-- Count errors by service
stats count(*) as error_count by service
| filter level = "error"
| sort error_count desc

-- Find slow requests
fields @timestamp, http.path, http.duration_ms, trace_id
| filter http.duration_ms > 1000
| sort http.duration_ms desc
| limit 50

-- Trace a specific request
fields @timestamp, @message
| filter request_id = "550e8400-e29b-41d4-a716-446655440000"
| sort @timestamp asc

-- Error rate over time (5 minute buckets)
stats count(*) as total, sum(level = "error") as errors by bin(5m) as time_bucket
| sort time_bucket asc

-- P99 latency by endpoint
stats percentile(http.duration_ms, 99) as p99_latency by http.path
| sort p99_latency desc
| limit 20

-- Login failures by reason
stats count(*) as failures by reason
| filter event = "login_failed"
| sort failures desc

-- User activity timeline
fields @timestamp, event, user.id, http.path
| filter user.id = "usr_123456"
| sort @timestamp desc
| limit 100
```

**Terraform for CloudWatch Logs**:

```hcl
# cloudwatch.tf
resource "aws_cloudwatch_log_group" "app_logs" {
  name              = "/app/${var.environment}/${var.service_name}"
  retention_in_days = var.log_retention_days

  tags = {
    Environment = var.environment
    Service     = var.service_name
  }
}

resource "aws_cloudwatch_log_metric_filter" "error_count" {
  name           = "${var.service_name}-error-count"
  pattern        = "{ $.level = \"error\" }"
  log_group_name = aws_cloudwatch_log_group.app_logs.name

  metric_transformation {
    name          = "ErrorCount"
    namespace     = "App/${var.service_name}"
    value         = "1"
    default_value = "0"
    dimensions = {
      Service = "$.service"
    }
  }
}

resource "aws_cloudwatch_log_metric_filter" "request_latency" {
  name           = "${var.service_name}-request-latency"
  pattern        = "{ $.event = \"request_completed\" }"
  log_group_name = aws_cloudwatch_log_group.app_logs.name

  metric_transformation {
    name      = "RequestLatency"
    namespace = "App/${var.service_name}"
    value     = "$.http.duration_ms"
    unit      = "Milliseconds"
  }
}

resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "${var.service_name}-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ErrorCount"
  namespace           = "App/${var.service_name}"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "High error rate detected"

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  dimensions = {
    Service = var.service_name
  }
}

resource "aws_cloudwatch_metric_alarm" "high_latency" {
  alarm_name          = "${var.service_name}-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "RequestLatency"
  namespace           = "App/${var.service_name}"
  period              = 300
  extended_statistic  = "p99"
  threshold           = 1000
  alarm_description   = "P99 latency exceeded 1 second"

  alarm_actions = [aws_sns_topic.alerts.arn]
}
```

---

## Correlation and Context

### Correlation ID Implementation

**Python middleware**:

```python
# src/middleware/correlation.py
import uuid
from contextvars import ContextVar
from functools import wraps
from typing import Callable, Optional

from opentelemetry import trace
from opentelemetry.propagate import extract, inject

correlation_id_var: ContextVar[Optional[str]] = ContextVar(
    "correlation_id", default=None
)

def get_correlation_id() -> Optional[str]:
    """Get current correlation ID."""
    return correlation_id_var.get()

def set_correlation_id(correlation_id: str) -> None:
    """Set correlation ID for current context."""
    correlation_id_var.set(correlation_id)

class CorrelationMiddleware:
    """Middleware to handle correlation ID propagation."""

    HEADER_NAME = "X-Correlation-ID"

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers", []))
        correlation_id = headers.get(
            self.HEADER_NAME.lower().encode(),
            str(uuid.uuid4()).encode()
        ).decode()

        set_correlation_id(correlation_id)

        span = trace.get_current_span()
        if span.is_recording():
            span.set_attribute("correlation_id", correlation_id)

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                headers.append(
                    (self.HEADER_NAME.lower().encode(), correlation_id.encode())
                )
                message["headers"] = headers
            await send(message)

        await self.app(scope, receive, send_wrapper)

def propagate_correlation(func: Callable) -> Callable:
    """Decorator to propagate correlation ID to async tasks."""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        correlation_id = get_correlation_id()
        if correlation_id:
            set_correlation_id(correlation_id)
        return await func(*args, **kwargs)
    return wrapper

class CorrelatedHttpClient:
    """HTTP client that propagates correlation ID."""

    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = None

    async def request(
        self,
        method: str,
        path: str,
        **kwargs
    ) -> dict:
        headers = kwargs.pop("headers", {})

        correlation_id = get_correlation_id()
        if correlation_id:
            headers["X-Correlation-ID"] = correlation_id

        inject(headers)

        if self.session is None:
            self.session = aiohttp.ClientSession()

        async with self.session.request(
            method,
            f"{self.base_url}{path}",
            headers=headers,
            **kwargs
        ) as response:
            return await response.json()

    async def get(self, path: str, **kwargs) -> dict:
        return await self.request("GET", path, **kwargs)

    async def post(self, path: str, **kwargs) -> dict:
        return await self.request("POST", path, **kwargs)
```

**TypeScript middleware**:

```typescript
// src/middleware/correlation.ts
import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
import { v4 as uuidv4 } from 'uuid';
import { trace, context } from '@opentelemetry/api';
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

interface CorrelationContext {
  correlationId: string;
  requestId: string;
}

const correlationStorage = new AsyncLocalStorage<CorrelationContext>();

export function getCorrelationId(): string | undefined {
  return correlationStorage.getStore()?.correlationId;
}

export function getRequestId(): string | undefined {
  return correlationStorage.getStore()?.requestId;
}

export function correlationMiddleware(req: Request, res: Response, next: NextFunction): void {
  const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();

  const correlationContext: CorrelationContext = {
    correlationId,
    requestId,
  };

  const span = trace.getSpan(context.active());
  if (span) {
    span.setAttribute('correlation_id', correlationId);
    span.setAttribute('request_id', requestId);
  }

  res.setHeader('X-Correlation-ID', correlationId);
  res.setHeader('X-Request-ID', requestId);

  correlationStorage.run(correlationContext, () => {
    next();
  });
}

export function createCorrelatedAxiosClient(baseURL: string): AxiosInstance {
  const client = axios.create({ baseURL });

  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const correlationId = getCorrelationId();
    const requestId = getRequestId();

    if (correlationId) {
      config.headers.set('X-Correlation-ID', correlationId);
    }
    if (requestId) {
      config.headers.set('X-Request-ID', requestId);
    }

    return config;
  });

  return client;
}

export function withCorrelation<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    const store = correlationStorage.getStore();
    if (store) {
      return correlationStorage.run(store, () => fn(...args));
    }
    return fn(...args);
  }) as T;
}
```

### Request Context Propagation

**Python context manager**:

```python
# src/observability/context.py
from contextvars import ContextVar
from dataclasses import dataclass, field
from typing import Any, Dict, Optional
import uuid

@dataclass
class RequestContext:
    """Request context for observability."""
    request_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    correlation_id: Optional[str] = None
    trace_id: Optional[str] = None
    span_id: Optional[str] = None
    user_id: Optional[str] = None
    tenant_id: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert context to dictionary."""
        result = {
            "request_id": self.request_id,
        }
        if self.correlation_id:
            result["correlation_id"] = self.correlation_id
        if self.trace_id:
            result["trace_id"] = self.trace_id
        if self.span_id:
            result["span_id"] = self.span_id
        if self.user_id:
            result["user_id"] = self.user_id
        if self.tenant_id:
            result["tenant_id"] = self.tenant_id
        if self.metadata:
            result["metadata"] = self.metadata
        return result

    def to_headers(self) -> Dict[str, str]:
        """Convert context to HTTP headers."""
        headers = {
            "X-Request-ID": self.request_id,
        }
        if self.correlation_id:
            headers["X-Correlation-ID"] = self.correlation_id
        if self.user_id:
            headers["X-User-ID"] = self.user_id
        if self.tenant_id:
            headers["X-Tenant-ID"] = self.tenant_id
        return headers

_request_context: ContextVar[Optional[RequestContext]] = ContextVar(
    "request_context", default=None
)

def get_request_context() -> Optional[RequestContext]:
    """Get current request context."""
    return _request_context.get()

def set_request_context(context: RequestContext) -> None:
    """Set request context."""
    _request_context.set(context)

class RequestContextManager:
    """Context manager for request context."""

    def __init__(self, context: RequestContext):
        self.context = context
        self.token = None

    def __enter__(self) -> RequestContext:
        self.token = _request_context.set(self.context)
        return self.context

    def __exit__(self, *args):
        _request_context.reset(self.token)

def extract_context_from_request(request) -> RequestContext:
    """Extract request context from HTTP request."""
    from opentelemetry import trace

    span = trace.get_current_span()
    span_context = span.get_span_context() if span.is_recording() else None

    return RequestContext(
        request_id=request.headers.get("X-Request-ID", str(uuid.uuid4())),
        correlation_id=request.headers.get("X-Correlation-ID"),
        trace_id=format(span_context.trace_id, "032x") if span_context else None,
        span_id=format(span_context.span_id, "016x") if span_context else None,
        user_id=getattr(request, "user_id", None),
        tenant_id=request.headers.get("X-Tenant-ID"),
    )
```

---

## Error Tracking

### Sentry Integration (Python)

**Installation**:

```bash
pip install sentry-sdk[flask]
```

**Configuration**:

```python
# src/observability/sentry.py
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.celery import CeleryIntegration
from sentry_sdk.integrations.redis import RedisIntegration

def configure_sentry(
    dsn: str,
    environment: str,
    release: str,
    sample_rate: float = 1.0,
    traces_sample_rate: float = 0.1,
):
    """Configure Sentry error tracking."""
    sentry_sdk.init(
        dsn=dsn,
        environment=environment,
        release=release,
        sample_rate=sample_rate,
        traces_sample_rate=traces_sample_rate,
        integrations=[
            FlaskIntegration(),
            SqlalchemyIntegration(),
            CeleryIntegration(),
            RedisIntegration(),
        ],
        before_send=before_send,
        before_breadcrumb=before_breadcrumb,
        send_default_pii=False,
        attach_stacktrace=True,
        max_breadcrumbs=50,
    )

def before_send(event, hint):
    """Filter or modify events before sending to Sentry."""
    if "exc_info" in hint:
        exc_type, exc_value, tb = hint["exc_info"]

        if isinstance(exc_value, (ValidationError, AuthenticationError)):
            return None

        if isinstance(exc_value, HTTPException) and exc_value.code < 500:
            return None

    if event.get("request", {}).get("url", "").endswith("/health"):
        return None

    from .context import get_request_context
    ctx = get_request_context()
    if ctx:
        event.setdefault("tags", {}).update({
            "correlation_id": ctx.correlation_id,
            "tenant_id": ctx.tenant_id,
        })
        event.setdefault("extra", {}).update(ctx.to_dict())

    return event

def before_breadcrumb(crumb, hint):
    """Filter breadcrumbs."""
    if crumb.get("category") == "http" and "/health" in crumb.get("data", {}).get("url", ""):
        return None
    return crumb

def capture_exception_with_context(error: Exception, **extra):
    """Capture exception with additional context."""
    from .context import get_request_context

    with sentry_sdk.push_scope() as scope:
        ctx = get_request_context()
        if ctx:
            scope.set_tag("correlation_id", ctx.correlation_id)
            scope.set_tag("request_id", ctx.request_id)
            if ctx.user_id:
                scope.set_user({"id": ctx.user_id})

        for key, value in extra.items():
            scope.set_extra(key, value)

        sentry_sdk.capture_exception(error)
```

### Sentry Integration (TypeScript)

**Installation**:

```bash
npm install @sentry/node @sentry/tracing
```

**Configuration**:

```typescript
// src/observability/sentry.ts
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { Express } from 'express';
import { getCorrelationId, getRequestId } from './correlation';

interface SentryConfig {
  dsn: string;
  environment: string;
  release: string;
  sampleRate?: number;
  tracesSampleRate?: number;
}

export function configureSentry(app: Express, config: SentryConfig): void {
  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release,
    sampleRate: config.sampleRate ?? 1.0,
    tracesSampleRate: config.tracesSampleRate ?? 0.1,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      new ProfilingIntegration(),
    ],
    profilesSampleRate: 0.1,
    beforeSend: (event, hint) => beforeSend(event, hint),
    beforeBreadcrumb: (breadcrumb) => beforeBreadcrumb(breadcrumb),
    sendDefaultPii: false,
    attachStacktrace: true,
    maxBreadcrumbs: 50,
  });

  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

function beforeSend(
  event: Sentry.Event,
  hint: Sentry.EventHint
): Sentry.Event | null {
  const error = hint.originalException;

  if (error instanceof ValidationError || error instanceof AuthenticationError) {
    return null;
  }

  if (error instanceof HttpError && error.statusCode < 500) {
    return null;
  }

  if (event.request?.url?.endsWith('/health')) {
    return null;
  }

  const correlationId = getCorrelationId();
  const requestId = getRequestId();

  if (correlationId || requestId) {
    event.tags = {
      ...event.tags,
      correlation_id: correlationId,
      request_id: requestId,
    };
  }

  return event;
}

function beforeBreadcrumb(breadcrumb: Sentry.Breadcrumb): Sentry.Breadcrumb | null {
  if (
    breadcrumb.category === 'http' &&
    breadcrumb.data?.url?.includes('/health')
  ) {
    return null;
  }
  return breadcrumb;
}

export function captureExceptionWithContext(
  error: Error,
  extra: Record<string, unknown> = {}
): void {
  Sentry.withScope((scope) => {
    const correlationId = getCorrelationId();
    const requestId = getRequestId();

    if (correlationId) {
      scope.setTag('correlation_id', correlationId);
    }
    if (requestId) {
      scope.setTag('request_id', requestId);
    }

    Object.entries(extra).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });

    Sentry.captureException(error);
  });
}

export const sentryErrorHandler = Sentry.Handlers.errorHandler();
```

---

## Metrics Integration

### Prometheus Metrics (Python)

**Installation**:

```bash
pip install prometheus-client
```

**Metrics configuration**:

```python
# src/observability/metrics.py
from prometheus_client import Counter, Histogram, Gauge, Info, CollectorRegistry
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from functools import wraps
import time

registry = CollectorRegistry()

REQUEST_COUNT = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status"],
    registry=registry,
)

REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency",
    ["method", "endpoint"],
    buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
    registry=registry,
)

ACTIVE_REQUESTS = Gauge(
    "http_requests_active",
    "Active HTTP requests",
    ["method"],
    registry=registry,
)

DB_QUERY_LATENCY = Histogram(
    "db_query_duration_seconds",
    "Database query latency",
    ["operation", "table"],
    buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0],
    registry=registry,
)

CACHE_OPERATIONS = Counter(
    "cache_operations_total",
    "Cache operations",
    ["operation", "result"],
    registry=registry,
)

ERROR_COUNT = Counter(
    "errors_total",
    "Total errors",
    ["type", "service"],
    registry=registry,
)

SERVICE_INFO = Info(
    "service",
    "Service information",
    registry=registry,
)

def set_service_info(name: str, version: str, environment: str):
    """Set service information."""
    SERVICE_INFO.info({
        "name": name,
        "version": version,
        "environment": environment,
    })

def track_request_metrics(method: str, endpoint: str):
    """Decorator to track request metrics."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            ACTIVE_REQUESTS.labels(method=method).inc()
            start_time = time.time()

            try:
                result = await func(*args, **kwargs)
                status = getattr(result, "status_code", 200)
                REQUEST_COUNT.labels(
                    method=method,
                    endpoint=endpoint,
                    status=status,
                ).inc()
                return result

            except Exception as e:
                REQUEST_COUNT.labels(
                    method=method,
                    endpoint=endpoint,
                    status=500,
                ).inc()
                ERROR_COUNT.labels(
                    type=type(e).__name__,
                    service="api",
                ).inc()
                raise

            finally:
                duration = time.time() - start_time
                REQUEST_LATENCY.labels(
                    method=method,
                    endpoint=endpoint,
                ).observe(duration)
                ACTIVE_REQUESTS.labels(method=method).dec()

        return wrapper
    return decorator

def track_db_query(operation: str, table: str):
    """Context manager to track database query metrics."""
    class QueryTimer:
        def __enter__(self):
            self.start_time = time.time()
            return self

        def __exit__(self, *args):
            duration = time.time() - self.start_time
            DB_QUERY_LATENCY.labels(
                operation=operation,
                table=table,
            ).observe(duration)

    return QueryTimer()

def track_cache_operation(operation: str, hit: bool):
    """Track cache operation."""
    CACHE_OPERATIONS.labels(
        operation=operation,
        result="hit" if hit else "miss",
    ).inc()

def get_metrics():
    """Get metrics in Prometheus format."""
    return generate_latest(registry), CONTENT_TYPE_LATEST
```

---

## CI/CD Integration

### GitHub Actions Observability Validation

```yaml
name: Observability Validation

on:
  push:
    paths:
      - 'src/observability/**'
      - 'src/middleware/**'
  pull_request:
    paths:
      - 'src/observability/**'
      - 'src/middleware/**'

jobs:
  validate-observability:
    runs-on: ubuntu-latest

    services:
      jaeger:
        image: jaegertracing/all-in-one:latest
        ports:
          - 6831:6831/udp
          - 16686:16686
          - 4317:4317

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: pip install -e .[observability,test]

      - name: Validate tracing configuration
        env:
          OTLP_ENDPOINT: localhost:4317
        run: |
          python -c "
          from src.observability.tracing import configure_tracer
          tracer = configure_tracer('test-service', '1.0.0')
          print('Tracing configuration valid')
          "

      - name: Validate logging configuration
        run: |
          python -c "
          from src.observability.logging import configure_logging
          logger = configure_logging(level='DEBUG', json_format=True)
          logger.info('test_event', key='value')
          print('Logging configuration valid')
          "

      - name: Run observability tests
        run: pytest tests/observability/ -v

      - name: Check log format compliance
        run: |
          python scripts/validate_log_format.py

  validate-metrics:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: pip install -e .[observability,test]

      - name: Validate metrics endpoint
        run: |
          python -c "
          from src.observability.metrics import get_metrics, set_service_info
          set_service_info('test', '1.0.0', 'test')
          metrics, content_type = get_metrics()
          assert 'service_info' in metrics.decode()
          print('Metrics configuration valid')
          "
```

### Docker Compose for Local Observability

```yaml
# docker-compose.observability.yml
version: '3.8'

services:
  jaeger:
    image: jaegertracing/all-in-one:latest
    environment:
      COLLECTOR_OTLP_ENABLED: 'true'
    ports:
      - '6831:6831/udp'
      - '16686:16686'
      - '4317:4317'
      - '4318:4318'

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - '9090:9090'
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'

  grafana:
    image: grafana/grafana:latest
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
      GF_AUTH_ANONYMOUS_ENABLED: 'true'
    volumes:
      - ./grafana/provisioning:/etc/grafana/provisioning
    ports:
      - '3000:3000'
    depends_on:
      - prometheus
      - jaeger
      - loki

  loki:
    image: grafana/loki:latest
    ports:
      - '3100:3100'
    command: -config.file=/etc/loki/local-config.yaml

  promtail:
    image: grafana/promtail:latest
    volumes:
      - ./promtail-config.yml:/etc/promtail/config.yml
      - /var/log:/var/log
    command: -config.file=/etc/promtail/config.yml

  otel-collector:
    image: otel/opentelemetry-collector-contrib:latest
    volumes:
      - ./otel-collector-config.yml:/etc/otel-collector-config.yml
    command: ['--config=/etc/otel-collector-config.yml']
    ports:
      - '4317:4317'
      - '4318:4318'
      - '8888:8888'
```

---

## Best Practices

### Observability Checklist

```text
Distributed Tracing:
✅ Use OpenTelemetry for vendor-neutral instrumentation
✅ Propagate trace context across service boundaries
✅ Use semantic span naming conventions
✅ Set appropriate sampling rates per environment
✅ Add relevant attributes to spans
✅ Record exceptions with stack traces

Structured Logging:
✅ Use JSON format in production
✅ Include trace/span IDs in logs
✅ Follow consistent field naming
✅ Use appropriate log levels
✅ Include request context (correlation ID, user ID)
✅ Avoid logging sensitive data

Log Aggregation:
✅ Configure retention policies
✅ Create useful dashboards
✅ Set up alerting on error rates
✅ Index searchable fields
✅ Document query patterns

Correlation:
✅ Generate/propagate correlation IDs
✅ Link traces, logs, and metrics
✅ Include correlation in error reports
✅ Propagate context to async tasks
```

### Anti-Patterns to Avoid

```python
# DON'T: Log without context
logger.error("Something went wrong")

# DO: Include relevant context
logger.error(
    "order_creation_failed",
    order_id=order_id,
    user_id=user_id,
    error_type=type(e).__name__,
    error_message=str(e),
)

# DON'T: Create spans for trivial operations
with tracer.start_as_current_span("get_variable"):
    x = self.config.get("key")

# DO: Create spans for meaningful operations
with tracer.start_as_current_span("fetch_user_preferences"):
    prefs = await self.preferences_service.get(user_id)

# DON'T: Log sensitive data
logger.info("user_login", password=password, ssn=ssn)

# DO: Redact or omit sensitive data
logger.info("user_login", user_id=user.id, email=mask_email(user.email))

# DON'T: Use print statements
print(f"Processing order {order_id}")

# DO: Use structured logging
logger.info("processing_order", order_id=order_id)

# DON'T: Ignore errors silently
try:
    process_order(order)
except Exception:
    pass

# DO: Log and track errors
try:
    process_order(order)
except Exception as e:
    logger.error("order_processing_failed", order_id=order.id, exc_info=True)
    capture_exception_with_context(e, order_id=order.id)
    raise
```

---

## Resources

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Structlog Documentation](https://www.structlog.org/)
- [Pino Documentation](https://getpino.io/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [Grafana Loki Documentation](https://grafana.com/docs/loki/)
- [ELK Stack Documentation](https://www.elastic.co/guide/)
- [AWS CloudWatch Logs](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/)
- [Sentry Documentation](https://docs.sentry.io/)

---

**Next Steps:**

- Review [Testing Strategies](testing_strategies.md) for observability testing
- See [Security Scanning Guide](security_scanning_guide.md) for log security
- Check [GitHub Actions Guide](github_actions_guide.md) for CI/CD observability
