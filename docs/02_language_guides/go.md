---
title: "Go Style Guide"
description: "Comprehensive Go programming standards for cloud-native applications, CLI tools, and DevOps tooling"
author: "Tyler Dukes"
tags: [go, golang, programming, cloud-native, microservices, devops, testing]
category: "Language Guides"
status: "active"
---

## Language Overview

**Go** (or Golang) is a statically typed, compiled programming language designed at Google. Known for its
simplicity, efficiency, and excellent concurrency support, Go is widely used for building cloud-native
applications, microservices, CLI tools, and infrastructure automation.

### Key Characteristics

- **Paradigm**: Concurrent, imperative, object-oriented (composition over inheritance)
- **Typing**: Static, strong, with type inference
- **Runtime**: Compiled to native binaries with garbage collection
- **Primary Use Cases**:
  - Cloud-native applications and microservices
  - CLI tools and utilities (Cobra, Viper)
  - DevOps tooling (Docker, Kubernetes, Terraform are written in Go)
  - High-performance backend services
  - Infrastructure automation and network services

### This Style Guide Covers

- Naming conventions following Go idioms
- Code formatting with gofmt and goimports
- Package organization and module structure
- Error handling patterns and best practices
- Concurrency patterns with goroutines and channels
- Testing standards with table-driven tests
- Documentation with godoc conventions
- Performance optimization and profiling
- Security best practices
- Tooling configuration (golangci-lint, gopls)

## Supported Versions

| Version | Support Status | EOL Date   | Recommended      |
|---------|----------------|------------|------------------|
| 1.23.x  | Active         | 2025-08    | ✅ Yes           |
| 1.22.x  | Active         | 2025-02    | ✅ Yes           |
| 1.21.x  | Security       | 2024-08    | ⚠️  Maintenance  |
| 1.20.x  | EOL            | 2024-02    | ❌ No            |

**Recommendation**: Use **Go 1.22+** for new projects.
Go maintains backward compatibility, so newer versions typically work with existing code.

**EOL Policy**: Go supports the two most recent major versions with security patches.
Upgrade promptly when new versions are released.

**Version Features**:

- **Go 1.23**: Enhanced iterators, improved tooling, performance optimizations
- **Go 1.22**: Range over integers, improved HTTP routing, enhanced tooling
- **Go 1.21**: Built-in min/max/clear, structured logging (slog), improved WASI support
- **Go 1.20**: Profile-guided optimization, improved error wrapping

## Quick Reference

| **Category** | **Convention** | **Example** | **Notes** |
|-------------|----------------|-------------|-----------|
| **Naming** | | | |
| Variables | `camelCase` | `userCount`, `maxRetries` | Short names in limited scope |
| Constants | `MixedCaps` or `camelCase` | `MaxConnections`, `defaultTimeout` | Exported use MixedCaps |
| Functions | `MixedCaps` | `GetUser()`, `validateInput()` | Exported use capital letter |
| Methods | `MixedCaps` | `(u *User) Save()` | Receiver names are short |
| Interfaces | `MixedCaps` + er suffix | `Reader`, `Writer`, `Stringer` | Single method interfaces |
| Packages | `lowercase` | `httputil`, `strconv` | Short, no underscores |
| Files | `snake_case.go` | `user_service.go`, `http_handler.go` | Test files: `*_test.go` |
| **Formatting** | | | |
| Line Length | No hard limit | Use gofmt | Break at natural points |
| Indentation | Tabs | `gofmt` enforces | Tabs for indentation |
| Blank Lines | Minimal | Group related code | gofmt handles most |
| Braces | K&R style | Opening brace same line | Required by gofmt |
| **Imports** | | | |
| Order | stdlib, external, internal | Grouped with blank lines | Use goimports |
| Style | Full package path | `import "github.com/pkg/errors"` | Avoid dot imports |
| **Documentation** | | | |
| Package | Package comment | `// Package foo provides...` | First file alphabetically |
| Functions | Before declaration | `// FuncName does X.` | Starts with function name |
| **Files** | | | |
| Naming | `snake_case.go` | `user_repository.go` | Match primary type |
| Test files | `*_test.go` | `user_repository_test.go` | Same package or `_test` |

## Project Structure

### Standard Project Layout

```text
myproject/
├── cmd/                    # Application entrypoints
│   ├── api/
│   │   └── main.go        # API server entrypoint
│   └── cli/
│       └── main.go        # CLI tool entrypoint
├── internal/               # Private application code
│   ├── config/            # Configuration handling
│   │   └── config.go
│   ├── handler/           # HTTP handlers
│   │   ├── handler.go
│   │   └── handler_test.go
│   ├── middleware/        # HTTP middleware
│   │   └── auth.go
│   ├── model/             # Domain models
│   │   └── user.go
│   ├── repository/        # Data access layer
│   │   ├── user.go
│   │   └── user_test.go
│   └── service/           # Business logic
│       ├── user.go
│       └── user_test.go
├── pkg/                    # Public library code
│   └── httputil/          # Reusable HTTP utilities
│       └── response.go
├── api/                    # API specifications
│   └── openapi.yaml
├── configs/                # Configuration files
│   └── config.yaml
├── scripts/                # Build and utility scripts
│   └── build.sh
├── test/                   # Integration tests
│   └── integration_test.go
├── go.mod                  # Module definition
├── go.sum                  # Dependency checksums
├── Makefile               # Build automation
└── README.md
```

### Module Initialization

```go
// go.mod
module github.com/myorg/myproject

go 1.22

require (
    github.com/gin-gonic/gin v1.9.1
    github.com/spf13/cobra v1.8.0
    github.com/spf13/viper v1.18.2
    go.uber.org/zap v1.26.0
)

require (
    // indirect dependencies managed by go mod tidy
)
```

### Package Organization

```go
// internal/config/config.go
package config

import (
    "os"
    "time"

    "github.com/spf13/viper"
)

// Config holds application configuration
type Config struct {
    Server   ServerConfig
    Database DatabaseConfig
    Logger   LoggerConfig
}

// ServerConfig holds HTTP server settings
type ServerConfig struct {
    Host         string        `mapstructure:"host"`
    Port         int           `mapstructure:"port"`
    ReadTimeout  time.Duration `mapstructure:"read_timeout"`
    WriteTimeout time.Duration `mapstructure:"write_timeout"`
}

// DatabaseConfig holds database connection settings
type DatabaseConfig struct {
    Host     string `mapstructure:"host"`
    Port     int    `mapstructure:"port"`
    User     string `mapstructure:"user"`
    Password string `mapstructure:"password"`
    Name     string `mapstructure:"name"`
    SSLMode  string `mapstructure:"ssl_mode"`
}

// LoggerConfig holds logging settings
type LoggerConfig struct {
    Level  string `mapstructure:"level"`
    Format string `mapstructure:"format"`
}

// Load reads configuration from file and environment
func Load(configPath string) (*Config, error) {
    v := viper.New()

    v.SetConfigFile(configPath)
    v.SetConfigType("yaml")

    // Environment variable overrides
    v.SetEnvPrefix("APP")
    v.AutomaticEnv()

    // Set defaults
    v.SetDefault("server.host", "0.0.0.0")
    v.SetDefault("server.port", 8080)
    v.SetDefault("server.read_timeout", "30s")
    v.SetDefault("server.write_timeout", "30s")
    v.SetDefault("logger.level", "info")
    v.SetDefault("logger.format", "json")

    if err := v.ReadInConfig(); err != nil {
        return nil, err
    }

    var cfg Config
    if err := v.Unmarshal(&cfg); err != nil {
        return nil, err
    }

    return &cfg, nil
}
```

