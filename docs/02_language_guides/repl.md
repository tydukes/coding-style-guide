---
title: "REPL and Interactive Shell Best Practices"
description: "Standards for REPL usage patterns and interactive shell workflows across Python, Node.js, Terraform, Kubernetes, and database shells"
author: "Tyler Dukes"
tags: [repl, interactive, debugging, python, nodejs, terraform, kubernetes, database]
category: "Language Guides"
status: "active"
---

## Language Overview

**REPL** (Read-Eval-Print Loop) environments provide interactive shells for
exploratory coding, debugging, and operational tasks. This guide covers best
practices for using REPLs effectively across multiple languages and tools.

### Key Characteristics

- **Paradigm**: Interactive, expression-oriented evaluation
- **Feedback Loop**: Immediate execution and output
- **Use Cases**: Prototyping, debugging, data exploration, infrastructure inspection
- **Environments**: Language shells, infrastructure consoles, database clients

### This Style Guide Covers

- Python REPL (IPython, ptpython)
- Node.js REPL
- Terraform console
- Kubernetes interactive shells (kubectl)
- Database shells (psql, mysql, redis-cli)
- REPL-driven development workflows
- Security and history management

---

## Quick Reference

| **Category** | **Convention** | **Example** | **Notes** |
|-------------|----------------|-------------|-----------|
| **Python** | | | |
| Standard REPL | `python3` | `python3 -i script.py` | Built-in interactive mode |
| Enhanced REPL | IPython | `ipython --profile=dev` | Auto-completion, magic commands |
| Alternative REPL | ptpython | `ptpython` | Better multiline editing |
| **Node.js** | | | |
| Standard REPL | `node` | `node --experimental-repl-await` | Built-in REPL |
| Inspect mode | `node inspect` | `node --inspect` | Chrome DevTools integration |
| **Infrastructure** | | | |
| Terraform | `terraform console` | `terraform console -var-file=dev.tfvars` | Expression evaluation |
| Kubernetes | `kubectl exec` | `kubectl exec -it pod -- /bin/sh` | Container shell access |
| Kubernetes debug | `kubectl debug` | `kubectl debug -it pod --image=busybox` | Ephemeral debug containers |
| **Database** | | | |
| PostgreSQL | `psql` | `psql -h host -U user -d db` | Interactive SQL |
| MySQL | `mysql` | `mysql -h host -u user -p db` | Interactive SQL |
| Redis | `redis-cli` | `redis-cli -h host -p 6379` | Key-value operations |
| **Best Practices** | | | |
| History | Persistent | `~/.python_history` | Enable across sessions |
| Credentials | Environment vars | `PGPASSWORD` or `.pgpass` | Never type passwords inline |
| Sessions | Save work | `.save session.py` | Preserve REPL discoveries |

---

## Python REPL

### Standard Python REPL

Use `python3 -i` to drop into an interactive session after running a script.

```python
# Launch interactive mode after script execution
# Useful for inspecting state after a script runs
python3 -i my_script.py

# Launch with specific startup commands
python3 -c "import os; print(os.getcwd())" -i

# Use PYTHONSTARTUP for automatic imports
# ~/.pythonstartup.py
import os
import sys
import json
from pathlib import Path
from datetime import datetime, timedelta
from pprint import pprint

# Enable tab completion in standard REPL
import readline
import rlcompleter
readline.parse_and_bind("tab: complete")

# Enable persistent history
import atexit
HISTFILE = os.path.expanduser("~/.python_history")
try:
    readline.read_history_file(HISTFILE)
except FileNotFoundError:
    pass
atexit.register(readline.write_history_file, HISTFILE)
```

```bash
# Set PYTHONSTARTUP in shell profile
export PYTHONSTARTUP="$HOME/.pythonstartup.py"
```

### IPython Configuration

IPython is the recommended Python REPL for development workflows.

```python
# Install IPython with extras
# pip install ipython[all]

# ~/.ipython/profile_default/ipython_config.py
c = get_config()

# Auto-reload modules when they change on disk
c.InteractiveShellApp.extensions = ["autoreload"]
c.InteractiveShellApp.exec_lines = ["%autoreload 2"]

# Display settings
c.InteractiveShell.colors = "Linux"
c.InteractiveShell.confirm_exit = False
c.InteractiveShell.editor = "vim"

# History settings
c.HistoryManager.hist_file = "~/.ipython/profile_default/history.sqlite"
c.HistoryManager.db_log_output = True

# Logging - automatically log all input/output
c.InteractiveShell.logstart = False
c.InteractiveShell.logfile = ""

# Autocall - call functions without parentheses (0=off, 1=smart, 2=full)
c.InteractiveShell.autocall = 0

# Enable async/await at the top level
c.InteractiveShell.loop_runner = "asyncio"
c.InteractiveShell.autoawait = True
```

```python
# ~/.ipython/profile_default/startup/00-imports.py
# Automatically loaded on IPython startup

import os
import sys
import json
import logging
from pathlib import Path
from datetime import datetime, timedelta, timezone
from collections import defaultdict, Counter
from pprint import pprint
from typing import Any, Dict, List, Optional

# DevOps-specific imports (load if available)
try:
    import boto3
    import botocore
except ImportError:
    pass

try:
    import requests
except ImportError:
    pass

try:
    import yaml
except ImportError:
    pass

# Utility functions available in every session
def pp(obj: Any) -> None:
    """Pretty-print with type information."""
    print(f"Type: {type(obj).__name__}")
    pprint(obj)

def load_json(path: str) -> dict:
    """Quick JSON file loader."""
    return json.loads(Path(path).read_text())

def load_yaml(path: str) -> dict:
    """Quick YAML file loader."""
    return yaml.safe_load(Path(path).read_text())

def env(name: str, default: str = "") -> str:
    """Quick environment variable lookup."""
    return os.environ.get(name, default)
```

### IPython Magic Commands

```python
# Time execution of a single statement
%timeit sorted(range(1000))
# Output: 28.4 us +/- 1.23 us per loop

# Time execution of a cell (multiline)
%%timeit
data = list(range(10000))
sorted(data)
# Output: 342 us +/- 12.5 us per loop

# Run a script and keep variables in namespace
%run my_analysis.py

# Run a script in debugger mode
%run -d my_analysis.py

# Profile code execution
%prun expensive_function()

# Line-by-line profiling (requires line_profiler)
%lprun -f my_function my_function(args)

# Show source code of a function
%psource my_function

# Show documentation
%pdoc my_function

# Quick reference for an object
my_object?

# Detailed reference with source code
my_object??

# List all variables in namespace
%who
%whos

# Reset namespace (clear all variables)
%reset -f

# Save session commands to file
%save my_session.py 1-50

# Load and execute a file
%load my_script.py

# Edit and execute in external editor
%edit my_function

# View command history
%history
%history -n 1-20

# Search history
%history -g "import*boto"

# System shell commands
!ls -la
!git status
files = !ls *.py
print(files)

# Change directory
%cd /path/to/project

# Bookmark directories
%bookmark project /path/to/project
%cd -b project

# Store variables between sessions
%store my_variable
%store -r  # Restore stored variables

# Auto-reload modules (with extension loaded)
%autoreload 2
```

### IPython Debugging

