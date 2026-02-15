---
title: "Environment Configuration Guide"
description: "Comprehensive guide to multi-environment configuration management, environment variable handling, profile-based configuration, safe environment switching, and configuration validation"
author: "Tyler Dukes"
tags: [configuration, environment, env-vars, profiles, dotenv, config-management, twelve-factor]
category: "CI/CD"
status: "active"
search_keywords: [environment, configuration, env vars, secrets, staging, production, dev]
---

## Introduction

This guide provides comprehensive standards for managing application configuration across multiple environments.
It covers environment variable handling, profile-based configuration, safe environment switching, and
configuration validation for robust deployment pipelines.

---

## Table of Contents

1. [Configuration Philosophy](#configuration-philosophy)
2. [Environment Variable Management](#environment-variable-management)
3. [Profile-Based Configuration](#profile-based-configuration)
4. [Safe Environment Switching](#safe-environment-switching)
5. [Configuration Validation](#configuration-validation)
6. [Secrets Management](#secrets-management)
7. [CI/CD Integration](#cicd-integration)
8. [Best Practices](#best-practices)

---

## Configuration Philosophy

### The Twelve-Factor App Principles

```text
┌─────────────────────────────────────────────────────────────┐
│                  Configuration Hierarchy                     │
├─────────────────────────────────────────────────────────────┤
│  Priority 1: Environment Variables (runtime)                │
│      ↓                                                      │
│  Priority 2: Secret Manager (vault, AWS Secrets)            │
│      ↓                                                      │
│  Priority 3: Environment-specific config files              │
│      ↓                                                      │
│  Priority 4: Default configuration                          │
└─────────────────────────────────────────────────────────────┘
```

**Key Principles**:

- **Store config in environment variables** - Never hardcode secrets or environment-specific values
- **Strict separation** - Config varies between deploys, code does not
- **Single codebase** - Same artifact deployed to all environments
- **Environment parity** - Keep dev, staging, and production as similar as possible

### Environment Taxonomy

```text
┌─────────────┬──────────────────────────────────────────────────┐
│ Environment │ Purpose                                          │
├─────────────┼──────────────────────────────────────────────────┤
│ local       │ Developer workstation, mocked services           │
│ development │ Shared dev environment, integrated services      │
│ test        │ Automated testing, ephemeral                     │
│ staging     │ Pre-production validation, prod-like             │
│ production  │ Live user traffic, highest availability          │
└─────────────┴──────────────────────────────────────────────────┘
```

---

## Environment Variable Management

### Python (Pydantic Settings)

**Project structure**:

```text
src/
├── config/
│   ├── __init__.py
│   ├── settings.py
│   ├── database.py
│   ├── cache.py
│   ├── logging.py
│   └── features.py
├── main.py
└── ...
.env.example
.env.local
.env.test
```

**Base settings module**:

```python
# src/config/settings.py
from enum import Enum
from functools import lru_cache
from typing import Any, Dict, List, Optional

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Environment(str, Enum):
    """Application environment types."""
    LOCAL = "local"
    DEVELOPMENT = "development"
    TEST = "test"
    STAGING = "staging"
    PRODUCTION = "production"

class Settings(BaseSettings):
    """Application settings with environment variable support."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_nested_delimiter="__",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = Field(default="myapp", description="Application name")
    app_version: str = Field(default="1.0.0", description="Application version")
    environment: Environment = Field(
        default=Environment.LOCAL,
        description="Current environment"
    )
    debug: bool = Field(default=False, description="Debug mode")
    log_level: str = Field(default="INFO", description="Logging level")

    # Server
    host: str = Field(default="0.0.0.0", description="Server host")
    port: int = Field(default=8000, ge=1, le=65535, description="Server port")
    workers: int = Field(default=1, ge=1, description="Number of workers")

    # Security
    secret_key: str = Field(
        default="change-me-in-production",
        min_length=32,
        description="Secret key for signing"
    )
    allowed_hosts: List[str] = Field(
        default=["localhost", "127.0.0.1"],
        description="Allowed host headers"
    )
    cors_origins: List[str] = Field(
        default=["http://localhost:3000"],
        description="CORS allowed origins"
    )

    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        """Validate log level is valid."""
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        upper_v = v.upper()
        if upper_v not in valid_levels:
            raise ValueError(f"log_level must be one of {valid_levels}")
        return upper_v

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        """Validate settings for production environment."""
        if self.environment == Environment.PRODUCTION:
            if self.debug:
                raise ValueError("Debug mode must be disabled in production")
            if self.secret_key == "change-me-in-production":
                raise ValueError("Default secret_key cannot be used in production")
            if "*" in self.cors_origins:
                raise ValueError("Wildcard CORS origin not allowed in production")
        return self

    @property
    def is_production(self) -> bool:
        """Check if running in production."""
        return self.environment == Environment.PRODUCTION

    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.environment in (Environment.LOCAL, Environment.DEVELOPMENT)

@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
```

**Database settings**:

```python
# src/config/database.py
from typing import Optional

from pydantic import Field, PostgresDsn, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class DatabaseSettings(BaseSettings):
    """Database configuration settings."""

    model_config = SettingsConfigDict(
        env_prefix="DATABASE_",
        env_file=".env",
        extra="ignore",
    )

    # Connection
    url: Optional[PostgresDsn] = Field(
        default=None,
        description="Full database URL (overrides individual settings)"
    )
    host: str = Field(default="localhost", description="Database host")
    port: int = Field(default=5432, ge=1, le=65535, description="Database port")
    name: str = Field(default="app", description="Database name")
    user: str = Field(default="postgres", description="Database user")
    password: str = Field(default="", description="Database password")

    # Connection pool
    pool_size: int = Field(default=5, ge=1, le=100, description="Connection pool size")
    max_overflow: int = Field(default=10, ge=0, description="Max overflow connections")
    pool_timeout: int = Field(default=30, ge=1, description="Pool timeout in seconds")
    pool_recycle: int = Field(default=1800, ge=0, description="Connection recycle time")

    # SSL
    ssl_mode: str = Field(default="prefer", description="SSL mode")
    ssl_ca_cert: Optional[str] = Field(default=None, description="SSL CA certificate path")

    @field_validator("ssl_mode")
    @classmethod
    def validate_ssl_mode(cls, v: str) -> str:
        """Validate SSL mode."""
        valid_modes = ["disable", "allow", "prefer", "require", "verify-ca", "verify-full"]
        if v not in valid_modes:
            raise ValueError(f"ssl_mode must be one of {valid_modes}")
        return v

    @property
    def connection_url(self) -> str:
        """Get database connection URL."""
        if self.url:
            return str(self.url)
        return (
            f"postgresql://{self.user}:{self.password}"
            f"@{self.host}:{self.port}/{self.name}"
            f"?sslmode={self.ssl_mode}"
        )

    @property
    def async_connection_url(self) -> str:
        """Get async database connection URL."""
        return self.connection_url.replace("postgresql://", "postgresql+asyncpg://")
```

**Cache settings**:

```python
# src/config/cache.py
from enum import Enum
from typing import Optional

from pydantic import Field, RedisDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class CacheBackend(str, Enum):
    """Cache backend types."""
    MEMORY = "memory"
    REDIS = "redis"
    MEMCACHED = "memcached"

class CacheSettings(BaseSettings):
    """Cache configuration settings."""

    model_config = SettingsConfigDict(
        env_prefix="CACHE_",
        env_file=".env",
        extra="ignore",
    )

    # Backend
    backend: CacheBackend = Field(
        default=CacheBackend.MEMORY,
        description="Cache backend type"
    )

    # Redis
    redis_url: Optional[RedisDsn] = Field(
        default=None,
        description="Redis connection URL"
    )
    redis_host: str = Field(default="localhost", description="Redis host")
    redis_port: int = Field(default=6379, ge=1, le=65535, description="Redis port")
    redis_db: int = Field(default=0, ge=0, le=15, description="Redis database number")
    redis_password: Optional[str] = Field(default=None, description="Redis password")

    # Settings
    default_ttl: int = Field(default=300, ge=0, description="Default TTL in seconds")
    key_prefix: str = Field(default="app:", description="Cache key prefix")
    max_connections: int = Field(default=10, ge=1, description="Max connections")

    @property
    def redis_connection_url(self) -> str:
        """Get Redis connection URL."""
        if self.redis_url:
            return str(self.redis_url)
        auth = f":{self.redis_password}@" if self.redis_password else ""
        return f"redis://{auth}{self.redis_host}:{self.redis_port}/{self.redis_db}"
```

**Feature flags**:

```python
# src/config/features.py
from typing import Dict, Set

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class FeatureFlags(BaseSettings):
    """Feature flag configuration."""

    model_config = SettingsConfigDict(
        env_prefix="FEATURE_",
        env_file=".env",
        extra="ignore",
    )

    # Feature toggles
    enable_new_dashboard: bool = Field(default=False, description="Enable new dashboard UI")
    enable_dark_mode: bool = Field(default=True, description="Enable dark mode option")
    enable_api_v2: bool = Field(default=False, description="Enable API v2 endpoints")
    enable_webhooks: bool = Field(default=False, description="Enable webhook functionality")
    enable_export: bool = Field(default=True, description="Enable data export feature")

    # Rollout percentages
    new_checkout_rollout: int = Field(
        default=0,
        ge=0,
        le=100,
        description="New checkout percentage rollout"
    )

    # Beta users
    beta_users: Set[str] = Field(
        default_factory=set,
        description="User IDs with beta access"
    )

    def is_enabled(self, feature: str, user_id: str = None) -> bool:
        """Check if a feature is enabled for a user."""
        feature_attr = f"enable_{feature}"
        if hasattr(self, feature_attr):
            return getattr(self, feature_attr)

        if user_id and user_id in self.beta_users:
            return True

        return False

    def get_all_flags(self) -> Dict[str, bool]:
        """Get all feature flags as a dictionary."""
        return {
            key: value
            for key, value in self.model_dump().items()
            if key.startswith("enable_")
        }
```

**Configuration loader**:

```python
# src/config/__init__.py
from functools import lru_cache
from typing import Optional

from .settings import Environment, Settings, get_settings
from .database import DatabaseSettings
from .cache import CacheSettings
from .features import FeatureFlags

class Config:
    """Unified configuration container."""

    def __init__(
        self,
        env_file: Optional[str] = None,
        environment: Optional[Environment] = None
    ):
        self._env_file = env_file
        self._environment = environment
        self._settings: Optional[Settings] = None
        self._database: Optional[DatabaseSettings] = None
        self._cache: Optional[CacheSettings] = None
        self._features: Optional[FeatureFlags] = None

    @property
    def settings(self) -> Settings:
        """Get application settings."""
        if self._settings is None:
            self._settings = Settings(_env_file=self._env_file)
            if self._environment:
                self._settings.environment = self._environment
        return self._settings

    @property
    def database(self) -> DatabaseSettings:
        """Get database settings."""
        if self._database is None:
            self._database = DatabaseSettings(_env_file=self._env_file)
        return self._database

    @property
    def cache(self) -> CacheSettings:
        """Get cache settings."""
        if self._cache is None:
            self._cache = CacheSettings(_env_file=self._env_file)
        return self._cache

    @property
    def features(self) -> FeatureFlags:
        """Get feature flags."""
        if self._features is None:
            self._features = FeatureFlags(_env_file=self._env_file)
        return self._features

    def reload(self) -> None:
        """Reload all configuration."""
        self._settings = None
        self._database = None
        self._cache = None
        self._features = None

@lru_cache
def get_config(env_file: Optional[str] = None) -> Config:
    """Get cached configuration instance."""
    return Config(env_file=env_file)

# Convenience exports
__all__ = [
    "Config",
    "Settings",
    "DatabaseSettings",
    "CacheSettings",
    "FeatureFlags",
    "Environment",
    "get_config",
    "get_settings",
]
```

**Environment files**:

```bash
# .env.example
# Application
APP_NAME=myapp
APP_VERSION=1.0.0
ENVIRONMENT=local
DEBUG=true
LOG_LEVEL=DEBUG

# Server
HOST=0.0.0.0
PORT=8000
WORKERS=1

# Security
SECRET_KEY=your-secret-key-at-least-32-characters-long
ALLOWED_HOSTS=["localhost", "127.0.0.1"]
CORS_ORIGINS=["http://localhost:3000"]

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=myapp_dev
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_POOL_SIZE=5
DATABASE_SSL_MODE=disable

# Cache
CACHE_BACKEND=memory
CACHE_REDIS_HOST=localhost
CACHE_REDIS_PORT=6379
CACHE_DEFAULT_TTL=300

# Features
FEATURE_ENABLE_NEW_DASHBOARD=false
FEATURE_ENABLE_DARK_MODE=true
FEATURE_ENABLE_API_V2=false
```

```bash
# .env.local
ENVIRONMENT=local
DEBUG=true
LOG_LEVEL=DEBUG
DATABASE_HOST=localhost
DATABASE_NAME=myapp_local
CACHE_BACKEND=memory
```

```bash
# .env.test
ENVIRONMENT=test
DEBUG=false
LOG_LEVEL=WARNING
DATABASE_HOST=localhost
DATABASE_NAME=myapp_test
CACHE_BACKEND=memory
FEATURE_ENABLE_API_V2=true
```

### TypeScript (dotenv + zod)

**Project structure**:

```text
src/
├── config/
│   ├── index.ts
│   ├── env.ts
│   ├── database.ts
│   ├── cache.ts
│   └── features.ts
├── main.ts
└── ...
.env.example
.env.local
.env.test
```

**Environment schema**:

```typescript
// src/config/env.ts
import { z } from 'zod';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment-specific .env file
const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });
dotenv.config(); // Load default .env as fallback

export const EnvironmentEnum = z.enum([
  'local',
  'development',
  'test',
  'staging',
  'production',
]);

export type Environment = z.infer<typeof EnvironmentEnum>;

const envSchema = z.object({
  // Application
  APP_NAME: z.string().default('myapp'),
  APP_VERSION: z.string().default('1.0.0'),
  NODE_ENV: EnvironmentEnum.default('local'),
  DEBUG: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Server
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  // Security
  SECRET_KEY: z.string().min(32),
  ALLOWED_HOSTS: z
    .string()
    .transform((v) => JSON.parse(v) as string[])
    .default('["localhost"]'),
  CORS_ORIGINS: z
    .string()
    .transform((v) => JSON.parse(v) as string[])
    .default('["http://localhost:3000"]'),
});

export type EnvConfig = z.infer<typeof envSchema>;

function validateEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid environment variables:');
    console.error(result.error.format());
    throw new Error('Invalid environment configuration');
  }

  // Production-specific validations
  if (result.data.NODE_ENV === 'production') {
    if (result.data.DEBUG) {
      throw new Error('DEBUG must be false in production');
    }
    if (result.data.CORS_ORIGINS.includes('*')) {
      throw new Error('Wildcard CORS origin not allowed in production');
    }
  }

  return result.data;
}

export const env = validateEnv();
```

**Database configuration**:

```typescript
// src/config/database.ts
import { z } from 'zod';

const databaseSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  DATABASE_HOST: z.string().default('localhost'),
  DATABASE_PORT: z.coerce.number().int().min(1).max(65535).default(5432),
  DATABASE_NAME: z.string().default('app'),
  DATABASE_USER: z.string().default('postgres'),
  DATABASE_PASSWORD: z.string().default(''),
  DATABASE_POOL_SIZE: z.coerce.number().int().min(1).max(100).default(5),
  DATABASE_SSL: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
});

export type DatabaseConfig = z.infer<typeof databaseSchema>;

function validateDatabaseConfig(): DatabaseConfig {
  const result = databaseSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid database configuration:');
    console.error(result.error.format());
    throw new Error('Invalid database configuration');
  }

  return result.data;
}

export const databaseConfig = validateDatabaseConfig();

export function getDatabaseUrl(): string {
  if (databaseConfig.DATABASE_URL) {
    return databaseConfig.DATABASE_URL;
  }

  const { DATABASE_HOST, DATABASE_PORT, DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD } =
    databaseConfig;

  return `postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}`;
}
```

**Cache configuration**:

```typescript
// src/config/cache.ts
import { z } from 'zod';

const CacheBackendEnum = z.enum(['memory', 'redis', 'memcached']);

const cacheSchema = z.object({
  CACHE_BACKEND: CacheBackendEnum.default('memory'),
  CACHE_REDIS_URL: z.string().url().optional(),
  CACHE_REDIS_HOST: z.string().default('localhost'),
  CACHE_REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),
  CACHE_REDIS_PASSWORD: z.string().optional(),
  CACHE_DEFAULT_TTL: z.coerce.number().int().min(0).default(300),
  CACHE_KEY_PREFIX: z.string().default('app:'),
});

export type CacheConfig = z.infer<typeof cacheSchema>;
export type CacheBackend = z.infer<typeof CacheBackendEnum>;

function validateCacheConfig(): CacheConfig {
  const result = cacheSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid cache configuration:');
    console.error(result.error.format());
    throw new Error('Invalid cache configuration');
  }

  return result.data;
}

export const cacheConfig = validateCacheConfig();

export function getRedisUrl(): string {
  if (cacheConfig.CACHE_REDIS_URL) {
    return cacheConfig.CACHE_REDIS_URL;
  }

  const { CACHE_REDIS_HOST, CACHE_REDIS_PORT, CACHE_REDIS_PASSWORD } = cacheConfig;
  const auth = CACHE_REDIS_PASSWORD ? `:${CACHE_REDIS_PASSWORD}@` : '';

  return `redis://${auth}${CACHE_REDIS_HOST}:${CACHE_REDIS_PORT}`;
}
```

**Feature flags**:

```typescript
// src/config/features.ts
import { z } from 'zod';

const featuresSchema = z.object({
  FEATURE_ENABLE_NEW_DASHBOARD: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
  FEATURE_ENABLE_DARK_MODE: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
  FEATURE_ENABLE_API_V2: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
  FEATURE_ENABLE_WEBHOOKS: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
  FEATURE_NEW_CHECKOUT_ROLLOUT: z.coerce.number().int().min(0).max(100).default(0),
  FEATURE_BETA_USERS: z
    .string()
    .transform((v) => (v ? v.split(',') : []))
    .default(''),
});

export type FeaturesConfig = z.infer<typeof featuresSchema>;

function validateFeaturesConfig(): FeaturesConfig {
  const result = featuresSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid features configuration:');
    console.error(result.error.format());
    throw new Error('Invalid features configuration');
  }

  return result.data;
}

export const featuresConfig = validateFeaturesConfig();

export function isFeatureEnabled(feature: string, userId?: string): boolean {
  const featureKey = `FEATURE_ENABLE_${feature.toUpperCase()}` as keyof FeaturesConfig;

  if (featureKey in featuresConfig) {
    return Boolean(featuresConfig[featureKey]);
  }

  if (userId && featuresConfig.FEATURE_BETA_USERS.includes(userId)) {
    return true;
  }

  return false;
}

export function getAllFeatureFlags(): Record<string, boolean> {
  return {
    newDashboard: featuresConfig.FEATURE_ENABLE_NEW_DASHBOARD,
    darkMode: featuresConfig.FEATURE_ENABLE_DARK_MODE,
    apiV2: featuresConfig.FEATURE_ENABLE_API_V2,
    webhooks: featuresConfig.FEATURE_ENABLE_WEBHOOKS,
  };
}
```

**Unified configuration**:

```typescript
// src/config/index.ts
import { env, Environment, EnvironmentEnum } from './env';
import { databaseConfig, getDatabaseUrl } from './database';
import { cacheConfig, getRedisUrl, CacheBackend } from './cache';
import { featuresConfig, isFeatureEnabled, getAllFeatureFlags } from './features';

export interface Config {
  app: {
    name: string;
    version: string;
    environment: Environment;
    debug: boolean;
    logLevel: string;
  };
  server: {
    host: string;
    port: number;
  };
  security: {
    secretKey: string;
    allowedHosts: string[];
    corsOrigins: string[];
  };
  database: {
    url: string;
    poolSize: number;
    ssl: boolean;
  };
  cache: {
    backend: CacheBackend;
    redisUrl: string;
    defaultTtl: number;
    keyPrefix: string;
  };
  features: ReturnType<typeof getAllFeatureFlags>;
}

export function getConfig(): Config {
  return {
    app: {
      name: env.APP_NAME,
      version: env.APP_VERSION,
      environment: env.NODE_ENV,
      debug: env.DEBUG,
      logLevel: env.LOG_LEVEL,
    },
    server: {
      host: env.HOST,
      port: env.PORT,
    },
    security: {
      secretKey: env.SECRET_KEY,
      allowedHosts: env.ALLOWED_HOSTS,
      corsOrigins: env.CORS_ORIGINS,
    },
    database: {
      url: getDatabaseUrl(),
      poolSize: databaseConfig.DATABASE_POOL_SIZE,
      ssl: databaseConfig.DATABASE_SSL,
    },
    cache: {
      backend: cacheConfig.CACHE_BACKEND,
      redisUrl: getRedisUrl(),
      defaultTtl: cacheConfig.CACHE_DEFAULT_TTL,
      keyPrefix: cacheConfig.CACHE_KEY_PREFIX,
    },
    features: getAllFeatureFlags(),
  };
}

export const config = getConfig();

export function isProduction(): boolean {
  return env.NODE_ENV === 'production';
}

export function isDevelopment(): boolean {
  return env.NODE_ENV === 'local' || env.NODE_ENV === 'development';
}

export { env, databaseConfig, cacheConfig, featuresConfig, isFeatureEnabled };
```

---

## Profile-Based Configuration

### Python Profile System

**Profile loader**:

```python
# src/config/profiles.py
import os
from pathlib import Path
from typing import Any, Dict, Optional

import yaml

class ConfigProfile:
    """Configuration profile loader."""

    def __init__(self, base_path: Optional[Path] = None):
        self.base_path = base_path or Path("config")
        self._profiles: Dict[str, Dict[str, Any]] = {}
        self._active_profile: Optional[str] = None

    def load_profile(self, profile_name: str) -> Dict[str, Any]:
        """Load a configuration profile from YAML."""
        if profile_name in self._profiles:
            return self._profiles[profile_name]

        profile_path = self.base_path / f"{profile_name}.yaml"
        if not profile_path.exists():
            raise FileNotFoundError(f"Profile not found: {profile_path}")

        with open(profile_path) as f:
            config = yaml.safe_load(f)

        # Handle profile inheritance
        if "extends" in config:
            parent_name = config.pop("extends")
            parent_config = self.load_profile(parent_name)
            config = self._deep_merge(parent_config, config)

        self._profiles[profile_name] = config
        return config

    def activate(self, profile_name: str) -> Dict[str, Any]:
        """Activate a configuration profile."""
        config = self.load_profile(profile_name)
        self._active_profile = profile_name
        return config

    def get_active(self) -> Dict[str, Any]:
        """Get the active profile configuration."""
        if self._active_profile is None:
            raise RuntimeError("No profile is active")
        return self._profiles[self._active_profile]

    @staticmethod
    def _deep_merge(base: Dict[str, Any], override: Dict[str, Any]) -> Dict[str, Any]:
        """Deep merge two dictionaries."""
        result = base.copy()
        for key, value in override.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = ConfigProfile._deep_merge(result[key], value)
            else:
                result[key] = value
        return result

    @classmethod
    def from_environment(cls, env_var: str = "APP_PROFILE") -> "ConfigProfile":
        """Create profile loader and activate profile from environment."""
        loader = cls()
        profile_name = os.getenv(env_var, "local")
        loader.activate(profile_name)
        return loader
```

**Profile configuration files**:

```yaml
# config/base.yaml
app:
  name: myapp
  version: "1.0.0"

logging:
  level: INFO
  format: "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

database:
  pool_size: 5
  max_overflow: 10
  pool_timeout: 30

cache:
  backend: memory
  default_ttl: 300

features:
  new_dashboard: false
  dark_mode: true
  api_v2: false
```

```yaml
# config/local.yaml
extends: base

app:
  debug: true

logging:
  level: DEBUG

database:
  host: localhost
  port: 5432
  name: myapp_local
  user: postgres
  password: postgres

cache:
  backend: memory
```

```yaml
# config/development.yaml
extends: base

app:
  debug: true

logging:
  level: DEBUG

database:
  host: dev-db.internal
  port: 5432
  name: myapp_dev
  user: ${DATABASE_USER}
  password: ${DATABASE_PASSWORD}

cache:
  backend: redis
  redis:
    host: dev-redis.internal
    port: 6379

features:
  new_dashboard: true
  api_v2: true
```

```yaml
# config/staging.yaml
extends: base

app:
  debug: false

logging:
  level: INFO

database:
  host: staging-db.internal
  port: 5432
  name: myapp_staging
  user: ${DATABASE_USER}
  password: ${DATABASE_PASSWORD}
  ssl_mode: require

cache:
  backend: redis
  redis:
    host: staging-redis.internal
    port: 6379
    password: ${REDIS_PASSWORD}
```

```yaml
# config/production.yaml
extends: base

app:
  debug: false

logging:
  level: WARNING

database:
  host: ${DATABASE_HOST}
  port: 5432
  name: ${DATABASE_NAME}
  user: ${DATABASE_USER}
  password: ${DATABASE_PASSWORD}
  ssl_mode: verify-full
  pool_size: 20
  max_overflow: 30

cache:
  backend: redis
  redis:
    host: ${REDIS_HOST}
    port: 6379
    password: ${REDIS_PASSWORD}
    ssl: true

features:
  new_dashboard: false
  dark_mode: true
  api_v2: false
```

**Profile-aware settings**:

```python
# src/config/profile_settings.py
import os
import re
from typing import Any, Dict, Optional

from .profiles import ConfigProfile

class ProfileSettings:
    """Settings class that uses configuration profiles."""

    def __init__(self, profile_name: Optional[str] = None):
        self.profile_name = profile_name or os.getenv("APP_PROFILE", "local")
        self._loader = ConfigProfile()
        self._config = self._loader.activate(self.profile_name)
        self._config = self._expand_env_vars(self._config)

    def _expand_env_vars(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Expand environment variables in configuration values."""
        result = {}
        for key, value in config.items():
            if isinstance(value, dict):
                result[key] = self._expand_env_vars(value)
            elif isinstance(value, str):
                result[key] = self._expand_string(value)
            else:
                result[key] = value
        return result

    @staticmethod
    def _expand_string(value: str) -> str:
        """Expand environment variables in a string."""
        pattern = r"\$\{([^}]+)\}"
        def replacer(match):
            env_var = match.group(1)
            return os.getenv(env_var, match.group(0))
        return re.sub(pattern, replacer, value)

    def get(self, path: str, default: Any = None) -> Any:
        """Get a configuration value by dot-separated path."""
        keys = path.split(".")
        value = self._config
        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return default
        return value

    def __getattr__(self, name: str) -> Any:
        """Get top-level configuration section."""
        if name.startswith("_"):
            raise AttributeError(name)
        return self._config.get(name, {})

# Usage
settings = ProfileSettings()
print(settings.get("database.host"))
print(settings.database["pool_size"])
```

### TypeScript Profile System

**Profile loader**:

```typescript
// src/config/profiles.ts
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

interface ProfileConfig {
  extends?: string;
  [key: string]: unknown;
}

export class ConfigProfileLoader {
  private basePath: string;
  private profiles: Map<string, ProfileConfig> = new Map();
  private activeProfile: string | null = null;

  constructor(basePath = 'config') {
    this.basePath = basePath;
  }

  loadProfile(profileName: string): ProfileConfig {
    if (this.profiles.has(profileName)) {
      return this.profiles.get(profileName)!;
    }

    const profilePath = path.join(this.basePath, `${profileName}.yaml`);
    if (!fs.existsSync(profilePath)) {
      throw new Error(`Profile not found: ${profilePath}`);
    }

    const content = fs.readFileSync(profilePath, 'utf-8');
    let config = yaml.load(content) as ProfileConfig;

    // Handle profile inheritance
    if (config.extends) {
      const parentName = config.extends;
      delete config.extends;
      const parentConfig = this.loadProfile(parentName);
      config = this.deepMerge(parentConfig, config);
    }

    this.profiles.set(profileName, config);
    return config;
  }

  activate(profileName: string): ProfileConfig {
    const config = this.loadProfile(profileName);
    this.activeProfile = profileName;
    return this.expandEnvVars(config);
  }

  getActive(): ProfileConfig {
    if (!this.activeProfile) {
      throw new Error('No profile is active');
    }
    return this.profiles.get(this.activeProfile)!;
  }

  private deepMerge(base: ProfileConfig, override: ProfileConfig): ProfileConfig {
    const result = { ...base };

    for (const [key, value] of Object.entries(override)) {
      if (
        key in result &&
        typeof result[key] === 'object' &&
        result[key] !== null &&
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        result[key] = this.deepMerge(
          result[key] as ProfileConfig,
          value as ProfileConfig
        );
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  private expandEnvVars(config: ProfileConfig): ProfileConfig {
    const result: ProfileConfig = {};

    for (const [key, value] of Object.entries(config)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result[key] = this.expandEnvVars(value as ProfileConfig);
      } else if (typeof value === 'string') {
        result[key] = this.expandString(value);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  private expandString(value: string): string {
    return value.replace(/\$\{([^}]+)\}/g, (match, envVar) => {
      return process.env[envVar] ?? match;
    });
  }

  static fromEnvironment(envVar = 'APP_PROFILE'): ConfigProfileLoader {
    const loader = new ConfigProfileLoader();
    const profileName = process.env[envVar] || 'local';
    loader.activate(profileName);
    return loader;
  }
}

// Helper to get nested config values
export function getConfigValue<T>(
  config: ProfileConfig,
  path: string,
  defaultValue?: T
): T {
  const keys = path.split('.');
  let value: unknown = config;

  for (const key of keys) {
    if (typeof value === 'object' && value !== null && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return defaultValue as T;
    }
  }

  return value as T;
}
```

**Usage**:

```typescript
// src/main.ts
import { ConfigProfileLoader, getConfigValue } from './config/profiles';

const profileLoader = ConfigProfileLoader.fromEnvironment();
const config = profileLoader.getActive();

// Access configuration
const dbHost = getConfigValue<string>(config, 'database.host', 'localhost');
const poolSize = getConfigValue<number>(config, 'database.pool_size', 5);
const features = getConfigValue<Record<string, boolean>>(config, 'features', {});

console.log(`Database host: ${dbHost}`);
console.log(`Pool size: ${poolSize}`);
console.log(`Features:`, features);
```

---

## Safe Environment Switching

### Environment Switcher CLI (Python)

**CLI module**:

```python
# scripts/env_switch.py
#!/usr/bin/env python3
"""
Environment switching CLI with safety checks.
"""
import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path
from typing import List, Optional

# Environment definitions
ENVIRONMENTS = {
    "local": {
        "env_file": ".env.local",
        "requires_vpn": False,
        "database_prefix": "local_",
        "confirmation_required": False,
    },
    "development": {
        "env_file": ".env.development",
        "requires_vpn": True,
        "database_prefix": "dev_",
        "confirmation_required": False,
    },
    "staging": {
        "env_file": ".env.staging",
        "requires_vpn": True,
        "database_prefix": "staging_",
        "confirmation_required": True,
    },
    "production": {
        "env_file": ".env.production",
        "requires_vpn": True,
        "database_prefix": "prod_",
        "confirmation_required": True,
        "requires_mfa": True,
    },
}

class EnvironmentSwitcher:
    """Safe environment switching utility."""

    def __init__(self, project_root: Optional[Path] = None):
        self.project_root = project_root or Path.cwd()
        self.current_env_file = self.project_root / ".env"
        self.backup_dir = self.project_root / ".env.backups"

    def get_current_environment(self) -> Optional[str]:
        """Detect current active environment."""
        if not self.current_env_file.exists():
            return None

        with open(self.current_env_file) as f:
            for line in f:
                if line.startswith("ENVIRONMENT="):
                    return line.split("=")[1].strip().strip('"\'')
        return None

    def check_prerequisites(self, target_env: str) -> List[str]:
        """Check prerequisites for switching to target environment."""
        errors = []
        config = ENVIRONMENTS.get(target_env)

        if not config:
            errors.append(f"Unknown environment: {target_env}")
            return errors

        env_file = self.project_root / config["env_file"]
        if not env_file.exists():
            errors.append(f"Environment file not found: {env_file}")

        if config.get("requires_vpn"):
            if not self._check_vpn():
                errors.append(f"VPN connection required for {target_env}")

        if config.get("requires_mfa"):
            if not self._check_mfa():
                errors.append(f"MFA authentication required for {target_env}")

        return errors

    def switch(self, target_env: str, force: bool = False) -> bool:
        """Switch to target environment."""
        config = ENVIRONMENTS.get(target_env)
        if not config:
            print(f"Error: Unknown environment '{target_env}'")
            return False

        current_env = self.get_current_environment()

        # Safety checks
        errors = self.check_prerequisites(target_env)
        if errors and not force:
            print("Prerequisites not met:")
            for error in errors:
                print(f"  - {error}")
            return False

        # Confirmation for sensitive environments
        if config.get("confirmation_required") and not force:
            if not self._confirm_switch(current_env, target_env):
                print("Switch cancelled.")
                return False

        # Backup current environment
        if self.current_env_file.exists():
            self._backup_current_env(current_env)

        # Switch environment
        source_file = self.project_root / config["env_file"]
        shutil.copy(source_file, self.current_env_file)

        print(f"Switched from '{current_env or 'none'}' to '{target_env}'")
        self._show_environment_info(target_env)

        return True

    def _backup_current_env(self, env_name: Optional[str]) -> None:
        """Backup current environment file."""
        self.backup_dir.mkdir(exist_ok=True)
        timestamp = subprocess.check_output(
            ["date", "+%Y%m%d_%H%M%S"]
        ).decode().strip()
        backup_name = f".env.{env_name or 'unknown'}.{timestamp}"
        shutil.copy(self.current_env_file, self.backup_dir / backup_name)

    def _confirm_switch(self, current: Optional[str], target: str) -> bool:
        """Prompt for confirmation."""
        print(f"\n{'=' * 60}")
        print(f"WARNING: Switching to {target.upper()} environment")
        print(f"{'=' * 60}")
        print(f"Current environment: {current or 'none'}")
        print(f"Target environment:  {target}")
        print()

        response = input("Type the target environment name to confirm: ")
        return response.strip().lower() == target.lower()

    def _check_vpn(self) -> bool:
        """Check if VPN is connected."""
        try:
            result = subprocess.run(
                ["pgrep", "-x", "openvpn"],
                capture_output=True
            )
            return result.returncode == 0
        except Exception:
            return True

    def _check_mfa(self) -> bool:
        """Check if MFA is authenticated."""
        mfa_token = os.getenv("MFA_TOKEN")
        return bool(mfa_token)

    def _show_environment_info(self, env_name: str) -> None:
        """Display environment information."""
        config = ENVIRONMENTS[env_name]
        print(f"\nEnvironment: {env_name}")
        print(f"  Config file: {config['env_file']}")
        print(f"  VPN required: {config.get('requires_vpn', False)}")
        print(f"  MFA required: {config.get('requires_mfa', False)}")

    def list_environments(self) -> None:
        """List available environments."""
        current = self.get_current_environment()
        print("\nAvailable environments:")
        for env_name, config in ENVIRONMENTS.items():
            marker = " *" if env_name == current else ""
            status = "active" if env_name == current else ""
            print(f"  {env_name}{marker} {status}")
            print(f"    File: {config['env_file']}")

    def restore_backup(self, backup_name: str) -> bool:
        """Restore from a backup."""
        backup_file = self.backup_dir / backup_name
        if not backup_file.exists():
            print(f"Backup not found: {backup_file}")
            return False

        shutil.copy(backup_file, self.current_env_file)
        print(f"Restored from backup: {backup_name}")
        return True

    def list_backups(self) -> None:
        """List available backups."""
        if not self.backup_dir.exists():
            print("No backups found.")
            return

        backups = sorted(self.backup_dir.glob(".env.*"))
        if not backups:
            print("No backups found.")
            return

        print("\nAvailable backups:")
        for backup in backups:
            print(f"  {backup.name}")

def main():
    """CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Safely switch between environments"
    )
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Switch command
    switch_parser = subparsers.add_parser("switch", help="Switch environment")
    switch_parser.add_argument("environment", help="Target environment")
    switch_parser.add_argument(
        "--force", "-f",
        action="store_true",
        help="Force switch without checks"
    )

    # List command
    subparsers.add_parser("list", help="List environments")

    # Current command
    subparsers.add_parser("current", help="Show current environment")

    # Backup commands
    subparsers.add_parser("backups", help="List backups")
    restore_parser = subparsers.add_parser("restore", help="Restore backup")
    restore_parser.add_argument("backup_name", help="Backup file name")

    args = parser.parse_args()
    switcher = EnvironmentSwitcher()

    if args.command == "switch":
        success = switcher.switch(args.environment, force=args.force)
        sys.exit(0 if success else 1)
    elif args.command == "list":
        switcher.list_environments()
    elif args.command == "current":
        current = switcher.get_current_environment()
        print(f"Current environment: {current or 'none'}")
    elif args.command == "backups":
        switcher.list_backups()
    elif args.command == "restore":
        success = switcher.restore_backup(args.backup_name)
        sys.exit(0 if success else 1)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
```

**Run environment switcher**:

```bash
## List available environments
python scripts/env_switch.py list

## Show current environment
python scripts/env_switch.py current

## Switch to development
python scripts/env_switch.py switch development

## Switch to production (requires confirmation)
python scripts/env_switch.py switch production

## Force switch (skip checks)
python scripts/env_switch.py switch staging --force

## List backups
python scripts/env_switch.py backups

## Restore from backup
python scripts/env_switch.py restore .env.development.20240115_143022
```

### Makefile Environment Commands

```makefile
# Makefile
.PHONY: env-local env-dev env-staging env-prod env-list env-current

# Environment file management
ENV_FILE := .env
ENV_BACKUP_DIR := .env.backups

env-local:
 @echo "Switching to LOCAL environment..."
 @mkdir -p $(ENV_BACKUP_DIR)
 @if [ -f $(ENV_FILE) ]; then \
  cp $(ENV_FILE) $(ENV_BACKUP_DIR)/.env.$$(date +%Y%m%d_%H%M%S); \
 fi
 @cp .env.local $(ENV_FILE)
 @echo "Switched to LOCAL environment"

env-dev:
 @echo "Switching to DEVELOPMENT environment..."
 @mkdir -p $(ENV_BACKUP_DIR)
 @if [ -f $(ENV_FILE) ]; then \
  cp $(ENV_FILE) $(ENV_BACKUP_DIR)/.env.$$(date +%Y%m%d_%H%M%S); \
 fi
 @cp .env.development $(ENV_FILE)
 @echo "Switched to DEVELOPMENT environment"

env-staging:
 @echo "Switching to STAGING environment..."
 @echo "WARNING: This connects to staging infrastructure"
 @read -p "Continue? [y/N] " confirm && [ "$$confirm" = "y" ]
 @mkdir -p $(ENV_BACKUP_DIR)
 @if [ -f $(ENV_FILE) ]; then \
  cp $(ENV_FILE) $(ENV_BACKUP_DIR)/.env.$$(date +%Y%m%d_%H%M%S); \
 fi
 @cp .env.staging $(ENV_FILE)
 @echo "Switched to STAGING environment"

env-prod:
 @echo "=============================================="
 @echo "WARNING: SWITCHING TO PRODUCTION ENVIRONMENT"
 @echo "=============================================="
 @read -p "Type 'production' to confirm: " confirm && [ "$$confirm" = "production" ]
 @mkdir -p $(ENV_BACKUP_DIR)
 @if [ -f $(ENV_FILE) ]; then \
  cp $(ENV_FILE) $(ENV_BACKUP_DIR)/.env.$$(date +%Y%m%d_%H%M%S); \
 fi
 @cp .env.production $(ENV_FILE)
 @echo "Switched to PRODUCTION environment"

env-list:
 @echo "Available environments:"
 @ls -la .env.* 2>/dev/null | grep -v backups || echo "  No environment files found"
 @echo ""
 @echo "Current environment:"
 @if [ -f $(ENV_FILE) ]; then \
  grep "^ENVIRONMENT=" $(ENV_FILE) || echo "  ENVIRONMENT not set"; \
 else \
  echo "  No active environment"; \
 fi

env-current:
 @if [ -f $(ENV_FILE) ]; then \
  grep "^ENVIRONMENT=" $(ENV_FILE) | cut -d'=' -f2; \
 else \
  echo "none"; \
 fi

env-validate:
 @echo "Validating environment configuration..."
 @python -c "from src.config import get_config; c = get_config(); print('Configuration valid!')"
```

---

## Configuration Validation

### Python Validation

**Validation module**:

```python
# src/config/validation.py
import os
import re
from dataclasses import dataclass
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Set

class ValidationSeverity(Enum):
    """Validation message severity levels."""
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"

@dataclass
class ValidationMessage:
    """Validation result message."""
    severity: ValidationSeverity
    field: str
    message: str
    value: Optional[Any] = None

class ConfigValidator:
    """Configuration validator with customizable rules."""

    def __init__(self):
        self._rules: List[Callable[[Dict[str, Any]], List[ValidationMessage]]] = []
        self._register_default_rules()

    def _register_default_rules(self) -> None:
        """Register default validation rules."""
        self.add_rule(self._validate_required_fields)
        self.add_rule(self._validate_url_formats)
        self.add_rule(self._validate_port_ranges)
        self.add_rule(self._validate_production_settings)
        self.add_rule(self._validate_secrets)

    def add_rule(
        self,
        rule: Callable[[Dict[str, Any]], List[ValidationMessage]]
    ) -> None:
        """Add a validation rule."""
        self._rules.append(rule)

    def validate(self, config: Dict[str, Any]) -> List[ValidationMessage]:
        """Validate configuration and return messages."""
        messages = []
        for rule in self._rules:
            messages.extend(rule(config))
        return messages

    def validate_and_raise(self, config: Dict[str, Any]) -> None:
        """Validate and raise exception if errors found."""
        messages = self.validate(config)
        errors = [m for m in messages if m.severity == ValidationSeverity.ERROR]
        if errors:
            error_text = "\n".join(f"  - {m.field}: {m.message}" for m in errors)
            raise ValueError(f"Configuration validation failed:\n{error_text}")

    def _validate_required_fields(
        self,
        config: Dict[str, Any]
    ) -> List[ValidationMessage]:
        """Validate required fields are present."""
        messages = []
        required_fields = [
            "app.name",
            "app.environment",
            "security.secret_key",
        ]

        for field in required_fields:
            value = self._get_nested(config, field)
            if value is None or value == "":
                messages.append(ValidationMessage(
                    severity=ValidationSeverity.ERROR,
                    field=field,
                    message="Required field is missing or empty"
                ))

        return messages

    def _validate_url_formats(
        self,
        config: Dict[str, Any]
    ) -> List[ValidationMessage]:
        """Validate URL field formats."""
        messages = []
        url_pattern = re.compile(
            r"^(https?|postgresql|redis|mongodb)://[^\s]+$"
        )

        url_fields = ["database.url", "cache.redis_url", "api.base_url"]

        for field in url_fields:
            value = self._get_nested(config, field)
            if value and not url_pattern.match(str(value)):
                messages.append(ValidationMessage(
                    severity=ValidationSeverity.ERROR,
                    field=field,
                    message=f"Invalid URL format: {value}",
                    value=value
                ))

        return messages

    def _validate_port_ranges(
        self,
        config: Dict[str, Any]
    ) -> List[ValidationMessage]:
        """Validate port numbers are in valid range."""
        messages = []
        port_fields = ["server.port", "database.port", "cache.redis_port"]

        for field in port_fields:
            value = self._get_nested(config, field)
            if value is not None:
                try:
                    port = int(value)
                    if not (1 <= port <= 65535):
                        messages.append(ValidationMessage(
                            severity=ValidationSeverity.ERROR,
                            field=field,
                            message=f"Port must be between 1 and 65535: {port}",
                            value=port
                        ))
                except (ValueError, TypeError):
                    messages.append(ValidationMessage(
                        severity=ValidationSeverity.ERROR,
                        field=field,
                        message=f"Invalid port value: {value}",
                        value=value
                    ))

        return messages

    def _validate_production_settings(
        self,
        config: Dict[str, Any]
    ) -> List[ValidationMessage]:
        """Validate production-specific settings."""
        messages = []
        environment = self._get_nested(config, "app.environment")

        if environment != "production":
            return messages

        # Debug must be off
        if self._get_nested(config, "app.debug"):
            messages.append(ValidationMessage(
                severity=ValidationSeverity.ERROR,
                field="app.debug",
                message="Debug mode must be disabled in production"
            ))

        # CORS cannot be wildcard
        cors_origins = self._get_nested(config, "security.cors_origins") or []
        if "*" in cors_origins:
            messages.append(ValidationMessage(
                severity=ValidationSeverity.ERROR,
                field="security.cors_origins",
                message="Wildcard CORS origin not allowed in production"
            ))

        # SSL should be enabled
        if not self._get_nested(config, "database.ssl"):
            messages.append(ValidationMessage(
                severity=ValidationSeverity.WARNING,
                field="database.ssl",
                message="Database SSL should be enabled in production"
            ))

        return messages

    def _validate_secrets(
        self,
        config: Dict[str, Any]
    ) -> List[ValidationMessage]:
        """Validate secrets are not default values."""
        messages = []
        default_secrets = {
            "security.secret_key": [
                "change-me",
                "secret",
                "your-secret-key",
                "change-me-in-production",
            ],
            "database.password": ["password", "postgres", "admin", "root"],
        }

        environment = self._get_nested(config, "app.environment")

        for field, defaults in default_secrets.items():
            value = self._get_nested(config, field)
            if value and str(value).lower() in [d.lower() for d in defaults]:
                severity = (
                    ValidationSeverity.ERROR
                    if environment == "production"
                    else ValidationSeverity.WARNING
                )
                messages.append(ValidationMessage(
                    severity=severity,
                    field=field,
                    message="Using default/weak secret value"
                ))

        return messages

    @staticmethod
    def _get_nested(config: Dict[str, Any], path: str) -> Optional[Any]:
        """Get nested configuration value."""
        keys = path.split(".")
        value = config
        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return None
        return value

# Convenience function
def validate_config(config: Dict[str, Any]) -> List[ValidationMessage]:
    """Validate configuration using default validator."""
    validator = ConfigValidator()
    return validator.validate(config)
```

**CLI validation**:

```python
# scripts/validate_config.py
#!/usr/bin/env python3
"""
Validate configuration for all environments.
"""
import argparse
import sys
from pathlib import Path

from src.config import get_config
from src.config.validation import ConfigValidator, ValidationSeverity

def main():
    """CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Validate configuration"
    )
    parser.add_argument(
        "--env-file",
        help="Environment file to validate"
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Treat warnings as errors"
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Only output errors"
    )

    args = parser.parse_args()

    try:
        config = get_config(env_file=args.env_file)
        validator = ConfigValidator()
        messages = validator.validate(config.__dict__)

        errors = [m for m in messages if m.severity == ValidationSeverity.ERROR]
        warnings = [m for m in messages if m.severity == ValidationSeverity.WARNING]
        infos = [m for m in messages if m.severity == ValidationSeverity.INFO]

        if not args.quiet:
            for msg in infos:
                print(f"INFO: {msg.field}: {msg.message}")

        for msg in warnings:
            print(f"WARNING: {msg.field}: {msg.message}")

        for msg in errors:
            print(f"ERROR: {msg.field}: {msg.message}")

        # Summary
        print(f"\nValidation complete: {len(errors)} errors, {len(warnings)} warnings")

        if errors or (args.strict and warnings):
            sys.exit(1)

    except Exception as e:
        print(f"Validation failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
```

**Run validation**:

```bash
## Validate current configuration
python scripts/validate_config.py

## Validate specific environment
python scripts/validate_config.py --env-file .env.production

## Strict mode (warnings are errors)
python scripts/validate_config.py --strict

## Quiet mode (errors only)
python scripts/validate_config.py --quiet
```

### TypeScript Validation

**Validation module**:

```typescript
// src/config/validation.ts
import { z } from 'zod';

export enum ValidationSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

export interface ValidationMessage {
  severity: ValidationSeverity;
  field: string;
  message: string;
  value?: unknown;
}

export type ValidationRule = (config: Record<string, unknown>) => ValidationMessage[];

export class ConfigValidator {
  private rules: ValidationRule[] = [];

  constructor() {
    this.registerDefaultRules();
  }

  private registerDefaultRules(): void {
    this.addRule(this.validateRequiredFields.bind(this));
    this.addRule(this.validateUrlFormats.bind(this));
    this.addRule(this.validatePortRanges.bind(this));
    this.addRule(this.validateProductionSettings.bind(this));
    this.addRule(this.validateSecrets.bind(this));
  }

  addRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  validate(config: Record<string, unknown>): ValidationMessage[] {
    const messages: ValidationMessage[] = [];
    for (const rule of this.rules) {
      messages.push(...rule(config));
    }
    return messages;
  }

  validateAndThrow(config: Record<string, unknown>): void {
    const messages = this.validate(config);
    const errors = messages.filter((m) => m.severity === ValidationSeverity.ERROR);
    if (errors.length > 0) {
      const errorText = errors.map((m) => `  - ${m.field}: ${m.message}`).join('\n');
      throw new Error(`Configuration validation failed:\n${errorText}`);
    }
  }

  private validateRequiredFields(config: Record<string, unknown>): ValidationMessage[] {
    const messages: ValidationMessage[] = [];
    const requiredFields = ['app.name', 'app.environment', 'security.secretKey'];

    for (const field of requiredFields) {
      const value = this.getNested(config, field);
      if (value === undefined || value === null || value === '') {
        messages.push({
          severity: ValidationSeverity.ERROR,
          field,
          message: 'Required field is missing or empty',
        });
      }
    }

    return messages;
  }

  private validateUrlFormats(config: Record<string, unknown>): ValidationMessage[] {
    const messages: ValidationMessage[] = [];
    const urlPattern = /^(https?|postgresql|redis|mongodb):\/\/[^\s]+$/;
    const urlFields = ['database.url', 'cache.redisUrl', 'api.baseUrl'];

    for (const field of urlFields) {
      const value = this.getNested(config, field);
      if (value && typeof value === 'string' && !urlPattern.test(value)) {
        messages.push({
          severity: ValidationSeverity.ERROR,
          field,
          message: `Invalid URL format: ${value}`,
          value,
        });
      }
    }

    return messages;
  }

  private validatePortRanges(config: Record<string, unknown>): ValidationMessage[] {
    const messages: ValidationMessage[] = [];
    const portFields = ['server.port', 'database.port', 'cache.redisPort'];

    for (const field of portFields) {
      const value = this.getNested(config, field);
      if (value !== undefined && value !== null) {
        const port = Number(value);
        if (isNaN(port) || port < 1 || port > 65535) {
          messages.push({
            severity: ValidationSeverity.ERROR,
            field,
            message: `Port must be between 1 and 65535: ${value}`,
            value,
          });
        }
      }
    }

    return messages;
  }

  private validateProductionSettings(config: Record<string, unknown>): ValidationMessage[] {
    const messages: ValidationMessage[] = [];
    const environment = this.getNested(config, 'app.environment');

    if (environment !== 'production') {
      return messages;
    }

    if (this.getNested(config, 'app.debug')) {
      messages.push({
        severity: ValidationSeverity.ERROR,
        field: 'app.debug',
        message: 'Debug mode must be disabled in production',
      });
    }

    const corsOrigins = (this.getNested(config, 'security.corsOrigins') as string[]) || [];
    if (corsOrigins.includes('*')) {
      messages.push({
        severity: ValidationSeverity.ERROR,
        field: 'security.corsOrigins',
        message: 'Wildcard CORS origin not allowed in production',
      });
    }

    if (!this.getNested(config, 'database.ssl')) {
      messages.push({
        severity: ValidationSeverity.WARNING,
        field: 'database.ssl',
        message: 'Database SSL should be enabled in production',
      });
    }

    return messages;
  }

  private validateSecrets(config: Record<string, unknown>): ValidationMessage[] {
    const messages: ValidationMessage[] = [];
    const defaultSecrets: Record<string, string[]> = {
      'security.secretKey': ['change-me', 'secret', 'your-secret-key'],
      'database.password': ['password', 'postgres', 'admin', 'root'],
    };

    const environment = this.getNested(config, 'app.environment');

    for (const [field, defaults] of Object.entries(defaultSecrets)) {
      const value = this.getNested(config, field);
      if (value && defaults.some((d) => String(value).toLowerCase() === d.toLowerCase())) {
        messages.push({
          severity: environment === 'production' ? ValidationSeverity.ERROR : ValidationSeverity.WARNING,
          field,
          message: 'Using default/weak secret value',
        });
      }
    }

    return messages;
  }

  private getNested(config: Record<string, unknown>, path: string): unknown {
    const keys = path.split('.');
    let value: unknown = config;

    for (const key of keys) {
      if (typeof value === 'object' && value !== null && key in value) {
        value = (value as Record<string, unknown>)[key];
      } else {
        return undefined;
      }
    }

    return value;
  }
}

export function validateConfig(config: Record<string, unknown>): ValidationMessage[] {
  const validator = new ConfigValidator();
  return validator.validate(config);
}
```

---

## Secrets Management

### Environment Variable Encryption

**Encrypted env file handler**:

```python
# src/config/encrypted_env.py
import base64
import os
from pathlib import Path
from typing import Dict, Optional

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

class EncryptedEnvFile:
    """Handle encrypted environment files."""

    def __init__(self, password: Optional[str] = None):
        self.password = password or os.getenv("ENV_ENCRYPTION_KEY")
        if not self.password:
            raise ValueError("Encryption password required")
        self._fernet = self._create_fernet()

    def _create_fernet(self) -> Fernet:
        """Create Fernet cipher from password."""
        salt = b"env_file_salt_v1"
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=480000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(self.password.encode()))
        return Fernet(key)

    def encrypt_file(self, input_path: Path, output_path: Path) -> None:
        """Encrypt an environment file."""
        with open(input_path, "rb") as f:
            plaintext = f.read()
        ciphertext = self._fernet.encrypt(plaintext)
        with open(output_path, "wb") as f:
            f.write(ciphertext)

    def decrypt_file(self, input_path: Path, output_path: Path) -> None:
        """Decrypt an environment file."""
        with open(input_path, "rb") as f:
            ciphertext = f.read()
        plaintext = self._fernet.decrypt(ciphertext)
        with open(output_path, "wb") as f:
            f.write(plaintext)

    def load_encrypted(self, file_path: Path) -> Dict[str, str]:
        """Load and parse an encrypted environment file."""
        with open(file_path, "rb") as f:
            ciphertext = f.read()
        plaintext = self._fernet.decrypt(ciphertext).decode()

        env_vars = {}
        for line in plaintext.split("\n"):
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                value = value.strip().strip('"\'')
                env_vars[key.strip()] = value
        return env_vars

    def apply_to_environment(self, file_path: Path) -> None:
        """Load encrypted file and apply to environment."""
        env_vars = self.load_encrypted(file_path)
        for key, value in env_vars.items():
            os.environ[key] = value
```

### AWS Secrets Manager Integration

**Secrets loader**:

```python
# src/config/secrets.py
import json
from functools import lru_cache
from typing import Any, Dict, Optional

import boto3
from botocore.exceptions import ClientError

class SecretsManager:
    """AWS Secrets Manager integration."""

    def __init__(
        self,
        region_name: Optional[str] = None,
        profile_name: Optional[str] = None
    ):
        session = boto3.Session(
            region_name=region_name,
            profile_name=profile_name
        )
        self._client = session.client("secretsmanager")
        self._cache: Dict[str, Any] = {}

    def get_secret(self, secret_name: str, use_cache: bool = True) -> Dict[str, Any]:
        """Retrieve a secret from Secrets Manager."""
        if use_cache and secret_name in self._cache:
            return self._cache[secret_name]

        try:
            response = self._client.get_secret_value(SecretId=secret_name)
            secret_string = response.get("SecretString")
            if secret_string:
                secret_data = json.loads(secret_string)
            else:
                secret_data = response.get("SecretBinary")

            self._cache[secret_name] = secret_data
            return secret_data

        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code")
            if error_code == "ResourceNotFoundException":
                raise ValueError(f"Secret not found: {secret_name}")
            elif error_code == "AccessDeniedException":
                raise PermissionError(f"Access denied to secret: {secret_name}")
            raise

    def get_secret_value(
        self,
        secret_name: str,
        key: str,
        default: Any = None
    ) -> Any:
        """Get a specific value from a secret."""
        secret = self.get_secret(secret_name)
        return secret.get(key, default)

    def refresh_cache(self) -> None:
        """Clear the secrets cache."""
        self._cache.clear()

@lru_cache
def get_secrets_manager() -> SecretsManager:
    """Get cached SecretsManager instance."""
    return SecretsManager()

def load_secrets_to_env(secret_name: str, prefix: str = "") -> None:
    """Load secrets to environment variables."""
    import os
    manager = get_secrets_manager()
    secrets = manager.get_secret(secret_name)
    for key, value in secrets.items():
        env_key = f"{prefix}{key}" if prefix else key
        os.environ[env_key] = str(value)
```

**Usage in configuration**:

```python
# src/config/settings_with_secrets.py
import os
from typing import Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings

from .secrets import get_secrets_manager

class Settings(BaseSettings):
    """Settings with AWS Secrets Manager integration."""

    # Regular settings
    app_name: str = Field(default="myapp")
    environment: str = Field(default="local")

    # Secret references
    database_password: Optional[str] = Field(default=None)
    api_key: Optional[str] = Field(default=None)

    @field_validator("database_password", mode="before")
    @classmethod
    def load_database_password(cls, v: Optional[str]) -> Optional[str]:
        """Load database password from Secrets Manager if not set."""
        if v:
            return v

        env = os.getenv("ENVIRONMENT", "local")
        if env in ("staging", "production"):
            manager = get_secrets_manager()
            return manager.get_secret_value(
                f"{env}/database",
                "password"
            )
        return v

    @field_validator("api_key", mode="before")
    @classmethod
    def load_api_key(cls, v: Optional[str]) -> Optional[str]:
        """Load API key from Secrets Manager if not set."""
        if v:
            return v

        env = os.getenv("ENVIRONMENT", "local")
        if env in ("staging", "production"):
            manager = get_secrets_manager()
            return manager.get_secret_value(
                f"{env}/api",
                "key"
            )
        return v
```

---

## CI/CD Integration

### GitHub Actions Configuration Validation

```yaml
name: Configuration Validation

on:
  push:
    paths:
      - '.env*'
      - 'config/**'
      - 'src/config/**'
  pull_request:
    paths:
      - '.env*'
      - 'config/**'
      - 'src/config/**'

jobs:
  validate-config:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        environment: [local, development, staging, production]

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: pip install -e .[dev]

      - name: Validate ${{ matrix.environment }} configuration
        env:
          APP_PROFILE: ${{ matrix.environment }}
        run: |
          python scripts/validate_config.py \
            --env-file .env.${{ matrix.environment }} \
            --strict

      - name: Check for secrets in config files
        run: |
          if grep -rE "(password|secret|api_key)\s*=\s*['\"][^'\"]+['\"]" \
            --include="*.env*" --include="*.yaml" --include="*.yml" \
            . | grep -v ".example" | grep -v "test"; then
            echo "ERROR: Potential secrets found in configuration files"
            exit 1
          fi

  validate-env-example:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check .env.example completeness
        run: |
          # Get all environment variables used in code
          grep -rhoE '\$\{?[A-Z_]+\}?' src/ | \
            sed 's/[${}]//g' | sort -u > /tmp/used_vars.txt

          # Get variables defined in .env.example
          grep -E "^[A-Z_]+=" .env.example | \
            cut -d= -f1 | sort -u > /tmp/example_vars.txt

          # Check for missing variables
          missing=$(comm -23 /tmp/used_vars.txt /tmp/example_vars.txt)
          if [ -n "$missing" ]; then
            echo "Missing from .env.example:"
            echo "$missing"
            exit 1
          fi
```

### Environment Deployment Workflow

```yaml
name: Deploy with Environment Config

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        type: choice
        options:
          - staging
          - production

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment }}

    steps:
      - uses: actions/checkout@v4

      - name: Configure environment
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: ${{ vars.AWS_REGION }}
        run: |
          # Load secrets from AWS Secrets Manager
          aws secretsmanager get-secret-value \
            --secret-id ${{ github.event.inputs.environment }}/app \
            --query SecretString --output text > .env.secrets

          # Merge with environment-specific config
          cat .env.${{ github.event.inputs.environment }} .env.secrets > .env

      - name: Validate configuration
        run: |
          python scripts/validate_config.py --strict

      - name: Deploy application
        run: |
          # Deploy with validated configuration
          ./scripts/deploy.sh ${{ github.event.inputs.environment }}
```

---

## Best Practices

### Configuration Checklist

```text
Environment Variables:
✅ Never commit secrets to version control
✅ Use .env.example as documentation
✅ Validate all configuration at startup
✅ Use typed configuration (Pydantic, Zod)
✅ Fail fast on invalid configuration
✅ Log configuration errors clearly

Multi-Environment:
✅ Keep environments as similar as possible
✅ Use environment-specific overrides only when necessary
✅ Test configuration changes in staging first
✅ Document environment differences
✅ Automate environment switching safely

Secrets:
✅ Use secret managers (AWS, Vault, etc.)
✅ Rotate secrets regularly
✅ Audit secret access
✅ Encrypt secrets at rest and in transit
✅ Use different secrets per environment
```

### Configuration Anti-Patterns

```python
# DON'T: Hardcode environment-specific values
DATABASE_HOST = "prod-db.example.com"

# DO: Use environment variables
DATABASE_HOST = os.getenv("DATABASE_HOST", "localhost")

# DON'T: Commit secrets
API_KEY = "sk-prod-secret-key-12345"

# DO: Load from environment or secret manager
API_KEY = os.getenv("API_KEY") or get_secret("api_key")

# DON'T: Use unvalidated configuration
port = os.getenv("PORT")
server.listen(port)

# DO: Validate and type configuration
port = int(os.getenv("PORT", "8000"))
if not 1 <= port <= 65535:
    raise ValueError(f"Invalid port: {port}")
server.listen(port)

# DON'T: Mix configuration sources inconsistently
if env == "production":
    config = load_from_vault()
else:
    config = load_from_file()

# DO: Use consistent configuration loading
config = load_config(environment=env)
```

---

## Resources

- [The Twelve-Factor App](https://12factor.net/)
- [Pydantic Settings Documentation](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)
- [dotenv Documentation](https://github.com/motdotla/dotenv)
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/)
- [HashiCorp Vault](https://www.vaultproject.io/)

---

**Next Steps:**

- Review the [Seed Data Management Guide](seed_data_management.md) for test data strategies
- See [Security Scanning Guide](security_scanning_guide.md) for secrets detection
- Check [CI/CD Integration](github_actions_guide.md) for deployment pipelines