## Naming Conventions

### Variables

**Convention**: `camelCase` with short names for limited scope

```go
// Good - descriptive names for package-level or longer-lived variables
var (
    defaultTimeout = 30 * time.Second
    maxRetryCount  = 3
)

func processUsers(users []User) error {
    // Good - short names for limited scope
    for i, u := range users {
        if err := u.Validate(); err != nil {
            return fmt.Errorf("user %d: %w", i, err)
        }
    }
    return nil
}

// Good - descriptive for function parameters
func createUser(ctx context.Context, username, email string) (*User, error) {
    user := &User{
        Username:  username,
        Email:     email,
        CreatedAt: time.Now(),
    }
    return user, nil
}

// Bad - overly verbose for limited scope
func processUsersBad(users []User) error {
    for userIndex, currentUser := range users {  // Too verbose
        if validationError := currentUser.Validate(); validationError != nil {
            return validationError
        }
    }
    return nil
}

// Bad - single letter for longer-lived or unclear context
var t = 30 * time.Second  // What is t?
```

### Constants

**Convention**: `MixedCaps` for exported, `camelCase` for unexported

```go
// Good - exported constants use MixedCaps
const (
    MaxConnections   = 100
    DefaultTimeout   = 30 * time.Second
    APIVersion       = "v1"
    ContentTypeJSON  = "application/json"
)

// Good - unexported constants use camelCase
const (
    defaultBufferSize = 4096
    maxRetries        = 3
    connectionTimeout = 10 * time.Second
)

// Good - iota for enumerations
type Status int

const (
    StatusPending Status = iota
    StatusActive
    StatusInactive
    StatusDeleted
)

func (s Status) String() string {
    switch s {
    case StatusPending:
        return "pending"
    case StatusActive:
        return "active"
    case StatusInactive:
        return "inactive"
    case StatusDeleted:
        return "deleted"
    default:
        return "unknown"
    }
}

// Bad - SCREAMING_CASE is not idiomatic Go
const MAX_CONNECTIONS = 100  // Not idiomatic
const DEFAULT_TIMEOUT = 30   // Not idiomatic
```

### Functions and Methods

**Convention**: `MixedCaps` - exported start with capital, unexported with lowercase

```go
// Good - exported function with clear verb-noun naming
func GetUserByID(ctx context.Context, id int64) (*User, error) {
    // Implementation
}

// Good - unexported helper function
func validateEmail(email string) error {
    if !strings.Contains(email, "@") {
        return errors.New("invalid email format")
    }
    return nil
}

// Good - method with short receiver name
type UserService struct {
    repo   Repository
    logger *zap.Logger
}

func (s *UserService) Create(ctx context.Context, req CreateUserRequest) (*User, error) {
    if err := req.Validate(); err != nil {
        return nil, fmt.Errorf("validation failed: %w", err)
    }

    user := &User{
        Username:  req.Username,
        Email:     req.Email,
        CreatedAt: time.Now(),
    }

    if err := s.repo.Save(ctx, user); err != nil {
        return nil, fmt.Errorf("failed to save user: %w", err)
    }

    s.logger.Info("user created", zap.Int64("id", user.ID))
    return user, nil
}

// Good - constructor function naming
func NewUserService(repo Repository, logger *zap.Logger) *UserService {
    return &UserService{
        repo:   repo,
        logger: logger,
    }
}

// Bad - receiver name too long
func (userService *UserService) CreateUser(ctx context.Context) error {  // 'userService' is too long
    return nil
}

// Bad - inconsistent receiver name
func (us *UserService) Delete(ctx context.Context) error {  // Should match other methods
    return nil
}
```

### Interfaces

**Convention**: Single-method interfaces end with `-er` suffix

```go
// Good - single method interfaces with -er suffix
type Reader interface {
    Read(p []byte) (n int, err error)
}

type Writer interface {
    Write(p []byte) (n int, err error)
}

type Closer interface {
    Close() error
}

// Good - composed interfaces
type ReadWriter interface {
    Reader
    Writer
}

type ReadWriteCloser interface {
    Reader
    Writer
    Closer
}

// Good - domain-specific interfaces
type UserRepository interface {
    Create(ctx context.Context, user *User) error
    GetByID(ctx context.Context, id int64) (*User, error)
    Update(ctx context.Context, user *User) error
    Delete(ctx context.Context, id int64) error
    List(ctx context.Context, opts ListOptions) ([]*User, error)
}

type Validator interface {
    Validate() error
}

type Stringer interface {
    String() string
}

// Good - accept interfaces, return concrete types
func ProcessData(r Reader) (*Result, error) {
    data, err := io.ReadAll(r)
    if err != nil {
        return nil, err
    }
    return &Result{Data: data}, nil
}

// Bad - interface pollution (too many methods)
type UserManager interface {  // Too broad
    Create(ctx context.Context, user *User) error
    GetByID(ctx context.Context, id int64) (*User, error)
    Update(ctx context.Context, user *User) error
    Delete(ctx context.Context, id int64) error
    List(ctx context.Context) ([]*User, error)
    Validate(user *User) error
    Hash(password string) string
    SendEmail(user *User) error
    GenerateToken(user *User) string
}
```

### Packages

**Convention**: Short, lowercase, single word preferred

```go
// Good package names
package http       // Standard library style
package httputil   // Utility for http
package strconv    // String conversion
package json       // JSON handling

// Good - descriptive but concise
package user       // User domain
package auth       // Authentication
package config     // Configuration

// Bad - verbose package names
package http_utilities    // Use httputil instead
package userManagement    // Use user instead
package json_parsing      // Use json instead

// Bad - generic/meaningless names
package util      // Too vague
package common    // What's common?
package helpers   // Not descriptive
package misc      // Avoid
```

### Files

**Convention**: `snake_case.go`, test files end with `_test.go`

```text
# Good file names
user.go              # User type and methods
user_test.go         # Tests for user.go
user_repository.go   # User repository implementation
http_handler.go      # HTTP handlers
middleware.go        # HTTP middleware
config.go           # Configuration

# Bad file names
User.go             # Don't use PascalCase
userRepository.go   # Don't use camelCase
http-handler.go     # Don't use kebab-case
```

## Code Formatting

### Indentation and Braces

Go uses `gofmt` for consistent formatting. Tabs are used for indentation.

```go
// Good - K&R brace style (required by gofmt)
func processRequest(ctx context.Context, req *Request) (*Response, error) {
    if req == nil {
        return nil, errors.New("request is nil")
    }

    result, err := doSomething(ctx, req.Data)
    if err != nil {
        return nil, fmt.Errorf("processing failed: %w", err)
    }

    return &Response{
        Status: "success",
        Data:   result,
    }, nil
}

// Good - struct initialization
user := User{
    ID:        1,
    Username:  "johndoe",
    Email:     "john@example.com",
    CreatedAt: time.Now(),
}

// Good - slice initialization
items := []string{
    "apple",
    "banana",
    "cherry",
}

// Good - map initialization
config := map[string]interface{}{
    "host":    "localhost",
    "port":    8080,
    "debug":   true,
    "timeout": 30,
}
```