```python
# Drop into debugger on exception
%pdb on

# Set breakpoint in code
def process_data(items):
    for item in items:
        if item.get("status") == "error":
            breakpoint()  # Drops into pdb/ipdb
        process_item(item)

# Post-mortem debugging after exception
%debug

# IPython debugger commands in pdb/ipdb
# n - next line
# s - step into function
# c - continue execution
# p variable - print variable
# pp variable - pretty-print variable
# l - list source code
# w - show call stack
# u - move up in call stack
# d - move down in call stack
# b 42 - set breakpoint at line 42
# b module:42 - set breakpoint in module at line 42
# cl - clear breakpoints
# q - quit debugger

# Embed IPython in any script for interactive debugging
from IPython import embed

def complex_calculation(data):
    intermediate = transform(data)
    embed()  # Opens IPython shell here with local variables
    return finalize(intermediate)

# Use ipdb for enhanced debugging
# pip install ipdb
import ipdb

def process_pipeline(config):
    pipeline = build_pipeline(config)
    ipdb.set_trace()  # Enhanced pdb with IPython features
    result = pipeline.run()
    return result
```

### ptpython Configuration

```python
# ~/.config/ptpython/config.py
from ptpython.layout import CompletionVisualisation

def configure(repl):
    # Use vi or emacs keybindings
    repl.vi_mode = False

    # Enable mouse support
    repl.enable_mouse_support = True

    # Show function signature popup
    repl.show_signature = True

    # Show docstring popup
    repl.show_docstring = True

    # Highlight matching parentheses
    repl.highlight_matching_parenthesis = True

    # Completion style
    repl.completion_visualisation = CompletionVisualisation.POP_UP

    # Show line numbers
    repl.show_line_numbers = True

    # Enable auto-suggestions from history
    repl.enable_auto_suggest = True

    # Confirm on exit
    repl.confirm_exit = False

    # Enable input validation (syntax checking)
    repl.enable_input_validation = True

    # Color scheme
    repl.color_depth = "DEPTH_24_BIT"
    repl.use_code_colorscheme("monokai")

    # Enable title in terminal
    repl.enable_title = True

    # Paste mode - handle multiline paste correctly
    repl.paste_mode = False
    repl.enable_open_in_editor = True
```

---

## Node.js REPL

### Built-in REPL

```javascript
// Launch Node.js REPL with top-level await support
// node --experimental-repl-await

// Basic REPL usage
> const fs = require('fs');
> const path = require('path');
> const { promisify } = require('util');

// Top-level await (with --experimental-repl-await or Node 16+)
> const data = await fs.promises.readFile('config.json', 'utf8');
> const config = JSON.parse(data);
> console.log(config.database.host);

// Multi-line input (use .editor mode)
> .editor
function calculateMetrics(data) {
    return {
        count: data.length,
        sum: data.reduce((a, b) => a + b, 0),
        avg: data.reduce((a, b) => a + b, 0) / data.length,
        min: Math.min(...data),
        max: Math.max(...data)
    };
}
// Press Ctrl+D to execute

> calculateMetrics([10, 20, 30, 40, 50]);
// { count: 5, sum: 150, avg: 30, min: 10, max: 50 }

// Underscore holds last result
> Math.sqrt(144)
12
> _ + 8
20

// REPL commands
> .help      // Show available commands
> .break     // Abort multiline expression
> .clear     // Reset REPL context
> .editor    // Enter multiline editor mode
> .exit      // Exit REPL
> .save file.js   // Save session to file
> .load file.js   // Load and execute file
```

### Custom REPL Server

```javascript
// repl-server.js - Create a custom REPL with preloaded context
const repl = require("repl");
const fs = require("fs");
const path = require("path");

// Start custom REPL with project context
const replServer = repl.start({
    prompt: "app> ",
    useColors: true,
    preview: true,
    terminal: true,
});

// Preload commonly used modules
replServer.context.fs = fs;
replServer.context.path = path;
replServer.context._ = require("lodash");

// Add database connection
const { Pool } = require("pg");
replServer.context.db = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Add helper functions
replServer.context.query = async (sql, params) => {
    const result = await replServer.context.db.query(sql, params);
    console.table(result.rows);
    return result.rows;
};

replServer.context.findUser = async (email) => {
    return replServer.context.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
    );
};

// Enable command history persistence
const historyFile = path.join(
    process.env.HOME,
    ".node_repl_history"
);

try {
    const history = fs.readFileSync(historyFile, "utf8");
    history.split("\n").reverse().filter(Boolean).forEach((line) => {
        replServer.history.push(line);
    });
} catch {
    // No history file yet
}

replServer.on("exit", () => {
    fs.writeFileSync(
        historyFile,
        replServer.history.join("\n")
    );
    process.exit();
});

// Custom commands
replServer.defineCommand("models", {
    help: "List all database models",
    action() {
        const models = fs.readdirSync("./models")
            .filter((f) => f.endsWith(".js"));
        console.log("Available models:", models);
        this.displayPrompt();
    },
});

replServer.defineCommand("routes", {
    help: "List all API routes",
    action() {
        const routes = require("./routes");
        console.table(routes.stack.map((r) => ({
            method: r.route?.method || "USE",
            path: r.route?.path || r.regexp,
        })));
        this.displayPrompt();
    },
});
```

### Node.js REPL for API Testing

```javascript
// api-repl.js - REPL preconfigured for API exploration
const repl = require("repl");

async function startApiRepl() {
    // Dynamic import for ESM modules
    const fetch = (await import("node-fetch")).default;

    const replServer = repl.start({ prompt: "api> " });

    const BASE_URL = process.env.API_URL || "http://localhost:3000";

    // HTTP helper methods
    replServer.context.get = async (path, headers = {}) => {
        const res = await fetch(`${BASE_URL}${path}`, {
            headers: {
                "Content-Type": "application/json",
                ...headers,
            },
        });
        const data = await res.json();
        console.log(`Status: ${res.status}`);
        console.log(JSON.stringify(data, null, 2));
        return data;
    };

    replServer.context.post = async (path, body, headers = {}) => {
        const res = await fetch(`${BASE_URL}${path}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...headers,
            },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        console.log(`Status: ${res.status}`);
        console.log(JSON.stringify(data, null, 2));
        return data;
    };

    replServer.context.put = async (path, body, headers = {}) => {
        const res = await fetch(`${BASE_URL}${path}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...headers,
            },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        console.log(`Status: ${res.status}`);
        console.log(JSON.stringify(data, null, 2));
        return data;
    };

    replServer.context.del = async (path, headers = {}) => {
        const res = await fetch(`${BASE_URL}${path}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                ...headers,
            },
        });
        console.log(`Status: ${res.status}`);
        if (res.status !== 204) {
            const data = await res.json();
            console.log(JSON.stringify(data, null, 2));
            return data;
        }
    };

    // Auth helper
    let authToken = null;
    replServer.context.login = async (email, password) => {
        const data = await replServer.context.post("/auth/login", {
            email,
            password,
        });
        authToken = data.token;
        replServer.context.authHeaders = {
            Authorization: `Bearer ${authToken}`,
        };
        console.log("Logged in. Use authHeaders in requests.");
        return data;
    };

    console.log(`API REPL connected to: ${BASE_URL}`);
    console.log("Available: get(path), post(path, body),");
    console.log("           put(path, body), del(path), login(email, pw)");
}

startApiRepl();
```

---

## Terraform Console

### Expression Evaluation

```hcl
# Launch terraform console with variable file
# terraform console -var-file=environments/dev.tfvars

# Inspect resource attributes
> aws_vpc.main.id
"vpc-0abc123def456"

> aws_vpc.main.cidr_block
"10.0.0.0/16"

# Inspect lists and maps
> aws_subnet.private[*].id
[
  "subnet-0abc123",
  "subnet-0def456",
  "subnet-0ghi789",
]

> aws_subnet.private[*].availability_zone
[
  "us-east-1a",
  "us-east-1b",
  "us-east-1c",
]

# Test string interpolation
> "arn:aws:s3:::${var.bucket_name}/*"
"arn:aws:s3:::my-app-bucket/*"

# Test conditional expressions
> var.environment == "prod" ? 3 : 1
1

# Test for_each and for expressions
> { for s in aws_subnet.private : s.availability_zone => s.id }
{
  "us-east-1a" = "subnet-0abc123"
  "us-east-1b" = "subnet-0def456"
  "us-east-1c" = "subnet-0ghi789"
}

# Test list comprehensions
> [for s in var.subnets : s.cidr if s.public]
[
  "10.0.1.0/24",
  "10.0.2.0/24",
]

# Test functions
> cidrsubnet("10.0.0.0/16", 8, 1)
"10.0.1.0/24"

> cidrsubnet("10.0.0.0/16", 8, 2)
"10.0.2.0/24"

> formatdate("YYYY-MM-DD", timestamp())
"2025-01-15"

> length(var.availability_zones)
3

> lookup(var.instance_types, var.environment, "t3.micro")
"t3.large"

# Test regex
> regex("^([a-z]+)-([0-9]+)$", "app-123")
[
  "app",
  "123",
]

> can(regex("^[a-z]+$", var.name))
true

# Test type conversion
> tolist(toset(["a", "b", "a", "c"]))
[
  "a",
  "b",
  "c",
]

> tonumber("42")
42

> tobool("true")
true

# Inspect module outputs
> module.vpc.vpc_id
"vpc-0abc123def456"

> module.vpc.private_subnet_ids
[
  "subnet-0abc123",
  "subnet-0def456",
]

# Test jsonencode/jsondecode
> jsonencode({
    name = var.app_name
    env  = var.environment
    tags = var.common_tags
  })
"{\"env\":\"dev\",\"name\":\"myapp\",\"tags\":{\"team\":\"platform\"}}"

> jsondecode(file("config.json"))
{
  "database" = {
    "host" = "localhost"
    "port" = 5432
  }
}
```

### Terraform Console for Debugging

```hcl
# Test complex merge operations before applying
> merge(
    var.common_tags,
    {
      Name        = "${var.project}-${var.environment}"
      ManagedBy   = "terraform"
      Environment = var.environment
    }
  )
{
  "Environment" = "dev"
  "ManagedBy"   = "terraform"
  "Name"        = "myapp-dev"
  "Owner"       = "platform-team"
  "Project"     = "myapp"
}

# Validate CIDR calculations
> [for i in range(4) : cidrsubnet("10.0.0.0/16", 8, i)]
[
  "10.0.0.0/24",
  "10.0.1.0/24",
  "10.0.2.0/24",
  "10.0.3.0/24",
]

# Test templatefile rendering
> templatefile("templates/user_data.sh.tpl", {
    cluster_name    = var.cluster_name
    region          = var.region
    node_labels     = join(",", var.node_labels)
  })
"#!/bin/bash\nset -euo pipefail\n..."

# Inspect data source results
> data.aws_ami.ubuntu.id
"ami-0abc123def456"

> data.aws_ami.ubuntu.name
"ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-20250101"

# Test try() for error handling
> try(var.optional_config.database.host, "localhost")
"localhost"

> try(tonumber("not-a-number"), 0)
0

# Test coalesce for default values
> coalesce(var.custom_domain, "${var.app_name}.example.com")
"myapp.example.com"

> coalescelist(var.custom_cidrs, ["10.0.0.0/16"])
[
  "10.0.0.0/16",
]
```

---

## Kubernetes Interactive Shells

### kubectl exec

```bash
# Execute a command in a running container
kubectl exec -it deployment/myapp -- /bin/bash

# Execute in a specific container within a multi-container pod
kubectl exec -it pod/myapp-5d4f6b7c8-abc12 \
    -c sidecar-container -- /bin/sh

# Run a single command without interactive shell
kubectl exec pod/myapp-5d4f6b7c8-abc12 -- \
    cat /app/config/settings.yaml

# Execute with namespace
kubectl exec -it deployment/myapp \
    -n production -- /bin/bash

# Check environment variables in a container
kubectl exec pod/myapp-5d4f6b7c8-abc12 -- env | sort

# Inspect mounted secrets
kubectl exec pod/myapp-5d4f6b7c8-abc12 -- \
    ls -la /var/run/secrets/kubernetes.io/serviceaccount/

# Test network connectivity from within a pod
kubectl exec -it pod/myapp-5d4f6b7c8-abc12 -- \
    curl -s http://other-service:8080/health

# Check DNS resolution
kubectl exec -it pod/myapp-5d4f6b7c8-abc12 -- \
    nslookup other-service.default.svc.cluster.local
```

### kubectl debug (Ephemeral Containers)

```bash
# Debug a running pod with an ephemeral debug container
kubectl debug -it pod/myapp-5d4f6b7c8-abc12 \
    --image=busybox:latest \
    --target=myapp

# Debug with a full toolkit image
kubectl debug -it pod/myapp-5d4f6b7c8-abc12 \
    --image=nicolaka/netshoot \
    --target=myapp

# Create a debug copy of a pod with a different image
kubectl debug pod/myapp-5d4f6b7c8-abc12 -it \
    --copy-to=myapp-debug \
    --container=myapp \
    --image=myapp:debug

# Debug a node
kubectl debug node/worker-node-1 -it \
    --image=busybox:latest

# Common debugging commands inside debug containers
# Check network connectivity
ping other-service
nslookup kubernetes.default.svc.cluster.local
curl -v http://service-name:8080/health
wget -qO- http://service-name:8080/metrics

# Check filesystem and processes
ls -la /proc/1/root/app/
cat /proc/1/environ | tr '\0' '\n'
ps aux

# Network diagnostics
ss -tlnp
netstat -an
tcpdump -i eth0 -n port 8080
iptables -L -n
```

### kubectl run for Interactive Pods

```bash
# Run an interactive pod for troubleshooting
kubectl run debug-shell --rm -it \
    --image=busybox:latest \
    --restart=Never -- /bin/sh

# Run with a specific service account
kubectl run debug-shell --rm -it \
    --image=busybox:latest \
    --restart=Never \
    --serviceaccount=myapp-sa -- /bin/sh

# Run a curl pod for API testing
kubectl run curl-test --rm -it \
    --image=curlimages/curl:latest \
    --restart=Never -- \
    curl -s http://myapp-service:8080/api/health

# Run a DNS debugging pod
kubectl run dns-debug --rm -it \
    --image=registry.k8s.io/e2e-test-images/jessie-dnsutils:1.3 \
    --restart=Never -- /bin/bash

# Inside DNS debug pod
nslookup kubernetes.default
dig myapp-service.default.svc.cluster.local
host myapp-service

# Run a database client pod
kubectl run psql-client --rm -it \
    --image=postgres:16 \
    --restart=Never \
    --env="PGPASSWORD=$DB_PASSWORD" -- \
    psql -h db-service -U myuser -d mydb