### Import Organization

```go
// Good - imports grouped: stdlib, external, internal
import (
    // Standard library
    "context"
    "encoding/json"
    "fmt"
    "net/http"
    "time"

    // External packages
    "github.com/gin-gonic/gin"
    "github.com/pkg/errors"
    "go.uber.org/zap"

    // Internal packages
    "github.com/myorg/myproject/internal/config"
    "github.com/myorg/myproject/internal/model"
    "github.com/myorg/myproject/internal/repository"
)

// Good - aliased imports for clarity
import (
    "database/sql"

    pgx "github.com/jackc/pgx/v5"
    "github.com/jackc/pgx/v5/pgxpool"
)

// Bad - unsorted imports
import (
    "github.com/gin-gonic/gin"  // External before stdlib
    "fmt"
    "github.com/myorg/myproject/internal/config"
    "net/http"
)

// Bad - dot imports (pollute namespace)
import (
    . "github.com/onsi/ginkgo/v2"  // Avoid dot imports
    . "github.com/onsi/gomega"
)
```

### Line Breaking

```go
// Good - break long function signatures
func CreateUserWithOptions(
    ctx context.Context,
    username string,
    email string,
    options CreateUserOptions,
) (*User, error) {
    // Implementation
}

// Good - break long function calls
result, err := userService.CreateUser(
    ctx,
    CreateUserRequest{
        Username: username,
        Email:    email,
        Role:     "admin",
    },
)

// Good - break long conditionals
if user != nil &&
    user.IsActive &&
    user.HasPermission("admin") &&
    !user.IsLocked {
    // Handle admin user
}

// Good - break long struct literals
config := &ServerConfig{
    Host:            "0.0.0.0",
    Port:            8080,
    ReadTimeout:     30 * time.Second,
    WriteTimeout:    30 * time.Second,
    MaxHeaderBytes:  1 << 20,
    ShutdownTimeout: 10 * time.Second,
}
```

## Error Handling

### Basic Error Handling

```go
// Good - check errors immediately
func readConfig(path string) (*Config, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return nil, fmt.Errorf("reading config file: %w", err)
    }

    var config Config
    if err := json.Unmarshal(data, &config); err != nil {
        return nil, fmt.Errorf("parsing config: %w", err)
    }

    return &config, nil
}

// Good - use errors.Is for sentinel errors
var ErrNotFound = errors.New("not found")

func GetUser(ctx context.Context, id int64) (*User, error) {
    user, err := repo.FindByID(ctx, id)
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, ErrNotFound
        }
        return nil, fmt.Errorf("querying user: %w", err)
    }
    return user, nil
}

// Good - use errors.As for type assertions
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("%s: %s", e.Field, e.Message)
}

func handleError(err error) {
    var validationErr *ValidationError
    if errors.As(err, &validationErr) {
        fmt.Printf("Validation failed on %s: %s\n", validationErr.Field, validationErr.Message)
        return
    }
    fmt.Printf("Unknown error: %v\n", err)
}
```

### Error Wrapping

```go
// Good - wrap errors with context using %w
func (s *UserService) Create(ctx context.Context, req CreateUserRequest) (*User, error) {
    // Validate request
    if err := req.Validate(); err != nil {
        return nil, fmt.Errorf("invalid request: %w", err)
    }

    // Check for existing user
    existing, err := s.repo.FindByEmail(ctx, req.Email)
    if err != nil && !errors.Is(err, ErrNotFound) {
        return nil, fmt.Errorf("checking existing user: %w", err)
    }
    if existing != nil {
        return nil, fmt.Errorf("email already registered: %w", ErrDuplicateEmail)
    }

    // Create user
    user := &User{
        Username:  req.Username,
        Email:     req.Email,
        CreatedAt: time.Now(),
    }

    if err := s.repo.Save(ctx, user); err != nil {
        return nil, fmt.Errorf("saving user: %w", err)
    }

    return user, nil
}

// Good - custom error types for domain errors
type NotFoundError struct {
    Resource string
    ID       interface{}
}

func (e *NotFoundError) Error() string {
    return fmt.Sprintf("%s with ID %v not found", e.Resource, e.ID)
}

func (e *NotFoundError) Is(target error) bool {
    _, ok := target.(*NotFoundError)
    return ok
}

func GetUserByID(ctx context.Context, id int64) (*User, error) {
    user, err := repo.FindByID(ctx, id)
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, &NotFoundError{Resource: "user", ID: id}
        }
        return nil, fmt.Errorf("querying database: %w", err)
    }
    return user, nil
}
```

### Error Handling Patterns

```go
// Good - multiple return error handling
func processMultipleItems(ctx context.Context, items []Item) error {
    var errs []error

    for i, item := range items {
        if err := processItem(ctx, item); err != nil {
            errs = append(errs, fmt.Errorf("item %d: %w", i, err))
        }
    }

    if len(errs) > 0 {
        return errors.Join(errs...)
    }
    return nil
}

// Good - defer with error handling
func writeToFile(path string, data []byte) (err error) {
    f, err := os.Create(path)
    if err != nil {
        return fmt.Errorf("creating file: %w", err)
    }

    defer func() {
        if closeErr := f.Close(); closeErr != nil {
            if err == nil {
                err = fmt.Errorf("closing file: %w", closeErr)
            }
        }
    }()

    if _, err := f.Write(data); err != nil {
        return fmt.Errorf("writing data: %w", err)
    }

    return nil
}

// Good - panic and recover (use sparingly)
func safeExecute(fn func()) (err error) {
    defer func() {
        if r := recover(); r != nil {
            err = fmt.Errorf("panic recovered: %v", r)
        }
    }()

    fn()
    return nil
}
```

## Concurrency Patterns

### Goroutines and Channels

```go
// Good - basic goroutine with channel
func fetchData(ctx context.Context, urls []string) ([]Result, error) {
    results := make(chan Result, len(urls))
    errs := make(chan error, len(urls))

    for _, url := range urls {
        go func(url string) {
            result, err := fetch(ctx, url)
            if err != nil {
                errs <- err
                return
            }
            results <- result
        }(url)
    }

    var allResults []Result
    var allErrors []error

    for i := 0; i < len(urls); i++ {
        select {
        case result := <-results:
            allResults = append(allResults, result)
        case err := <-errs:
            allErrors = append(allErrors, err)
        case <-ctx.Done():
            return nil, ctx.Err()
        }
    }

    if len(allErrors) > 0 {
        return allResults, errors.Join(allErrors...)
    }
    return allResults, nil
}

// Good - worker pool pattern
func processWithWorkerPool(ctx context.Context, items []Item, workers int) error {
    jobs := make(chan Item, len(items))
    results := make(chan error, len(items))

    // Start workers
    var wg sync.WaitGroup
    for i := 0; i < workers; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for item := range jobs {
                select {
                case <-ctx.Done():
                    return
                default:
                    results <- processItem(ctx, item)
                }
            }
        }()
    }

    // Send jobs
    for _, item := range items {
        jobs <- item
    }
    close(jobs)

    // Wait for workers to finish
    go func() {
        wg.Wait()
        close(results)
    }()

    // Collect results
    var errs []error
    for err := range results {
        if err != nil {
            errs = append(errs, err)
        }
    }

    if len(errs) > 0 {
        return errors.Join(errs...)
    }
    return nil
}
```

### Context Usage

```go
// Good - pass context as first parameter
func (s *Service) GetUser(ctx context.Context, id int64) (*User, error) {
    // Check for context cancellation
    select {
    case <-ctx.Done():
        return nil, ctx.Err()
    default:
    }

    return s.repo.FindByID(ctx, id)
}

// Good - context with timeout
func fetchWithTimeout(url string) (*Response, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
    if err != nil {
        return nil, fmt.Errorf("creating request: %w", err)
    }

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return nil, fmt.Errorf("executing request: %w", err)
    }
    defer resp.Body.Close()

    var result Response
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, fmt.Errorf("decoding response: %w", err)
    }

    return &result, nil
}

// Good - context with values (use sparingly)
type contextKey string

const (
    requestIDKey contextKey = "requestID"
    userIDKey    contextKey = "userID"
)

func WithRequestID(ctx context.Context, requestID string) context.Context {
    return context.WithValue(ctx, requestIDKey, requestID)
}

func RequestIDFromContext(ctx context.Context) string {
    if id, ok := ctx.Value(requestIDKey).(string); ok {
        return id
    }
    return ""
}
```

### Synchronization Primitives

```go
// Good - sync.Mutex for protecting shared state
type SafeCounter struct {
    mu    sync.Mutex
    count int
}

func (c *SafeCounter) Increment() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.count++
}

func (c *SafeCounter) Value() int {
    c.mu.Lock()
    defer c.mu.Unlock()
    return c.count
}

// Good - sync.RWMutex for read-heavy workloads
type Cache struct {
    mu   sync.RWMutex
    data map[string]interface{}
}

func NewCache() *Cache {
    return &Cache{
        data: make(map[string]interface{}),
    }
}

func (c *Cache) Get(key string) (interface{}, bool) {
    c.mu.RLock()
    defer c.mu.RUnlock()
    val, ok := c.data[key]
    return val, ok
}

func (c *Cache) Set(key string, value interface{}) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.data[key] = value
}

// Good - sync.Once for initialization
type Database struct {
    once sync.Once
    conn *sql.DB
}

func (db *Database) Connection() *sql.DB {
    db.once.Do(func() {
        conn, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))
        if err != nil {
            panic(err)
        }
        db.conn = conn
    })
    return db.conn
}

// Good - sync.WaitGroup for coordinating goroutines
func processAll(ctx context.Context, items []Item) error {
    var wg sync.WaitGroup
    errChan := make(chan error, len(items))

    for _, item := range items {
        wg.Add(1)
        go func(item Item) {
            defer wg.Done()
            if err := process(ctx, item); err != nil {
                errChan <- err
            }
        }(item)
    }

    wg.Wait()
    close(errChan)

    var errs []error
    for err := range errChan {
        errs = append(errs, err)
    }

    if len(errs) > 0 {
        return errors.Join(errs...)
    }
    return nil
}
```

### Graceful Shutdown

```go
// Good - graceful HTTP server shutdown
func startServer(ctx context.Context, addr string, handler http.Handler) error {
    server := &http.Server{
        Addr:         addr,
        Handler:      handler,
        ReadTimeout:  15 * time.Second,
        WriteTimeout: 15 * time.Second,
        IdleTimeout:  60 * time.Second,
    }

    // Start server in goroutine
    go func() {
        if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Printf("HTTP server error: %v", err)
        }
    }()

    // Wait for shutdown signal
    <-ctx.Done()

    // Graceful shutdown with timeout
    shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    if err := server.Shutdown(shutdownCtx); err != nil {
        return fmt.Errorf("server shutdown: %w", err)
    }

    return nil
}

// Good - main with signal handling
func main() {
    ctx, cancel := context.WithCancel(context.Background())

    // Handle shutdown signals
    sigChan := make(chan os.Signal, 1)
    signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

    go func() {
        <-sigChan
        log.Println("Shutdown signal received")
        cancel()
    }()

    // Run application
    if err := run(ctx); err != nil {
        log.Fatalf("Application error: %v", err)
    }
}

func run(ctx context.Context) error {
    // Initialize dependencies
    cfg, err := config.Load("config.yaml")
    if err != nil {
        return fmt.Errorf("loading config: %w", err)
    }

    db, err := database.Connect(ctx, cfg.Database)
    if err != nil {
        return fmt.Errorf("connecting to database: %w", err)
    }
    defer db.Close()

    // Start HTTP server
    handler := setupRoutes(db)
    return startServer(ctx, cfg.Server.Addr, handler)
}
```

## Testing Standards

### Table-Driven Tests

```go
// Good - table-driven tests
func TestAdd(t *testing.T) {
    tests := []struct {
        name     string
        a        int
        b        int
        expected int
    }{
        {
            name:     "positive numbers",
            a:        2,
            b:        3,
            expected: 5,
        },
        {
            name:     "negative numbers",
            a:        -2,
            b:        -3,
            expected: -5,
        },
        {
            name:     "mixed numbers",
            a:        -2,
            b:        3,
            expected: 1,
        },
        {
            name:     "zero",
            a:        0,
            b:        0,
            expected: 0,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result := Add(tt.a, tt.b)
            if result != tt.expected {
                t.Errorf("Add(%d, %d) = %d; want %d", tt.a, tt.b, result, tt.expected)
            }
        })
    }
}

// Good - table-driven tests with errors
func TestValidateEmail(t *testing.T) {
    tests := []struct {
        name    string
        email   string
        wantErr bool
        errMsg  string
    }{
        {
            name:    "valid email",
            email:   "user@example.com",
            wantErr: false,
        },
        {
            name:    "missing @",
            email:   "userexample.com",
            wantErr: true,
            errMsg:  "invalid email format",
        },
        {
            name:    "empty string",
            email:   "",
            wantErr: true,
            errMsg:  "email is required",
        },
        {
            name:    "multiple @",
            email:   "user@@example.com",
            wantErr: true,
            errMsg:  "invalid email format",
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := ValidateEmail(tt.email)
            if tt.wantErr {
                if err == nil {
                    t.Errorf("ValidateEmail(%q) expected error, got nil", tt.email)
                    return
                }
                if !strings.Contains(err.Error(), tt.errMsg) {
                    t.Errorf("ValidateEmail(%q) error = %v; want error containing %q", tt.email, err, tt.errMsg)
                }
            } else {
                if err != nil {
                    t.Errorf("ValidateEmail(%q) unexpected error: %v", tt.email, err)
                }
            }
        })
    }
}
```

### Test Helpers and Fixtures