# Run a Redis client pod
kubectl run redis-client --rm -it \
    --image=redis:7 \
    --restart=Never -- \
    redis-cli -h redis-service -p 6379

# Run with resource limits
kubectl run debug-shell --rm -it \
    --image=busybox:latest \
    --restart=Never \
    --limits="cpu=200m,memory=256Mi" -- /bin/sh

# Run in a specific namespace with labels
kubectl run debug-shell --rm -it \
    --namespace=production \
    --image=busybox:latest \
    --restart=Never \
    --labels="app=debug,team=platform" -- /bin/sh
```

---

## Database Shells

### PostgreSQL (psql)

```sql
-- Connect to PostgreSQL
-- psql -h localhost -U myuser -d mydb -p 5432

-- Connection with SSL
-- psql "host=db.example.com dbname=mydb user=myuser sslmode=require"

-- psql meta-commands
\l                          -- List all databases
\c mydb                     -- Connect to database
\dt                         -- List tables in current schema
\dt+                        -- List tables with size info
\dt public.*                -- List tables in public schema
\d users                    -- Describe table structure
\d+ users                   -- Detailed table description
\di                         -- List indexes
\di+ users                  -- List indexes for specific table
\dv                         -- List views
\df                         -- List functions
\dn                         -- List schemas
\du                         -- List roles/users
\dp                         -- List access privileges
\dx                         -- List installed extensions

-- Query formatting
\x                          -- Toggle expanded display (vertical)
\x auto                     -- Auto-switch based on width
\pset format csv            -- Output as CSV
\pset format html           -- Output as HTML
\pset border 2              -- Full table borders
\timing                     -- Show query execution time

-- Save output to file
\o output.csv
SELECT * FROM users WHERE status = 'active';
\o                          -- Stop writing to file

-- Execute SQL from file
\i /path/to/migration.sql

-- Edit query in external editor
\e

-- Show last error in detail
\errverbose

-- Variable substitution
\set active_status 'active'
SELECT * FROM users WHERE status = :'active_status';

-- Transaction control
BEGIN;
UPDATE users SET status = 'inactive' WHERE last_login < NOW() - INTERVAL '1 year';
-- Inspect before committing
SELECT COUNT(*) FROM users WHERE status = 'inactive';
ROLLBACK;  -- or COMMIT;

-- Useful psql configuration (~/.psqlrc)
-- \set QUIET 1
-- \pset null '[NULL]'
-- \set HISTFILE ~/.psql_history-:DBNAME
-- \set HISTCONTROL ignoredups
-- \set COMP_KEYWORD_CASE upper
-- \timing
-- \x auto
-- \set PROMPT1 '%[%033[1;32m%]%n@%/%[%033[0m%] %# '
-- \set QUIET 0
```

```bash
# ~/.psqlrc - PostgreSQL interactive configuration
\set QUIET 1

-- Show NULL values explicitly
\pset null '[NULL]'

-- Separate history per database
\set HISTFILE ~/.psql_history- :DBNAME

-- Ignore duplicate commands in history
\set HISTCONTROL ignoredups

-- Auto-complete keywords in uppercase
\set COMP_KEYWORD_CASE upper

-- Show query timing
\timing

-- Auto-expand for wide results
\x auto

-- Custom prompt: user@database=#
\set PROMPT1 '%n@%/%R%# '
\set PROMPT2 '%n@%/%R%# '

\set QUIET 0
\echo 'psql configured. Type \\? for help.'
```

### MySQL

```sql
-- Connect to MySQL
-- mysql -h localhost -u myuser -p mydb

-- MySQL meta-commands
SHOW DATABASES;
USE mydb;
SHOW TABLES;
DESCRIBE users;
SHOW CREATE TABLE users;
SHOW INDEX FROM users;
SHOW PROCESSLIST;
SHOW VARIABLES LIKE 'max_connections';
SHOW STATUS LIKE 'Threads%';
SHOW GRANTS FOR 'myuser'@'%';

-- Session configuration
SET SESSION group_concat_max_len = 1000000;
SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION';

-- Query profiling
SET profiling = 1;
SELECT * FROM users WHERE email = 'test@example.com';
SHOW PROFILES;
SHOW PROFILE FOR QUERY 1;

-- Explain query execution plan
EXPLAIN FORMAT=JSON
SELECT u.id, u.email, COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE u.status = 'active'
GROUP BY u.id, u.email
HAVING order_count > 5;

-- Safe update mode (prevents accidental mass updates)
SET SQL_SAFE_UPDATES = 1;

-- Output formatting
-- mysql --table (default tabular)
-- mysql --batch (tab-separated, no headers)
-- mysql --xml
-- mysql --html

-- Execute from command line
-- mysql -e "SELECT COUNT(*) FROM users" mydb
-- mysql < migration.sql
```

```ini
# ~/.my.cnf - MySQL client configuration
[mysql]
auto-rehash
prompt = "\\u@\\h [\\d]> "
pager = "less -SFX"
safe-updates
show-warnings

[client]
default-character-set = utf8mb4
```

### Redis CLI

```bash
# Connect to Redis
redis-cli -h localhost -p 6379

# Connect with authentication
redis-cli -h redis.example.com -p 6379 -a "$REDIS_PASSWORD"

# Connect to specific database
redis-cli -n 2

# Connect with TLS
redis-cli --tls --cert ./redis.crt --key ./redis.key \
    --cacert ./ca.crt -h redis.example.com
```

```redis
-- Redis interactive commands
PING
-- PONG

-- Key operations
SET user:1001 '{"name":"Alice","role":"admin"}'
GET user:1001
-- {"name":"Alice","role":"admin"}

DEL user:1001
EXISTS user:1001
-- (integer) 0

TYPE user:1001
TTL user:1001

-- Set with expiration
SETEX session:abc123 3600 '{"user_id":1001}'
TTL session:abc123
-- (integer) 3597

-- Key pattern search (use SCAN in production)
KEYS user:*
-- Warning: KEYS blocks Redis, use SCAN instead
SCAN 0 MATCH user:* COUNT 100

-- Hash operations
HSET user:1001 name "Alice" role "admin" login_count 42
HGET user:1001 name
HGETALL user:1001
HINCRBY user:1001 login_count 1

-- List operations
LPUSH notifications:1001 "New message from Bob"
LPUSH notifications:1001 "Order shipped"
LRANGE notifications:1001 0 -1
LLEN notifications:1001

-- Set operations
SADD online_users 1001 1002 1003
SMEMBERS online_users
SISMEMBER online_users 1001
SCARD online_users

-- Sorted set operations
ZADD leaderboard 100 "Alice" 85 "Bob" 92 "Charlie"
ZRANGE leaderboard 0 -1 WITHSCORES
ZREVRANGE leaderboard 0 2 WITHSCORES
ZSCORE leaderboard "Alice"

-- Server information
INFO server
INFO memory
INFO keyspace
INFO replication
DBSIZE
CONFIG GET maxmemory
CONFIG GET maxmemory-policy

-- Monitor commands in real-time (use sparingly)
MONITOR

-- Slow log analysis
SLOWLOG GET 10
SLOWLOG LEN
SLOWLOG RESET

-- Memory analysis
MEMORY USAGE user:1001
MEMORY DOCTOR
```

---

## REPL-Driven Development Workflows

### Exploratory Data Analysis

```python
# IPython workflow for exploring API responses
import requests
import json
from pprint import pprint