```go
// Good - test helper functions
func setupTestDB(t *testing.T) *sql.DB {
    t.Helper()

    db, err := sql.Open("sqlite3", ":memory:")
    if err != nil {
        t.Fatalf("Failed to open database: %v", err)
    }

    // Run migrations
    if _, err := db.Exec(schema); err != nil {
        t.Fatalf("Failed to create schema: %v", err)
    }

    t.Cleanup(func() {
        db.Close()
    })

    return db
}

func createTestUser(t *testing.T, db *sql.DB, username string) *User {
    t.Helper()

    user := &User{
        Username:  username,
        Email:     username + "@example.com",
        CreatedAt: time.Now(),
    }

    result, err := db.Exec(
        "INSERT INTO users (username, email, created_at) VALUES (?, ?, ?)",
        user.Username, user.Email, user.CreatedAt,
    )
    if err != nil {
        t.Fatalf("Failed to create test user: %v", err)
    }

    id, _ := result.LastInsertId()
    user.ID = id
    return user
}

// Good - using test helpers
func TestUserRepository_FindByID(t *testing.T) {
    db := setupTestDB(t)
    repo := NewUserRepository(db)
    user := createTestUser(t, db, "testuser")

    found, err := repo.FindByID(context.Background(), user.ID)
    if err != nil {
        t.Fatalf("FindByID() error = %v", err)
    }

    if found.Username != user.Username {
        t.Errorf("FindByID() username = %q; want %q", found.Username, user.Username)
    }
}
```

### Mocking with Interfaces

```go
// Good - define interface for mocking
type UserRepository interface {
    Create(ctx context.Context, user *User) error
    FindByID(ctx context.Context, id int64) (*User, error)
    FindByEmail(ctx context.Context, email string) (*User, error)
}

// Good - mock implementation
type MockUserRepository struct {
    CreateFunc      func(ctx context.Context, user *User) error
    FindByIDFunc    func(ctx context.Context, id int64) (*User, error)
    FindByEmailFunc func(ctx context.Context, email string) (*User, error)
}

func (m *MockUserRepository) Create(ctx context.Context, user *User) error {
    if m.CreateFunc != nil {
        return m.CreateFunc(ctx, user)
    }
    return nil
}

func (m *MockUserRepository) FindByID(ctx context.Context, id int64) (*User, error) {
    if m.FindByIDFunc != nil {
        return m.FindByIDFunc(ctx, id)
    }
    return nil, nil
}

func (m *MockUserRepository) FindByEmail(ctx context.Context, email string) (*User, error) {
    if m.FindByEmailFunc != nil {
        return m.FindByEmailFunc(ctx, email)
    }
    return nil, nil
}

// Good - test using mock
func TestUserService_Create(t *testing.T) {
    tests := []struct {
        name      string
        req       CreateUserRequest
        mockSetup func(*MockUserRepository)
        wantErr   bool
    }{
        {
            name: "successful creation",
            req: CreateUserRequest{
                Username: "newuser",
                Email:    "newuser@example.com",
            },
            mockSetup: func(m *MockUserRepository) {
                m.FindByEmailFunc = func(ctx context.Context, email string) (*User, error) {
                    return nil, ErrNotFound
                }
                m.CreateFunc = func(ctx context.Context, user *User) error {
                    user.ID = 1
                    return nil
                }
            },
            wantErr: false,
        },
        {
            name: "duplicate email",
            req: CreateUserRequest{
                Username: "newuser",
                Email:    "existing@example.com",
            },
            mockSetup: func(m *MockUserRepository) {
                m.FindByEmailFunc = func(ctx context.Context, email string) (*User, error) {
                    return &User{ID: 1, Email: email}, nil
                }
            },
            wantErr: true,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            mockRepo := &MockUserRepository{}
            tt.mockSetup(mockRepo)

            service := NewUserService(mockRepo, zap.NewNop())
            _, err := service.Create(context.Background(), tt.req)

            if (err != nil) != tt.wantErr {
                t.Errorf("Create() error = %v, wantErr %v", err, tt.wantErr)
            }
        })
    }
}
```

### Benchmarks

```go
// Good - benchmark function
func BenchmarkJSONMarshal(b *testing.B) {
    user := &User{
        ID:        1,
        Username:  "testuser",
        Email:     "test@example.com",
        CreatedAt: time.Now(),
    }

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        _, _ = json.Marshal(user)
    }
}

// Good - benchmark with different inputs
func BenchmarkProcessItems(b *testing.B) {
    sizes := []int{10, 100, 1000, 10000}

    for _, size := range sizes {
        items := make([]Item, size)
        for i := range items {
            items[i] = Item{ID: i, Name: fmt.Sprintf("item-%d", i)}
        }

        b.Run(fmt.Sprintf("size=%d", size), func(b *testing.B) {
            for i := 0; i < b.N; i++ {
                _ = processItems(items)
            }
        })
    }
}

// Good - benchmark with memory allocation reporting
func BenchmarkStringConcat(b *testing.B) {
    b.ReportAllocs()

    for i := 0; i < b.N; i++ {
        var s string
        for j := 0; j < 100; j++ {
            s += "x"
        }
        _ = s
    }
}

func BenchmarkStringBuilder(b *testing.B) {
    b.ReportAllocs()

    for i := 0; i < b.N; i++ {
        var sb strings.Builder
        for j := 0; j < 100; j++ {
            sb.WriteString("x")
        }
        _ = sb.String()
    }
}
```

## Documentation Standards

### Package Documentation

```go
// Package httputil provides HTTP utility functions for building
// web services. It includes helpers for response writing, error
// handling, and middleware.
//
// Basic usage:
//
// handler := func(w http.ResponseWriter, r *http.Request) {
//     httputil.JSON(w, http.StatusOK, map[string]string{"status": "ok"})
// }
//
// Error responses:
//
// httputil.Error(w, http.StatusNotFound, "resource not found")
package httputil

import (
    "encoding/json"
    "net/http"
)

// JSON writes a JSON response with the given status code.
//
// Example:
//
// func handler(w http.ResponseWriter, r *http.Request) {
//     data := map[string]string{"message": "Hello"}
//     httputil.JSON(w, http.StatusOK, data)
// }
func JSON(w http.ResponseWriter, status int, data interface{}) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(data)
}

// Error writes an error response with the given status code and message.
//
// The response format is:
//
// {"error": "message"}
func Error(w http.ResponseWriter, status int, message string) {
    JSON(w, status, map[string]string{"error": message})
}
```

### Function and Type Documentation

```go
// User represents a user account in the system.
// Users are created via the UserService and stored in the database.
type User struct {
    // ID is the unique identifier for the user.
    ID int64 `json:"id" db:"id"`

    // Username is the user's chosen display name.
    // Must be unique and between 3-50 characters.
    Username string `json:"username" db:"username"`

    // Email is the user's email address.
    // Must be unique and valid email format.
    Email string `json:"email" db:"email"`

    // PasswordHash is the bcrypt hash of the user's password.
    // Never exposed in JSON responses.
    PasswordHash string `json:"-" db:"password_hash"`

    // CreatedAt is when the user account was created.
    CreatedAt time.Time `json:"created_at" db:"created_at"`

    // UpdatedAt is when the user account was last modified.
    UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// Validate checks if the user data is valid.
// It returns an error if validation fails.
func (u *User) Validate() error {
    if u.Username == "" {
        return errors.New("username is required")
    }
    if len(u.Username) < 3 || len(u.Username) > 50 {
        return errors.New("username must be between 3 and 50 characters")
    }
    if u.Email == "" {
        return errors.New("email is required")
    }
    if !strings.Contains(u.Email, "@") {
        return errors.New("invalid email format")
    }
    return nil
}

// CreateUserRequest contains the data needed to create a new user.
type CreateUserRequest struct {
    Username string `json:"username"`
    Email    string `json:"email"`
    Password string `json:"password"`
}

// Validate checks if the create user request is valid.
func (r *CreateUserRequest) Validate() error {
    if r.Username == "" {
        return errors.New("username is required")
    }
    if r.Email == "" {
        return errors.New("email is required")
    }
    if len(r.Password) < 8 {
        return errors.New("password must be at least 8 characters")
    }
    return nil
}
```

### Example Tests

```go
// Example tests appear in godoc documentation
func ExampleJSON() {
    w := httptest.NewRecorder()
    data := map[string]string{"status": "ok"}
    JSON(w, http.StatusOK, data)

    fmt.Println(w.Code)
    fmt.Println(w.Body.String())
    // Output:
    // 200
    // {"status":"ok"}
}

func ExampleUser_Validate() {
    user := &User{
        Username: "johndoe",
        Email:    "john@example.com",
    }

    if err := user.Validate(); err != nil {
        fmt.Println("Error:", err)
        return
    }
    fmt.Println("Valid user")
    // Output: Valid user
}

func ExampleNewUserService() {
    // Create a mock repository for testing
    repo := &MockUserRepository{}
    logger := zap.NewNop()

    service := NewUserService(repo, logger)
    fmt.Printf("Service created: %T\n", service)
    // Output: Service created: *UserService
}
```

## Performance Optimization

### Memory Management

```go
// Good - pre-allocate slices when size is known
func processItems(n int) []Result {
    results := make([]Result, 0, n)
    for i := 0; i < n; i++ {
        results = append(results, processItem(i))
    }
    return results
}

// Good - use sync.Pool for frequently allocated objects
var bufferPool = sync.Pool{
    New: func() interface{} {
        return new(bytes.Buffer)
    },
}

func processRequest(data []byte) string {
    buf := bufferPool.Get().(*bytes.Buffer)
    defer func() {
        buf.Reset()
        bufferPool.Put(buf)
    }()

    buf.Write(data)
    // Process buffer...
    return buf.String()
}

// Good - avoid unnecessary allocations in hot paths
func concatenateStrings(parts []string) string {
    // Calculate total length first
    n := 0
    for _, p := range parts {
        n += len(p)
    }

    // Pre-allocate builder
    var sb strings.Builder
    sb.Grow(n)

    for _, p := range parts {
        sb.WriteString(p)
    }

    return sb.String()
}

// Good - use pointers for large structs
type LargeStruct struct {
    Data [1024]byte
    // ... many fields
}

// Pass by pointer to avoid copying
func processLarge(ls *LargeStruct) {
    // Process...
}

// Good - use value receivers for small structs
type Point struct {
    X, Y int
}

func (p Point) Distance(other Point) float64 {
    dx := float64(p.X - other.X)
    dy := float64(p.Y - other.Y)
    return math.Sqrt(dx*dx + dy*dy)
}
```

### Profiling

```go
// Good - add pprof endpoints for profiling
import (
    "net/http"
    _ "net/http/pprof"
)

func main() {
    // Expose pprof endpoints on a separate port
    go func() {
        http.ListenAndServe("localhost:6060", nil)
    }()

    // Main application...
}

// Profile with:
// go tool pprof http://localhost:6060/debug/pprof/heap
// go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30
// go tool pprof http://localhost:6060/debug/pprof/goroutine

// Good - programmatic CPU profiling
func runWithProfiling() {
    f, err := os.Create("cpu.prof")
    if err != nil {
        log.Fatal(err)
    }
    defer f.Close()

    if err := pprof.StartCPUProfile(f); err != nil {
        log.Fatal(err)
    }
    defer pprof.StopCPUProfile()

    // Run workload...
}

// Good - memory profiling
func writeHeapProfile() {
    f, err := os.Create("mem.prof")
    if err != nil {
        log.Fatal(err)
    }
    defer f.Close()

    runtime.GC()
    if err := pprof.WriteHeapProfile(f); err != nil {
        log.Fatal(err)
    }
}
```

## Security Best Practices

### Input Validation

```go
// Good - validate and sanitize input
func CreateUser(w http.ResponseWriter, r *http.Request) {
    var req CreateUserRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Invalid JSON", http.StatusBadRequest)
        return
    }

    // Validate username
    if len(req.Username) < 3 || len(req.Username) > 50 {
        http.Error(w, "Username must be 3-50 characters", http.StatusBadRequest)
        return
    }
    if !regexp.MustCompile(`^[a-zA-Z0-9_]+$`).MatchString(req.Username) {
        http.Error(w, "Username can only contain alphanumeric characters and underscores", http.StatusBadRequest)
        return
    }

    // Validate email
    if !regexp.MustCompile(`^[^@]+@[^@]+\.[^@]+$`).MatchString(req.Email) {
        http.Error(w, "Invalid email format", http.StatusBadRequest)
        return
    }

    // Validate password strength
    if len(req.Password) < 8 {
        http.Error(w, "Password must be at least 8 characters", http.StatusBadRequest)
        return
    }

    // Process valid request...
}

// Good - use a validation library
import "github.com/go-playground/validator/v10"

type CreateUserRequest struct {
    Username string `json:"username" validate:"required,min=3,max=50,alphanum"`
    Email    string `json:"email" validate:"required,email"`
    Password string `json:"password" validate:"required,min=8"`
}

var validate = validator.New()

func ValidateRequest(req interface{}) error {
    return validate.Struct(req)
}
```

### SQL Injection Prevention

```go
// Good - use parameterized queries
func GetUserByEmail(ctx context.Context, db *sql.DB, email string) (*User, error) {
    query := `SELECT id, username, email, created_at FROM users WHERE email = $1`
    row := db.QueryRowContext(ctx, query, email)

    var user User
    err := row.Scan(&user.ID, &user.Username, &user.Email, &user.CreatedAt)
    if err != nil {
        return nil, err
    }
    return &user, nil
}

// Good - use query builder or ORM
import "github.com/Masterminds/squirrel"

func SearchUsers(ctx context.Context, db *sql.DB, filters UserFilters) ([]*User, error) {
    query := squirrel.Select("id", "username", "email", "created_at").
        From("users").
        PlaceholderFormat(squirrel.Dollar)

    if filters.Username != "" {
        query = query.Where(squirrel.Like{"username": "%" + filters.Username + "%"})
    }
    if filters.Email != "" {
        query = query.Where(squirrel.Eq{"email": filters.Email})
    }

    sql, args, err := query.ToSql()
    if err != nil {
        return nil, err
    }

    rows, err := db.QueryContext(ctx, sql, args...)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var users []*User
    for rows.Next() {
        var user User
        if err := rows.Scan(&user.ID, &user.Username, &user.Email, &user.CreatedAt); err != nil {
            return nil, err
        }
        users = append(users, &user)
    }
    return users, rows.Err()
}

// Bad - string concatenation (SQL injection vulnerability)
func GetUserByEmailUnsafe(db *sql.DB, email string) (*User, error) {
    // NEVER DO THIS - vulnerable to SQL injection
    query := fmt.Sprintf("SELECT * FROM users WHERE email = '%s'", email)
    // ...
}
```

### Secret Management