# Fetch and explore API data
response = requests.get(
    "https://api.example.com/v1/users",
    headers={"Authorization": f"Bearer {token}"},
)
data = response.json()

# Quick data inspection
type(data)            # dict
data.keys()           # dict_keys(['users', 'pagination'])
len(data["users"])    # 50

# Explore structure of first item
pprint(data["users"][0])
# {
#     'id': 1001,
#     'email': 'alice@example.com',
#     'role': 'admin',
#     'created_at': '2024-01-15T10:30:00Z',
#     'metadata': {'department': 'engineering', 'team': 'platform'}
# }

# Quick analysis with list comprehensions
roles = [u["role"] for u in data["users"]]
from collections import Counter
Counter(roles)
# Counter({'user': 35, 'admin': 10, 'moderator': 5})

# Filter and transform
admins = [
    {"email": u["email"], "team": u["metadata"].get("team")}
    for u in data["users"]
    if u["role"] == "admin"
]
pprint(admins[:3])

# Once exploration is done, formalize into a function
def get_users_by_role(role, token):
    """Fetch users filtered by role."""
    response = requests.get(
        "https://api.example.com/v1/users",
        headers={"Authorization": f"Bearer {token}"},
        params={"role": role},
    )
    response.raise_for_status()
    return response.json()["users"]

# Save the refined function
%save user_utils.py 25-35
```

### Infrastructure Debugging Workflow

```bash
#!/bin/bash
# REPL-style debugging workflow for infrastructure issues

# Step 1: Quick cluster health check
kubectl get nodes -o wide
kubectl top nodes
kubectl get pods --all-namespaces | grep -v Running

# Step 2: Interactive debugging session
kubectl run debug --rm -it \
    --image=nicolaka/netshoot \
    --restart=Never -- bash

# Inside the debug pod:
# Check DNS resolution
nslookup kubernetes.default.svc.cluster.local
dig +short myservice.default.svc.cluster.local

# Check connectivity to services
curl -s -o /dev/null -w "%{http_code}" \
    http://myservice:8080/health

# Check network policies
curl -s --connect-timeout 5 \
    http://restricted-service:8080/health || \
    echo "Connection blocked by network policy"

# Trace network path
traceroute myservice.default.svc.cluster.local
mtr --report myservice.default.svc.cluster.local

# Check certificate chain
openssl s_client -connect myservice:443 \
    -servername myservice.default.svc.cluster.local \
    </dev/null 2>/dev/null | \
    openssl x509 -noout -dates -subject -issuer
```

```python
# Boto3 REPL session for AWS debugging
import boto3
import json
from datetime import datetime, timedelta

session = boto3.Session(profile_name="dev")

# EC2 instance inspection
ec2 = session.client("ec2")
instances = ec2.describe_instances(
    Filters=[
        {"Name": "tag:Environment", "Values": ["production"]},
        {"Name": "instance-state-name", "Values": ["running"]},
    ]
)

# Quick summary
for reservation in instances["Reservations"]:
    for inst in reservation["Instances"]:
        name = next(
            (t["Value"] for t in inst.get("Tags", []) if t["Key"] == "Name"),
            "unnamed",
        )
        print(
            f"{name}: {inst['InstanceId']} "
            f"({inst['InstanceType']}) - {inst['PrivateIpAddress']}"
        )

# CloudWatch metrics exploration
cw = session.client("cloudwatch")
metrics = cw.get_metric_statistics(
    Namespace="AWS/EC2",
    MetricName="CPUUtilization",
    Dimensions=[
        {"Name": "InstanceId", "Value": "i-0abc123def456"},
    ],
    StartTime=datetime.utcnow() - timedelta(hours=1),
    EndTime=datetime.utcnow(),
    Period=300,
    Statistics=["Average", "Maximum"],
)

for point in sorted(metrics["Datapoints"], key=lambda x: x["Timestamp"]):
    print(
        f"{point['Timestamp'].strftime('%H:%M')} - "
        f"avg: {point['Average']:.1f}%, max: {point['Maximum']:.1f}%"
    )

# S3 bucket analysis
s3 = session.client("s3")
response = s3.list_objects_v2(
    Bucket="my-data-bucket",
    Prefix="logs/2025/01/",
    MaxKeys=10,
)
for obj in response.get("Contents", []):
    size_mb = obj["Size"] / (1024 * 1024)
    print(f"{obj['Key']} - {size_mb:.2f} MB - {obj['LastModified']}")
```

### Prototyping to Production Pattern

```python
# Step 1: Prototype in REPL
# IPython session - explore and iterate quickly

import hashlib
import json

# Experiment with hashing approaches
data = {"user_id": 1001, "action": "login", "timestamp": "2025-01-15T10:30:00Z"}
payload = json.dumps(data, sort_keys=True)
hash_value = hashlib.sha256(payload.encode()).hexdigest()
print(hash_value[:16])  # Short hash for deduplication

# Try different serialization approaches
# Test edge cases interactively
data_with_none = {"user_id": 1001, "action": None}
payload = json.dumps(data_with_none, sort_keys=True, default=str)
print(payload)  # Handles None -> "null"

# Step 2: Formalize into a function (still in REPL)
def compute_event_hash(event: dict) -> str:
    """Compute deterministic hash for event deduplication."""
    payload = json.dumps(event, sort_keys=True, default=str)
    return hashlib.sha256(payload.encode()).hexdigest()[:16]

# Test in REPL
assert compute_event_hash(data) == compute_event_hash(data)
assert compute_event_hash({"a": 1}) != compute_event_hash({"b": 1})
print("Tests pass")

# Step 3: Save to file
%save -f event_utils.py 8-12
```

```python
# Step 4: Production module (event_utils.py after cleanup)
"""Event utility functions for deduplication."""

import hashlib
import json
from typing import Any


def compute_event_hash(event: dict[str, Any]) -> str:
    """Compute deterministic hash for event deduplication.

    Args:
        event: Dictionary containing event data.

    Returns:
        16-character hexadecimal hash string.
    """
    payload = json.dumps(event, sort_keys=True, default=str)
    return hashlib.sha256(payload.encode()).hexdigest()[:16]
```

```python
# Step 5: Tests (test_event_utils.py)
"""Tests for event utility functions."""

import pytest
from event_utils import compute_event_hash


class TestComputeEventHash:
    """Tests for compute_event_hash."""

    def test_deterministic_output(self):
        """Same input produces same hash."""
        event = {"user_id": 1001, "action": "login"}
        assert compute_event_hash(event) == compute_event_hash(event)

    def test_different_input_different_hash(self):
        """Different inputs produce different hashes."""
        event_a = {"user_id": 1001, "action": "login"}
        event_b = {"user_id": 1002, "action": "login"}
        assert compute_event_hash(event_a) != compute_event_hash(event_b)

    def test_key_order_independent(self):
        """Hash is independent of key order."""
        event_a = {"action": "login", "user_id": 1001}
        event_b = {"user_id": 1001, "action": "login"}
        assert compute_event_hash(event_a) == compute_event_hash(event_b)

    def test_handles_none_values(self):
        """None values are handled correctly."""
        event = {"user_id": 1001, "action": None}
        result = compute_event_hash(event)
        assert isinstance(result, str)
        assert len(result) == 16

    def test_hash_length(self):
        """Hash output is exactly 16 characters."""
        event = {"key": "value"}
        assert len(compute_event_hash(event)) == 16