```go
// Good - use environment variables for secrets
func LoadConfig() *Config {
    return &Config{
        DatabaseURL: os.Getenv("DATABASE_URL"),
        APIKey:      os.Getenv("API_KEY"),
        JWTSecret:   os.Getenv("JWT_SECRET"),
    }
}

// Good - validate required secrets on startup
func validateSecrets() error {
    required := []string{
        "DATABASE_URL",
        "API_KEY",
        "JWT_SECRET",
    }

    var missing []string
    for _, key := range required {
        if os.Getenv(key) == "" {
            missing = append(missing, key)
        }
    }

    if len(missing) > 0 {
        return fmt.Errorf("missing required environment variables: %v", missing)
    }
    return nil
}

// Good - use a secrets manager
import (
    "github.com/aws/aws-sdk-go-v2/service/secretsmanager"
)

func GetSecret(ctx context.Context, client *secretsmanager.Client, secretID string) (string, error) {
    input := &secretsmanager.GetSecretValueInput{
        SecretId: &secretID,
    }

    result, err := client.GetSecretValue(ctx, input)
    if err != nil {
        return "", fmt.Errorf("getting secret: %w", err)
    }

    return *result.SecretString, nil
}

// Bad - hardcoded secrets
const (
    APIKey    = "sk_live_abc123"  // NEVER DO THIS
    JWTSecret = "supersecret"     // NEVER DO THIS
)
```

### Password Hashing

```go
import "golang.org/x/crypto/bcrypt"

// Good - hash passwords with bcrypt
func HashPassword(password string) (string, error) {
    bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
    if err != nil {
        return "", fmt.Errorf("hashing password: %w", err)
    }
    return string(bytes), nil
}

// Good - verify passwords
func CheckPassword(hashedPassword, password string) bool {
    err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
    return err == nil
}

// Good - complete authentication flow
func (s *AuthService) Authenticate(ctx context.Context, email, password string) (*User, error) {
    user, err := s.repo.FindByEmail(ctx, email)
    if err != nil {
        if errors.Is(err, ErrNotFound) {
            // Don't reveal whether email exists
            return nil, ErrInvalidCredentials
        }
        return nil, fmt.Errorf("finding user: %w", err)
    }

    if !CheckPassword(user.PasswordHash, password) {
        return nil, ErrInvalidCredentials
    }

    return user, nil
}
```

## Anti-Patterns to Avoid

### Ignoring Errors

```go
// Bad - ignoring errors
func processFile(path string) {
    data, _ := os.ReadFile(path)  // Error ignored!
    processData(data)
}

// Good - handle all errors
func processFile(path string) error {
    data, err := os.ReadFile(path)
    if err != nil {
        return fmt.Errorf("reading file: %w", err)
    }
    return processData(data)
}
```

### Goroutine Leaks

```go
// Bad - goroutine leak (channel never closed)
func processItems(items []Item) {
    results := make(chan Result)

    for _, item := range items {
        go func(item Item) {
            results <- process(item)  // May block forever
        }(item)
    }
    // results channel never consumed if function returns early
}

// Good - proper goroutine cleanup
func processItems(ctx context.Context, items []Item) ([]Result, error) {
    results := make(chan Result, len(items))
    var wg sync.WaitGroup

    for _, item := range items {
        wg.Add(1)
        go func(item Item) {
            defer wg.Done()
            select {
            case results <- process(item):
            case <-ctx.Done():
            }
        }(item)
    }

    go func() {
        wg.Wait()
        close(results)
    }()

    var allResults []Result
    for result := range results {
        allResults = append(allResults, result)
    }
    return allResults, nil
}
```

### Nil Map Assignment

```go
// Bad - nil map panic
func addToMap(key, value string) {
    var m map[string]string
    m[key] = value  // Panic: assignment to entry in nil map
}

// Good - initialize map
func addToMap(key, value string) map[string]string {
    m := make(map[string]string)
    m[key] = value
    return m
}

// Good - check before adding
func addToMapSafe(m map[string]string, key, value string) map[string]string {
    if m == nil {
        m = make(map[string]string)
    }
    m[key] = value
    return m
}
```

### Mutex Copying

```go
// Bad - copying mutex (leads to data races)
type Counter struct {
    mu    sync.Mutex
    count int
}

func (c Counter) Value() int {  // Value receiver copies mutex!
    c.mu.Lock()
    defer c.mu.Unlock()
    return c.count
}

// Good - use pointer receiver for mutex
type Counter struct {
    mu    sync.Mutex
    count int
}

func (c *Counter) Value() int {  // Pointer receiver
    c.mu.Lock()
    defer c.mu.Unlock()
    return c.count
}

func (c *Counter) Increment() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.count++
}
```

### Interface Pollution

```go
// Bad - overly broad interface
type DataManager interface {
    Create(ctx context.Context, data interface{}) error
    Read(ctx context.Context, id string) (interface{}, error)
    Update(ctx context.Context, id string, data interface{}) error
    Delete(ctx context.Context, id string) error
    List(ctx context.Context) ([]interface{}, error)
    Search(ctx context.Context, query string) ([]interface{}, error)
    Validate(data interface{}) error
    Transform(data interface{}) interface{}
    Export(ctx context.Context, format string) ([]byte, error)
    Import(ctx context.Context, data []byte) error
}

// Good - small, focused interfaces
type Reader interface {
    Read(ctx context.Context, id string) (*Entity, error)
}

type Writer interface {
    Write(ctx context.Context, entity *Entity) error
}

type Deleter interface {
    Delete(ctx context.Context, id string) error
}

// Compose as needed
type ReadWriter interface {
    Reader
    Writer
}
```

## Recommended Tools

### Formatters

- **gofmt**: Standard Go formatter
  - Run: `gofmt -w .`
  - Included with Go installation

- **goimports**: Format + organize imports
  - Installation: `go install golang.org/x/tools/cmd/goimports@latest`
  - Run: `goimports -w .`

### Linters

- **golangci-lint**: Meta-linter running multiple linters
  - Installation: `go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest`
  - Run: `golangci-lint run`
  - Configuration: `.golangci.yml`

```yaml
# .golangci.yml
run:
  timeout: 5m
  tests: true

linters:
  enable:
    - errcheck
    - govet
    - staticcheck
    - unused
    - gosimple
    - ineffassign
    - misspell
    - gofmt
    - goimports
    - revive
    - gosec
    - prealloc
    - unconvert
    - gocritic

linters-settings:
  errcheck:
    check-type-assertions: true
    check-blank: true

  govet:
    enable-all: true

  revive:
    rules:
      - name: blank-imports
      - name: context-as-argument
      - name: context-keys-type
      - name: error-return
      - name: error-strings
      - name: error-naming
      - name: exported
      - name: increment-decrement
      - name: var-naming
      - name: package-comments
      - name: range
      - name: receiver-naming
      - name: time-naming
      - name: unexported-return
      - name: indent-error-flow
      - name: errorf

  gosec:
    excludes:
      - G104  # Audit errors not checked

issues:
  exclude-rules:
    - path: _test\.go
      linters:
        - errcheck
        - gosec
```

### Testing Tools

- **go test**: Built-in test runner
  - Run: `go test ./...`
  - With coverage: `go test -cover ./...`
  - Verbose: `go test -v ./...`

- **gotestsum**: Enhanced test output
  - Installation: `go install gotest.tools/gotestsum@latest`
  - Run: `gotestsum --format testname`

### IDE Extensions

- **gopls** (Go Language Server): Official language server
  - Provides code completion, navigation, refactoring
  - Used by VS Code Go extension and other editors

- **VS Code Go Extension**: Rich Go support
  - Auto-formatting on save
  - Test discovery and running
  - Debugging support
  - Linter integration