```

---

## Security Best Practices

### Credential Management in REPLs

```bash
# NEVER type passwords directly in REPL commands
# Bad - password visible in shell history
psql -h db.example.com -U admin -p mypassword mydb
mysql -u admin -pmypassword mydb
redis-cli -a mypassword

# Good - use environment variables
export PGPASSWORD="$(vault read -field=password secret/db)"
psql -h db.example.com -U admin mydb

# Good - use password file
# ~/.pgpass format: hostname:port:database:username:password
echo "db.example.com:5432:mydb:admin:$(vault read -field=password secret/db)" \
    > ~/.pgpass
chmod 600 ~/.pgpass
psql -h db.example.com -U admin mydb

# Good - use MySQL option file
cat > ~/.my.cnf << 'MYSQL_CONF'
[client]
user = admin
password = "${DB_PASSWORD}"
MYSQL_CONF
chmod 600 ~/.my.cnf

# Good - use Redis AUTH with environment variable
redis-cli -h redis.example.com -a "$REDIS_AUTH_TOKEN"

# Good - use connection strings from secret manager
export DATABASE_URL="$(aws secretsmanager get-secret-value \
    --secret-id prod/db --query SecretString --output text | \
    jq -r '.connection_string')"
psql "$DATABASE_URL"
```

### History Management

```bash
# Python - control history file permissions
chmod 600 ~/.python_history
chmod 600 ~/.ipython/profile_default/history.sqlite

# Disable history for sensitive sessions
# Python
PYTHONDONTWRITEBYTECODE=1 python3 -c "
import readline
readline.clear_history()
" -i

# IPython - disable history for session
ipython --HistoryManager.enabled=False

# Node.js - disable history
NODE_REPL_HISTORY="" node

# psql - disable history for session
PSQL_HISTORY=/dev/null psql -h db.example.com -U admin mydb

# MySQL - disable history
MYSQL_HISTFILE=/dev/null mysql -h db.example.com -u admin mydb

# Redis - commands with passwords are not logged by default
# But verify with CONFIG GET logfile

# Bash - temporarily disable history
set +o history
# ... sensitive commands ...
set -o history

# Clear specific history entries (bash)
history -d $(history | grep "password" | awk '{print $1}')
```

```python
# IPython - exclude sensitive patterns from history
# ~/.ipython/profile_default/ipython_config.py
c.HistoryManager.enabled = True

# Custom input transformer to warn about secrets
from IPython.core.inputtransformer2 import TransformerManager
import re

SENSITIVE_PATTERNS = [
    r'password\s*=\s*["\'][^"\']+["\']',
    r'secret\s*=\s*["\'][^"\']+["\']',
    r'token\s*=\s*["\'][^"\']+["\']',
    r'api_key\s*=\s*["\'][^"\']+["\']',
    r'AWS_SECRET_ACCESS_KEY\s*=\s*["\'][^"\']+["\']',
]

def check_for_secrets(lines):
    """Warn if input contains potential secrets."""
    combined = "\n".join(lines)
    for pattern in SENSITIVE_PATTERNS:
        if re.search(pattern, combined, re.IGNORECASE):
            print(
                "\033[91mWARNING: Input may contain secrets. "
                "Use environment variables instead.\033[0m"
            )
            break
    return lines
```

### Kubernetes RBAC for Interactive Sessions

```yaml
# rbac-debug-role.yaml
# Restrict interactive debugging to specific namespaces and actions
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: debug-shell-role
  namespace: staging