### Pre-commit Configuration

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/dnephin/pre-commit-golang
    rev: v0.5.1
    hooks:
      - id: go-fmt
      - id: go-imports
      - id: go-vet
      - id: go-lint
      - id: go-mod-tidy

  - repo: https://github.com/golangci/golangci-lint
    rev: v1.55.2
    hooks:
      - id: golangci-lint
```

## Complete Example

### HTTP API Server

```go
// cmd/api/main.go
package main

import (
    "context"
    "log"
    "os"
    "os/signal"
    "syscall"
    "time"

    "github.com/myorg/myproject/internal/config"
    "github.com/myorg/myproject/internal/handler"
    "github.com/myorg/myproject/internal/repository"
    "github.com/myorg/myproject/internal/service"
    "go.uber.org/zap"
)

func main() {
    // Initialize logger
    logger, err := zap.NewProduction()
    if err != nil {
        log.Fatalf("Failed to initialize logger: %v", err)
    }
    defer logger.Sync()

    // Load configuration
    cfg, err := config.Load("config.yaml")
    if err != nil {
        logger.Fatal("Failed to load configuration", zap.Error(err))
    }

    // Run application
    if err := run(cfg, logger); err != nil {
        logger.Fatal("Application error", zap.Error(err))
    }
}

func run(cfg *config.Config, logger *zap.Logger) error {
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()

    // Handle shutdown signals
    sigChan := make(chan os.Signal, 1)
    signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

    go func() {
        <-sigChan
        logger.Info("Shutdown signal received")
        cancel()
    }()

    // Initialize database
    db, err := repository.NewDatabase(ctx, cfg.Database)
    if err != nil {
        return err
    }
    defer db.Close()

    // Initialize repositories
    userRepo := repository.NewUserRepository(db)

    // Initialize services
    userService := service.NewUserService(userRepo, logger)

    // Initialize handlers
    userHandler := handler.NewUserHandler(userService, logger)

    // Setup HTTP server
    server := handler.NewServer(cfg.Server, userHandler, logger)

    // Start server
    return server.Run(ctx)
}
```

```go
// internal/handler/user.go
package handler

import (
    "encoding/json"
    "net/http"
    "strconv"

    "github.com/go-chi/chi/v5"
    "github.com/myorg/myproject/internal/model"
    "github.com/myorg/myproject/internal/service"
    "go.uber.org/zap"
)

type UserHandler struct {
    service *service.UserService
    logger  *zap.Logger
}

func NewUserHandler(service *service.UserService, logger *zap.Logger) *UserHandler {
    return &UserHandler{
        service: service,
        logger:  logger,
    }
}

func (h *UserHandler) Routes() chi.Router {
    r := chi.NewRouter()
    r.Post("/", h.Create)
    r.Get("/{id}", h.GetByID)
    r.Put("/{id}", h.Update)
    r.Delete("/{id}", h.Delete)
    r.Get("/", h.List)
    return r
}

func (h *UserHandler) Create(w http.ResponseWriter, r *http.Request) {
    var req model.CreateUserRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        h.error(w, http.StatusBadRequest, "Invalid request body")
        return
    }

    user, err := h.service.Create(r.Context(), req)
    if err != nil {
        h.logger.Error("Failed to create user", zap.Error(err))
        h.error(w, http.StatusInternalServerError, "Failed to create user")
        return
    }

    h.json(w, http.StatusCreated, user)
}

func (h *UserHandler) GetByID(w http.ResponseWriter, r *http.Request) {
    id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
    if err != nil {
        h.error(w, http.StatusBadRequest, "Invalid user ID")
        return
    }

    user, err := h.service.GetByID(r.Context(), id)
    if err != nil {
        if err == service.ErrNotFound {
            h.error(w, http.StatusNotFound, "User not found")
            return
        }
        h.logger.Error("Failed to get user", zap.Error(err))
        h.error(w, http.StatusInternalServerError, "Failed to get user")
        return
    }

    h.json(w, http.StatusOK, user)
}

func (h *UserHandler) Update(w http.ResponseWriter, r *http.Request) {
    id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
    if err != nil {
        h.error(w, http.StatusBadRequest, "Invalid user ID")
        return
    }

    var req model.UpdateUserRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        h.error(w, http.StatusBadRequest, "Invalid request body")
        return
    }

    user, err := h.service.Update(r.Context(), id, req)
    if err != nil {
        if err == service.ErrNotFound {
            h.error(w, http.StatusNotFound, "User not found")
            return
        }
        h.logger.Error("Failed to update user", zap.Error(err))
        h.error(w, http.StatusInternalServerError, "Failed to update user")
        return
    }

    h.json(w, http.StatusOK, user)
}

func (h *UserHandler) Delete(w http.ResponseWriter, r *http.Request) {
    id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
    if err != nil {
        h.error(w, http.StatusBadRequest, "Invalid user ID")
        return
    }

    if err := h.service.Delete(r.Context(), id); err != nil {
        if err == service.ErrNotFound {
            h.error(w, http.StatusNotFound, "User not found")
            return
        }
        h.logger.Error("Failed to delete user", zap.Error(err))
        h.error(w, http.StatusInternalServerError, "Failed to delete user")
        return
    }

    w.WriteHeader(http.StatusNoContent)
}

func (h *UserHandler) List(w http.ResponseWriter, r *http.Request) {
    users, err := h.service.List(r.Context())
    if err != nil {
        h.logger.Error("Failed to list users", zap.Error(err))
        h.error(w, http.StatusInternalServerError, "Failed to list users")
        return
    }

    h.json(w, http.StatusOK, users)
}

func (h *UserHandler) json(w http.ResponseWriter, status int, data interface{}) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(data)
}

func (h *UserHandler) error(w http.ResponseWriter, status int, message string) {
    h.json(w, status, map[string]string{"error": message})
}
```

## References

### Official Documentation

- [Effective Go](https://go.dev/doc/effective_go)
- [Go Code Review Comments](https://go.dev/wiki/CodeReviewComments)
- [Go Documentation](https://go.dev/doc/)
- [Go Blog](https://go.dev/blog/)

### Community Style Guides

- [Uber Go Style Guide](https://github.com/uber-go/guide/blob/master/style.md)
- [Google Go Style Guide](https://google.github.io/styleguide/go/)
- [Standard Go Project Layout](https://github.com/golang-standards/project-layout)

### Books and Resources

- [The Go Programming Language](https://www.gopl.io/) - Donovan & Kernighan
- [Go in Action](https://www.manning.com/books/go-in-action) - Kennedy, Ketelsen & Martin
- [Concurrency in Go](https://www.oreilly.com/library/view/concurrency-in-go/9781491941294/) - Cox-Buday

### Tools Documentation

- [golangci-lint](https://golangci-lint.run/)
- [gopls](https://pkg.go.dev/golang.org/x/tools/gopls)
- [Go Testing](https://pkg.go.dev/testing)

### Related Guides

- [Terraform Style Guide](terraform.md) - Go is used for Terraform providers
- [Kubernetes Style Guide](kubernetes.md) - Go is used for Kubernetes operators
- [Docker Style Guide](dockerfile.md) - Multi-stage builds for Go applications
- [Metadata Schema Reference](../03_metadata_schema/schema_reference.md)

---

**Maintainer**: Tyler Dukes