rules:
  # Allow exec into pods for debugging
  - apiGroups: [""]
    resources: ["pods/exec"]
    verbs: ["create"]

  # Allow ephemeral containers for debugging
  - apiGroups: [""]
    resources: ["pods/ephemeralcontainers"]
    verbs: ["patch"]

  # Allow viewing pod logs and status
  - apiGroups: [""]
    resources: ["pods", "pods/log"]
    verbs: ["get", "list"]

  # Allow creating temporary debug pods
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["create", "delete"]
    # Restrict to debug pods only
    resourceNames: ["debug-shell"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: debug-shell-binding
  namespace: staging
subjects:
  - kind: User
    name: developer@example.com
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: debug-shell-role
  apiGroup: rbac.authorization.k8s.io
```

---

## Anti-Patterns to Avoid

### Running Untested Code Directly in Production

```python
# Bad - running exploratory queries against production
import boto3

session = boto3.Session(profile_name="production")
ec2 = session.client("ec2")

# Dangerous: could accidentally terminate instances
ec2.terminate_instances(InstanceIds=["i-0abc123"])

# Good - use read-only sessions for exploration
import boto3
from botocore.config import Config

read_only_config = Config(
    parameter_validation=True,
    retries={"max_attempts": 0},
)

# Use a read-only IAM role
session = boto3.Session(profile_name="production-readonly")
ec2 = session.client("ec2", config=read_only_config)

# Safe: only describe/list operations
instances = ec2.describe_instances()
```

```sql
-- Bad - running unguarded updates in database REPL
UPDATE users SET status = 'inactive';
-- Oops: forgot WHERE clause, updated ALL users

-- Good - use transactions and verify before committing
BEGIN;

UPDATE users SET status = 'inactive'
WHERE last_login < NOW() - INTERVAL '2 years';

-- Check affected rows before committing
SELECT COUNT(*) FROM users
WHERE last_login < NOW() - INTERVAL '2 years';
-- Returns: 42 (expected range)

-- Verify with a sample
SELECT id, email, status, last_login FROM users
WHERE last_login < NOW() - INTERVAL '2 years'
LIMIT 5;

ROLLBACK;  -- Use ROLLBACK first, then COMMIT after verification
```

### Hardcoding Credentials in REPL Sessions

```python
# Bad - credentials in REPL history
db_password = "super_secret_password_123"
api_key = "sk-abc123def456"
conn = psycopg2.connect(
    host="db.example.com",
    password="super_secret_password_123",
)

# Good - use environment variables or secret managers
import os

db_password = os.environ["DB_PASSWORD"]
api_key = os.environ["API_KEY"]
conn = psycopg2.connect(
    host="db.example.com",
    password=os.environ["DB_PASSWORD"],
)

# Good - use credential helpers
import keyring

db_password = keyring.get_password("mydb", "admin")
conn = psycopg2.connect(
    host="db.example.com",
    password=keyring.get_password("mydb", "admin"),
)
```

### Using REPL Output as Production Configuration

```python
# Bad - copy-pasting REPL output into config files
# REPL session:
>>> import json
>>> config = {"workers": 4, "timeout": 30}
>>> print(json.dumps(config))
# Then manually pasting into config.json

# Good - generate configuration files programmatically
import json
from pathlib import Path


def generate_config(environment: str) -> dict:
    """Generate environment-specific configuration."""
    base = {
        "log_level": "INFO",
        "metrics_enabled": True,
    }
    overrides = {
        "dev": {"workers": 2, "timeout": 60, "debug": True},
        "staging": {"workers": 4, "timeout": 30, "debug": False},
        "prod": {"workers": 8, "timeout": 15, "debug": False},
    }
    return {**base, **overrides.get(environment, {})}


# Generate and write config
config = generate_config("prod")
Path("config.json").write_text(
    json.dumps(config, indent=2, sort_keys=True)
)
```

### Ignoring REPL Session Cleanup

```python
# Bad - leaving database connections open after REPL session
import psycopg2
conn = psycopg2.connect(dsn="postgresql://localhost/mydb")
cursor = conn.cursor()
cursor.execute("SELECT * FROM users")
# ... explore data, then close terminal without cleanup

# Good - use context managers even in REPL sessions
import psycopg2

with psycopg2.connect(dsn="postgresql://localhost/mydb") as conn:
    with conn.cursor() as cursor:
        cursor.execute("SELECT * FROM users LIMIT 10")
        for row in cursor.fetchall():
            print(row)
# Connection automatically closed

# Good - register cleanup with atexit
import atexit
import psycopg2

conn = psycopg2.connect(dsn="postgresql://localhost/mydb")
atexit.register(conn.close)

# Now safe to explore interactively
cursor = conn.cursor()
cursor.execute("SELECT COUNT(*) FROM users")
print(cursor.fetchone())
```

---

## Recommended Tools

### Python REPL Tools

| **Tool** | **Purpose** | **Install** |
|----------|-------------|-------------|
| IPython | Enhanced interactive Python | `pip install ipython` |
| ptpython | Advanced Python REPL with UI | `pip install ptpython` |
| bpython | Curses-based Python REPL | `pip install bpython` |
| ipdb | IPython-enhanced debugger | `pip install ipdb` |
| rich | Rich text formatting in REPL | `pip install rich` |

```python
# Rich integration with IPython for better output
from rich import print as rprint
from rich.table import Table
from rich.console import Console
from rich.syntax import Syntax

console = Console()

# Pretty-print data structures
rprint({"users": [{"name": "Alice"}, {"name": "Bob"}]})

# Display tables
table = Table(title="Active Services")
table.add_column("Service", style="cyan")
table.add_column("Status", style="green")
table.add_column("Port", style="magenta")
table.add_row("api", "running", "8080")
table.add_row("worker", "running", "N/A")
table.add_row("scheduler", "stopped", "N/A")
console.print(table)

# Syntax-highlighted code output
code = '''
def process_event(event: dict) -> None:
    """Process incoming event."""
    validate(event)
    transform(event)
    store(event)
'''
syntax = Syntax(code, "python", theme="monokai", line_numbers=True)
console.print(syntax)
```

### Node.js REPL Tools

| **Tool** | **Purpose** | **Install** |
|----------|-------------|-------------|
| ts-node | TypeScript REPL | `npm install -g ts-node` |
| ndb | Chrome DevTools debugger | `npm install -g ndb` |

```typescript
// ts-node REPL for TypeScript interactive development
// Launch: npx ts-node

// Type-safe exploration
interface User {
    id: number;
    email: string;
    role: "admin" | "user" | "moderator";
    createdAt: Date;
}

const users: User[] = [
    { id: 1, email: "alice@example.com", role: "admin", createdAt: new Date("2024-01-15") },
    { id: 2, email: "bob@example.com", role: "user", createdAt: new Date("2024-06-20") },
    { id: 3, email: "carol@example.com", role: "moderator", createdAt: new Date("2024-03-10") },
];

// Type-checked operations
const admins = users.filter((u): u is User & { role: "admin" } => u.role === "admin");
console.log(admins);

// TypeScript generics work in REPL
function groupBy<T, K extends string>(items: T[], key: (item: T) => K): Record<K, T[]> {
    return items.reduce(
        (groups, item) => {
            const k = key(item);
            (groups[k] = groups[k] || []).push(item);
            return groups;
        },
        {} as Record<K, T[]>,
    );
}

const grouped = groupBy(users, (u) => u.role);
console.log(JSON.stringify(grouped, null, 2));
```

### Database Tools

| **Tool** | **Purpose** | **Install** |
|----------|-------------|-------------|
| pgcli | Enhanced PostgreSQL client | `pip install pgcli` |
| mycli | Enhanced MySQL client | `pip install mycli` |
| litecli | Enhanced SQLite client | `pip install litecli` |
| usql | Universal SQL client | `go install github.com/xo/usql@latest` |
| iredis | Enhanced Redis client | `pip install iredis` |

```bash
# pgcli - PostgreSQL with auto-completion and syntax highlighting
pgcli -h localhost -U myuser -d mydb

# Features:
# - Smart auto-completion (tables, columns, functions)
# - Syntax highlighting
# - Multi-line query editing
# - Named queries (\ns save_name, \n save_name to execute)
# - Favorite queries
# - CSV/JSON output

# mycli - MySQL with auto-completion
mycli -h localhost -u myuser mydb

# iredis - Redis with auto-completion and syntax highlighting
iredis -h localhost -p 6379

# Features:
# - Auto-completion for Redis commands
# - Syntax highlighting
# - Pager support for large outputs
# - Command-line history with search
```

### Infrastructure Tools

| **Tool** | **Purpose** | **Install** |
|----------|-------------|-------------|
| k9s | Terminal-based Kubernetes UI | `brew install k9s` |
| stern | Multi-pod log tailing | `brew install stern` |
| kubectx/kubens | Context/namespace switching | `brew install kubectx` |

```bash
# k9s - interactive Kubernetes dashboard in terminal
k9s

# k9s keyboard shortcuts
# :pods          - View pods
# :deploy        - View deployments
# :svc           - View services
# :ns            - View namespaces
# :ctx           - View contexts
# /pattern       - Filter resources
# d              - Describe resource
# l              - View logs
# s              - Shell into container
# ctrl-d         - Delete resource
# y              - View YAML
# e              - Edit resource

# stern - tail logs from multiple pods
stern myapp --namespace production
stern "myapp-.*" --since 1h
stern myapp -c nginx --output json
stern myapp --exclude "health check"

# kubectx/kubens - quick context switching
kubectx production
kubectx -               # Switch to previous context
kubens kube-system
kubens -                # Switch to previous namespace
```

---

## Examples

### Complete Python REPL Debugging Session

```python
# Scenario: Investigating slow API responses
# Launch: ipython --profile=dev

import requests
import time
from statistics import mean, stdev

# Measure response times
def benchmark_endpoint(url, n=10):
    """Benchmark an API endpoint with multiple requests."""
    times = []
    errors = 0
    for i in range(n):
        try:
            start = time.perf_counter()
            response = requests.get(url, timeout=10)
            elapsed = time.perf_counter() - start
            times.append(elapsed)
            print(f"  Request {i+1}: {elapsed:.3f}s (status: {response.status_code})")
        except requests.RequestException as e:
            errors += 1
            print(f"  Request {i+1}: ERROR - {e}")

    if times:
        print(f"\nResults ({n} requests, {errors} errors):")
        print(f"  Mean:   {mean(times):.3f}s")
        print(f"  StdDev: {stdev(times):.3f}s" if len(times) > 1 else "")
        print(f"  Min:    {min(times):.3f}s")
        print(f"  Max:    {max(times):.3f}s")
    return times

# Run benchmarks
times_v1 = benchmark_endpoint("http://localhost:8080/api/v1/users")
# Request 1: 0.245s (status: 200)
# Request 2: 0.189s (status: 200)
# ...
# Results (10 requests, 0 errors):
#   Mean:   0.215s
#   StdDev: 0.032s
#   Min:    0.178s
#   Max:    0.287s

# Compare with v2 endpoint
times_v2 = benchmark_endpoint("http://localhost:8080/api/v2/users")

# Quick comparison
print(f"v1 avg: {mean(times_v1):.3f}s vs v2 avg: {mean(times_v2):.3f}s")
print(f"v2 is {mean(times_v1)/mean(times_v2):.1f}x faster")

# Investigate slow responses with detailed timing
response = requests.get(
    "http://localhost:8080/api/v1/users",
    timeout=10,
)
print(f"DNS:        {response.elapsed.total_seconds():.3f}s")
print(f"Status:     {response.status_code}")
print(f"Size:       {len(response.content)} bytes")
print(f"Headers:    {dict(response.headers)}")

# Check response headers for caching
print(f"Cache:      {response.headers.get('Cache-Control', 'none')}")
print(f"X-Request:  {response.headers.get('X-Request-Id', 'none')}")
```

### Complete Kubernetes Debugging Session

```bash
# Scenario: Pod keeps restarting in production

# Step 1: Identify the problem pod
kubectl get pods -n production -l app=payment-service
# NAME                               READY   STATUS             RESTARTS
# payment-service-7d8f9b6c5-x4k2n   0/1     CrashLoopBackOff   15

# Step 2: Check recent events
kubectl describe pod payment-service-7d8f9b6c5-x4k2n -n production | \
    grep -A 20 "Events:"
# Events:
#   Type     Reason     Age    Message
#   Warning  BackOff    2m     Back-off restarting failed container

# Step 3: Check logs from current and previous container
kubectl logs payment-service-7d8f9b6c5-x4k2n -n production --tail=50
kubectl logs payment-service-7d8f9b6c5-x4k2n -n production --previous --tail=50
# Error: FATAL: password authentication failed for user "payment_svc"

# Step 4: Verify the secret exists and is mounted
kubectl get secret payment-db-credentials -n production -o yaml
kubectl exec payment-service-7d8f9b6c5-x4k2n -n production -- \
    cat /var/run/secrets/db/password 2>/dev/null || \
    echo "Cannot read secret - container may not be running"

# Step 5: Test database connectivity from a debug pod
kubectl run db-debug --rm -it \
    --image=postgres:16 \
    --restart=Never \
    --namespace=production \
    --env="PGPASSWORD=$(kubectl get secret payment-db-credentials \
        -n production -o jsonpath='{.data.password}' | base64 -d)" \
    -- psql -h payment-db-service -U payment_svc -d payments -c "SELECT 1;"
# If this fails, the credentials in the secret are wrong

# Step 6: Check resource limits
kubectl top pod payment-service-7d8f9b6c5-x4k2n -n production
kubectl describe pod payment-service-7d8f9b6c5-x4k2n -n production | \
    grep -A 5 "Limits:"
#     Limits:
#       cpu:     500m
#       memory:  256Mi    <-- May be too low

# Step 7: Check if the issue is OOMKilled
kubectl get pod payment-service-7d8f9b6c5-x4k2n -n production \
    -o jsonpath='{.status.containerStatuses[0].lastState.terminated.reason}'
# OOMKilled
```

### Complete Terraform Console Session

```hcl
# Scenario: Planning network CIDR allocation for multi-environment setup
# Launch: terraform console -var-file=environments/dev.tfvars

# Calculate subnet CIDRs for a /16 VPC
# VPC CIDR: 10.0.0.0/16

# Public subnets: /24 each (256 IPs per subnet)
> [for i in range(3) : cidrsubnet("10.0.0.0/16", 8, i)]
[
  "10.0.0.0/24",
  "10.0.1.0/24",
  "10.0.2.0/24",
]

# Private subnets: /22 each (1024 IPs per subnet)
> [for i in range(3) : cidrsubnet("10.0.0.0/16", 6, i + 4)]
[
  "10.0.16.0/22",
  "10.0.20.0/22",
  "10.0.24.0/22",
]

# Database subnets: /26 each (64 IPs per subnet)
> [for i in range(3) : cidrsubnet("10.0.0.0/16", 10, i + 200)]
[
  "10.0.50.0/26",
  "10.0.50.64/26",
  "10.0.50.128/26",
]

# Verify no CIDR overlaps
> cidrcontains("10.0.0.0/24", "10.0.0.128")
true

> cidrcontains("10.0.0.0/24", "10.0.1.0")
false

# Build complete subnet map
> {
    public  = { for i in range(3) : "az${i + 1}" => cidrsubnet("10.0.0.0/16", 8, i) }
    private = { for i in range(3) : "az${i + 1}" => cidrsubnet("10.0.0.0/16", 6, i + 4) }
    data    = { for i in range(3) : "az${i + 1}" => cidrsubnet("10.0.0.0/16", 10, i + 200) }
  }
{
  "data" = {
    "az1" = "10.0.50.0/26"
    "az2" = "10.0.50.64/26"
    "az3" = "10.0.50.128/26"
  }
  "private" = {
    "az1" = "10.0.16.0/22"
    "az2" = "10.0.20.0/22"
    "az3" = "10.0.24.0/22"
  }
  "public" = {
    "az1" = "10.0.0.0/24"
    "az2" = "10.0.1.0/24"
    "az3" = "10.0.2.0/24"
  }
}

# Test environment-specific naming
> { for env in ["dev", "staging", "prod"] :
    env => {
      vpc_name     = "vpc-${env}-us-east-1"
      cluster_name = "eks-${env}-us-east-1"
      domain       = "${env}.internal.example.com"
    }
  }
{
  "dev" = {
    "cluster_name" = "eks-dev-us-east-1"
    "domain"       = "dev.internal.example.com"
    "vpc_name"     = "vpc-dev-us-east-1"
  }
  "prod" = {
    "cluster_name" = "eks-prod-us-east-1"
    "domain"       = "prod.internal.example.com"
    "vpc_name"     = "vpc-prod-us-east-1"
  }
  "staging" = {
    "cluster_name" = "eks-staging-us-east-1"
    "domain"       = "staging.internal.example.com"
    "vpc_name"     = "vpc-staging-us-east-1"
  }
}
```

---

## References

### Official Documentation

- [Python REPL Documentation](https://docs.python.org/3/tutorial/interpreter.html)
- [IPython Documentation](https://ipython.readthedocs.io/)
- [Node.js REPL Documentation](https://nodejs.org/api/repl.html)
- [Terraform Console Documentation](https://developer.hashicorp.com/terraform/cli/commands/console)
- [kubectl exec Documentation](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_exec/)
- [kubectl debug Documentation](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_debug/)
- [PostgreSQL psql Documentation](https://www.postgresql.org/docs/current/app-psql.html)
- [Redis CLI Documentation](https://redis.io/docs/connect/cli/)
- [MySQL Client Documentation](https://dev.mysql.com/doc/refman/8.0/en/mysql.html)

### Enhanced REPL Tools

- [ptpython](https://github.com/prompt-toolkit/python-prompt-toolkit)
- [pgcli](https://www.pgcli.com/)
- [mycli](https://www.mycli.net/)
- [iredis](https://iredis.xbin.io/)
- [k9s](https://k9scli.io/)
- [stern](https://github.com/stern/stern)

### Related Guides

- [Python Style Guide](python.md)
- [TypeScript Style Guide](typescript.md)
- [Bash Style Guide](bash.md)
- [SQL Style Guide](sql.md)
- [Terraform Style Guide](terraform.md)
- [Kubernetes Style Guide](kubernetes.md)
