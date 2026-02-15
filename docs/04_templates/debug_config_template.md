---
title: "Debug Configuration Templates"
description: "Pre-configured VS Code launch.json debug configurations for all supported languages"
author: "Tyler Dukes"
tags: [template, ide, vscode, debugging, launch-json]
category: "Templates"
status: "active"
search_keywords: [debug, configuration, launch.json, breakpoints, vscode, debugging]
---

This template provides production-ready VS Code `launch.json` debug
configurations covering Python, TypeScript/Node.js, Go, Bash, PowerShell,
Docker containers, remote debugging, and multi-target setups.

## Quick Start

```bash
# Copy launch.json to your project
cp coding-style-guide/.vscode/launch.json your-project/.vscode/

# Or copy the entire .vscode directory
cp -r coding-style-guide/.vscode your-project/
```

## File Structure

```text
your-project/
├── .vscode/
│   ├── launch.json          # Debug configurations (this template)
│   ├── settings.json        # Editor and formatter settings
│   ├── extensions.json      # Recommended extensions
│   └── tasks.json           # Pre/post-launch tasks (optional)
└── ...
```

## Configuration Overview

| Category | Configurations | Debug Port |
|----------|---------------|------------|
| Python: General | Current File, Module | N/A |
| Python: Web Frameworks | FastAPI, Django, Flask | N/A |
| Python: Testing | pytest (File), pytest (All) | N/A |
| Python: Attach | Attach localhost | 5678 |
| Node.js: Launch | Current File, ts-node, Express/NestJS, npm start | N/A |
| Node.js: Testing | Jest, Vitest | N/A |
| Node.js: Attach | Attach localhost | 9229 |
| Go: Launch | Current File, Package, Test | N/A |
| Go: Attach | Attach localhost (Delve) | 2345 |
| Bash | Current File | N/A |
| PowerShell | Current File, Interactive | N/A |
| Docker | Python, Node, Go Attach | 5678, 9229, 2345 |
| Remote: SSH | Python, Node via tunnel | 5678, 9229 |
| Remote: Kubernetes | Python, Node, Go via port-forward | 5678, 9229, 2345 |
| Multi-target | Full Stack combos, Docker combos | Multiple |

## Python Debug Configurations

### Python Current File

```json
{
  "name": "Python: Current File",
  "type": "debugpy",
  "request": "launch",
  "program": "${file}",
  "console": "integratedTerminal",
  "justMyCode": true,
  "env": {
    "PYTHONDONTWRITEBYTECODE": "1"
  }
}
```

### Step Into Library Code

```json
{
  "name": "Python: Current File (All Code)",
  "type": "debugpy",
  "request": "launch",
  "program": "${file}",
  "console": "integratedTerminal",
  "justMyCode": false
}
```

### Run a Module

```json
{
  "name": "Python: Module",
  "type": "debugpy",
  "request": "launch",
  "module": "${input:pythonModule}",
  "console": "integratedTerminal",
  "justMyCode": true
}
```

### FastAPI

```json
{
  "name": "Python: FastAPI",
  "type": "debugpy",
  "request": "launch",
  "module": "uvicorn",
  "args": ["app.main:app", "--reload", "--port", "8000"],
  "console": "integratedTerminal",
  "justMyCode": true,
  "jinja": true,
  "env": {
    "ENVIRONMENT": "development"
  }
}
```

### Django

```json
{
  "name": "Python: Django",
  "type": "debugpy",
  "request": "launch",
  "program": "${workspaceFolder}/manage.py",
  "args": ["runserver", "--noreload"],
  "django": true,
  "justMyCode": true,
  "env": {
    "DJANGO_SETTINGS_MODULE": "config.settings.local"
  }
}
```

### Flask

```json
{
  "name": "Python: Flask",
  "type": "debugpy",
  "request": "launch",
  "module": "flask",
  "args": ["run", "--debug", "--port", "5000"],
  "jinja": true,
  "justMyCode": true,
  "env": {
    "FLASK_APP": "app:create_app",
    "FLASK_ENV": "development"
  }
}
```

### pytest (Current File)

```json
{
  "name": "Python: pytest",
  "type": "debugpy",
  "request": "launch",
  "module": "pytest",
  "args": ["-xvs", "${file}"],
  "console": "integratedTerminal",
  "justMyCode": false
}
```

### pytest (All Tests)

```json
{
  "name": "Python: pytest (All Tests)",
  "type": "debugpy",
  "request": "launch",
  "module": "pytest",
  "args": ["-xvs", "tests/"],
  "console": "integratedTerminal",
  "justMyCode": false
}
```

### Python Attach to Running Process

```json
{
  "name": "Python: Attach (localhost:5678)",
  "type": "debugpy",
  "request": "attach",
  "connect": {
    "host": "localhost",
    "port": 5678
  },
  "pathMappings": [
    {
      "localRoot": "${workspaceFolder}",
      "remoteRoot": "/app"
    }
  ],
  "justMyCode": true
}
```

Prepare the target process with:

```python
# Add to your application entrypoint
import debugpy

debugpy.listen(("0.0.0.0", 5678))
print("Waiting for debugger attach...")
debugpy.wait_for_client()
```

## TypeScript / Node.js Debug Configurations

### Node Current File

```json
{
  "name": "Node: Current File",
  "type": "node",
  "request": "launch",
  "program": "${file}",
  "console": "integratedTerminal",
  "skipFiles": ["<node_internals>/**"]
}
```

### TypeScript with ts-node

```json
{
  "name": "Node: ts-node",
  "type": "node",
  "request": "launch",
  "runtimeExecutable": "npx",
  "runtimeArgs": ["ts-node"],
  "args": ["${file}"],
  "console": "integratedTerminal",
  "skipFiles": ["<node_internals>/**"],
  "resolveSourceMapLocations": [
    "${workspaceFolder}/**",
    "!**/node_modules/**"
  ]
}
```

### Express / NestJS Server

```json
{
  "name": "Node: Express/NestJS",
  "type": "node",
  "request": "launch",
  "runtimeExecutable": "npx",
  "runtimeArgs": ["ts-node"],
  "args": ["${workspaceFolder}/src/main.ts"],
  "console": "integratedTerminal",
  "skipFiles": ["<node_internals>/**"],
  "env": {
    "NODE_ENV": "development"
  },
  "resolveSourceMapLocations": [
    "${workspaceFolder}/**",
    "!**/node_modules/**"
  ]
}
```

### npm start

```json
{
  "name": "Node: npm start",
  "type": "node",
  "request": "launch",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["start"],
  "console": "integratedTerminal",
  "skipFiles": ["<node_internals>/**"]
}
```

### Jest (Current File)

```json
{
  "name": "Node: Jest Current File",
  "type": "node",
  "request": "launch",
  "runtimeExecutable": "npx",
  "runtimeArgs": [
    "jest",
    "--runInBand",
    "--no-cache",
    "${relativeFile}"
  ],
  "console": "integratedTerminal",
  "skipFiles": ["<node_internals>/**"]
}
```

### Vitest (Current File)

```json
{
  "name": "Node: Vitest Current File",
  "type": "node",
  "request": "launch",
  "runtimeExecutable": "npx",
  "runtimeArgs": [
    "vitest",
    "run",
    "--reporter=verbose",
    "${relativeFile}"
  ],
  "console": "integratedTerminal",
  "skipFiles": ["<node_internals>/**"]
}
```

### Node Attach to Running Process

```json
{
  "name": "Node: Attach (localhost:9229)",
  "type": "node",
  "request": "attach",
  "port": 9229,
  "restart": true,
  "skipFiles": ["<node_internals>/**"],
  "localRoot": "${workspaceFolder}",
  "remoteRoot": "/app"
}
```

Start the target process with the `--inspect` flag:

```bash
# Standard Node.js
node --inspect=0.0.0.0:9229 dist/main.js

# ts-node
npx ts-node --inspect=0.0.0.0:9229 src/main.ts

# npm script (add to package.json)
# "scripts": { "debug": "node --inspect=0.0.0.0:9229 dist/main.js" }
npm run debug
```

## Go Debug Configurations

### Go Current File

```json
{
  "name": "Go: Current File",
  "type": "go",
  "request": "launch",
  "mode": "debug",
  "program": "${file}",
  "env": {},
  "args": []
}
```

### Package

```json
{
  "name": "Go: Package",
  "type": "go",
  "request": "launch",
  "mode": "debug",
  "program": "${workspaceFolder}",
  "env": {},
  "args": []
}
```

### Test Current File

```json
{
  "name": "Go: Test Current File",
  "type": "go",
  "request": "launch",
  "mode": "test",
  "program": "${file}",
  "args": ["-v"]
}
```

### Attach via Delve

```json
{
  "name": "Go: Attach (localhost:2345)",
  "type": "go",
  "request": "attach",
  "mode": "remote",
  "port": 2345,
  "host": "localhost",
  "substitutePath": [
    {
      "from": "${workspaceFolder}",
      "to": "/app"
    }
  ]
}
```

Start the target process with Delve:

```bash
# Headless Delve server
dlv debug --headless --listen=:2345 --api-version=2 --accept-multiclient ./cmd/server

# Attach to running PID
dlv attach --headless --listen=:2345 --api-version=2 --accept-multiclient <PID>

# Run tests with Delve
dlv test --headless --listen=:2345 --api-version=2 --accept-multiclient ./pkg/...
```

## Bash Debug Configuration

```json
{
  "name": "Bash: Current File",
  "type": "bashdb",
  "request": "launch",
  "program": "${file}",
  "args": [],
  "cwd": "${workspaceFolder}",
  "terminalKind": "integrated"
}
```

Required extension: `rogalmic.bash-debug`

## PowerShell Debug Configurations

### PowerShell Current File

```json
{
  "name": "PowerShell: Current File",
  "type": "PowerShell",
  "request": "launch",
  "script": "${file}",
  "cwd": "${workspaceFolder}"
}
```

### Interactive Session

```json
{
  "name": "PowerShell: Interactive",
  "type": "PowerShell",
  "request": "launch",
  "script": "",
  "createTemporaryIntegratedConsole": true
}
```

## Docker Container Debugging

### Python Container

Add `debugpy` to your container and expose port 5678:

```dockerfile
# Dockerfile (debug variant)
FROM python:3.13-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt debugpy

COPY . .

# Expose app port and debug port
EXPOSE 8000 5678

CMD ["python", "-m", "debugpy", "--listen", "0.0.0.0:5678", \
     "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.debug.yml
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile.debug
    ports:
      - "8000:8000"
      - "5678:5678"
    volumes:
      - .:/app
    environment:
      - ENVIRONMENT=development
```

```json
{
  "name": "Docker: Python Attach",
  "type": "debugpy",
  "request": "attach",
  "connect": {
    "host": "localhost",
    "port": 5678
  },
  "pathMappings": [
    {
      "localRoot": "${workspaceFolder}",
      "remoteRoot": "/app"
    }
  ],
  "justMyCode": true
}
```

### Node.js Container

```dockerfile
# Dockerfile (debug variant)
FROM node:22-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000 9229

CMD ["node", "--inspect=0.0.0.0:9229", "dist/main.js"]
```

```yaml
# docker-compose.debug.yml
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.debug
    ports:
      - "3000:3000"
      - "9229:9229"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
```

```json
{
  "name": "Docker: Node Attach",
  "type": "node",
  "request": "attach",
  "port": 9229,
  "restart": true,
  "localRoot": "${workspaceFolder}",
  "remoteRoot": "/app",
  "skipFiles": ["<node_internals>/**"]
}
```

### Go Container

```dockerfile
# Dockerfile (debug variant)
FROM golang:1.24-alpine

RUN go install github.com/go-delve/delve/cmd/dlv@latest

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -gcflags="all=-N -l" -o /server ./cmd/server

EXPOSE 8080 2345

CMD ["dlv", "exec", "/server", "--headless", "--listen=:2345", \
     "--api-version=2", "--accept-multiclient"]
```

```yaml
# docker-compose.debug.yml
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.debug
    ports:
      - "8080:8080"
      - "2345:2345"
    security_opt:
      - "seccomp:unconfined"
    cap_add:
      - SYS_PTRACE
    volumes:
      - .:/app
```

```json
{
  "name": "Docker: Go Attach (Delve)",
  "type": "go",
  "request": "attach",
  "mode": "remote",
  "port": 2345,
  "host": "localhost",
  "substitutePath": [
    {
      "from": "${workspaceFolder}",
      "to": "/app"
    }
  ]
}
```

## Remote Debugging

### SSH Tunnel

Set up an SSH tunnel to forward the debug port from a remote host:

```bash
# Python remote debugging (port 5678)
ssh -L 5678:localhost:5678 user@remote-host

# Node.js remote debugging (port 9229)
ssh -L 9229:localhost:9229 user@remote-host

# Go remote debugging (port 2345)
ssh -L 2345:localhost:2345 user@remote-host

# Multiple ports in one tunnel
ssh -L 5678:localhost:5678 -L 9229:localhost:9229 user@remote-host
```

```json
{
  "name": "Remote: Python via SSH Tunnel",
  "type": "debugpy",
  "request": "attach",
  "connect": {
    "host": "localhost",
    "port": 5678
  },
  "pathMappings": [
    {
      "localRoot": "${workspaceFolder}",
      "remoteRoot": "/home/user/app"
    }
  ],
  "justMyCode": true
}
```

```json
{
  "name": "Remote: Node via SSH Tunnel",
  "type": "node",
  "request": "attach",
  "port": 9229,
  "localRoot": "${workspaceFolder}",
  "remoteRoot": "/home/user/app",
  "skipFiles": ["<node_internals>/**"]
}
```

### Kubernetes Port-Forward

Forward debug ports from a Kubernetes pod to your local machine:

```bash
# Python debug port
kubectl port-forward deployment/api-server 5678:5678

# Node.js debug port
kubectl port-forward deployment/web-frontend 9229:9229

# Go debug port
kubectl port-forward deployment/backend 2345:2345

# Multiple pods (run in separate terminals)
kubectl port-forward pod/api-abc123 5678:5678 &
kubectl port-forward pod/web-xyz789 9229:9229 &
```

```json
{
  "name": "K8s: Python Attach (port-forward)",
  "type": "debugpy",
  "request": "attach",
  "connect": {
    "host": "localhost",
    "port": 5678
  },
  "pathMappings": [
    {
      "localRoot": "${workspaceFolder}",
      "remoteRoot": "/app"
    }
  ],
  "justMyCode": true,
  "preLaunchTask": "k8s-port-forward-python"
}
```

```json
{
  "name": "K8s: Node Attach (port-forward)",
  "type": "node",
  "request": "attach",
  "port": 9229,
  "localRoot": "${workspaceFolder}",
  "remoteRoot": "/app",
  "skipFiles": ["<node_internals>/**"],
  "preLaunchTask": "k8s-port-forward-node"
}
```

```json
{
  "name": "K8s: Go Attach (port-forward)",
  "type": "go",
  "request": "attach",
  "mode": "remote",
  "port": 2345,
  "host": "localhost",
  "substitutePath": [
    {
      "from": "${workspaceFolder}",
      "to": "/app"
    }
  ],
  "preLaunchTask": "k8s-port-forward-go"
}
```

### Tasks for Kubernetes Port-Forward

Create `.vscode/tasks.json` to automate port-forwarding as a pre-launch step:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "k8s-port-forward-python",
      "type": "shell",
      "command": "kubectl",
      "args": ["port-forward", "deployment/api-server", "5678:5678"],
      "isBackground": true,
      "problemMatcher": {
        "pattern": { "regexp": "^$" },
        "background": {
          "activeOnStart": true,
          "beginsPattern": "^Forwarding",
          "endsPattern": "^Forwarding"
        }
      }
    },
    {
      "label": "k8s-port-forward-node",
      "type": "shell",
      "command": "kubectl",
      "args": ["port-forward", "deployment/web-frontend", "9229:9229"],
      "isBackground": true,
      "problemMatcher": {
        "pattern": { "regexp": "^$" },
        "background": {
          "activeOnStart": true,
          "beginsPattern": "^Forwarding",
          "endsPattern": "^Forwarding"
        }
      }
    },
    {
      "label": "k8s-port-forward-go",
      "type": "shell",
      "command": "kubectl",
      "args": ["port-forward", "deployment/backend", "2345:2345"],
      "isBackground": true,
      "problemMatcher": {
        "pattern": { "regexp": "^$" },
        "background": {
          "activeOnStart": true,
          "beginsPattern": "^Forwarding",
          "endsPattern": "^Forwarding"
        }
      }
    },
    {
      "label": "npm-install",
      "type": "shell",
      "command": "npm",
      "args": ["install"],
      "options": { "cwd": "${workspaceFolder}" }
    }
  ]
}
```

## Multi-Target (Compound) Debugging

Compound configurations launch multiple debug sessions simultaneously.

### Full Stack: Python API + Node Frontend

```json
{
  "compounds": [
    {
      "name": "Full Stack: Python API + Node Frontend",
      "configurations": [
        "Python: FastAPI",
        "Node: npm start"
      ],
      "stopAll": true,
      "preLaunchTask": "npm-install"
    }
  ]
}
```

### Full Stack: Django + Node Frontend

```json
{
  "compounds": [
    {
      "name": "Full Stack: Django + Node Frontend",
      "configurations": [
        "Python: Django",
        "Node: npm start"
      ],
      "stopAll": true
    }
  ]
}
```

### Docker: Python + Node Attach

```json
{
  "compounds": [
    {
      "name": "Docker: Python + Node Attach",
      "configurations": [
        "Docker: Python Attach",
        "Docker: Node Attach"
      ],
      "stopAll": true
    }
  ]
}
```

## Launch vs Attach

| Aspect | Launch | Attach |
|--------|--------|--------|
| Process control | VS Code starts the process | Process already running |
| Use case | Local development | Containers, remote, running servers |
| `request` value | `"launch"` | `"attach"` |
| Path mapping | Automatic | Requires `pathMappings` / `substitutePath` |
| Restart behavior | Restarts automatically | Manual or `"restart": true` |
| Environment variables | Set via `env` | Set in the running process |

### When to Use Launch

```json
{
  "name": "Python: FastAPI",
  "type": "debugpy",
  "request": "launch",
  "module": "uvicorn",
  "args": ["app.main:app", "--reload"]
}
```

```json
{
  "name": "Node: Express",
  "type": "node",
  "request": "launch",
  "runtimeExecutable": "npx",
  "runtimeArgs": ["ts-node"],
  "args": ["src/main.ts"]
}
```

```json
{
  "name": "Go: Current File",
  "type": "go",
  "request": "launch",
  "mode": "debug",
  "program": "${file}"
}
```

### When to Use Attach

```json
{
  "name": "Docker: Python Attach",
  "type": "debugpy",
  "request": "attach",
  "connect": { "host": "localhost", "port": 5678 },
  "pathMappings": [
    { "localRoot": "${workspaceFolder}", "remoteRoot": "/app" }
  ]
}
```

```json
{
  "name": "Docker: Node Attach",
  "type": "node",
  "request": "attach",
  "port": 9229,
  "localRoot": "${workspaceFolder}",
  "remoteRoot": "/app"
}
```

```json
{
  "name": "Docker: Go Attach",
  "type": "go",
  "request": "attach",
  "mode": "remote",
  "port": 2345,
  "substitutePath": [
    { "from": "${workspaceFolder}", "to": "/app" }
  ]
}
```

## Input Variables

Use `inputs` to prompt for values at debug launch time:

```json
{
  "inputs": [
    {
      "id": "pythonModule",
      "description": "Python module to run (e.g., mypackage.cli)",
      "type": "promptString",
      "default": "mypackage.cli"
    },
    {
      "id": "debugPort",
      "description": "Debug port number",
      "type": "promptString",
      "default": "5678"
    },
    {
      "id": "k8sNamespace",
      "description": "Kubernetes namespace",
      "type": "pickString",
      "options": ["default", "development", "staging"],
      "default": "default"
    }
  ]
}
```

Reference inputs in configurations with `${input:variableId}`:

```json
{
  "name": "Python: Module (prompted)",
  "type": "debugpy",
  "request": "launch",
  "module": "${input:pythonModule}",
  "console": "integratedTerminal"
}
```

```json
{
  "name": "Python: Attach (prompted port)",
  "type": "debugpy",
  "request": "attach",
  "connect": {
    "host": "localhost",
    "port": "${input:debugPort}"
  }
}
```

## Required Extensions

| Language | Extension | Extension ID |
|----------|-----------|-------------|
| Python | Python Debugger | `ms-python.debugpy` |
| Node.js | Built-in | (included with VS Code) |
| Go | Go | `golang.go` |
| Bash | Bash Debug | `rogalmic.bash-debug` |
| PowerShell | PowerShell | `ms-vscode.powershell` |
| Docker | Docker | `ms-azuretools.vscode-docker` |
| Kubernetes | Kubernetes | `ms-kubernetes-tools.vscode-kubernetes-tools` |

```bash
# Install all debugging extensions
code --install-extension ms-python.debugpy
code --install-extension golang.go
code --install-extension rogalmic.bash-debug
code --install-extension ms-vscode.powershell
code --install-extension ms-azuretools.vscode-docker
code --install-extension ms-kubernetes-tools.vscode-kubernetes-tools
```

## Customization Guide

### Adding a New Configuration

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Your Custom Config",
      "type": "debugpy",
      "request": "launch",
      "program": "${workspaceFolder}/src/main.py",
      "args": ["--verbose"],
      "env": {
        "DATABASE_URL": "postgresql://localhost:5432/devdb",
        "LOG_LEVEL": "DEBUG"
      },
      "console": "integratedTerminal",
      "justMyCode": true
    }
  ]
}
```

### Environment-Specific Configurations

```json
{
  "name": "Python: FastAPI (staging)",
  "type": "debugpy",
  "request": "launch",
  "module": "uvicorn",
  "args": ["app.main:app", "--port", "8000"],
  "envFile": "${workspaceFolder}/.env.staging",
  "console": "integratedTerminal",
  "justMyCode": true
}
```

```json
{
  "name": "Node: Express (staging)",
  "type": "node",
  "request": "launch",
  "runtimeExecutable": "npx",
  "runtimeArgs": ["ts-node"],
  "args": ["src/main.ts"],
  "envFile": "${workspaceFolder}/.env.staging",
  "console": "integratedTerminal"
}
```

### Conditional Breakpoints

VS Code supports conditional breakpoints (set via right-click on the breakpoint
gutter). Common patterns:

```python
# Python: Break only when user_id matches
# Condition: user_id == "admin"
def process_request(user_id: str, data: dict) -> dict:
    result = validate(data)  # Set conditional breakpoint here
    return result
```

```typescript
// TypeScript: Break on specific iteration
// Condition: i === 42
for (let i = 0; i < items.length; i++) {
  processItem(items[i]);  // Set conditional breakpoint here
}
```

```go
// Go: Break when error is non-nil
// Condition: err != nil
result, err := db.Query(ctx, query)
// Set conditional breakpoint on next line
if err != nil {
    return err
}
```

## Troubleshooting

### Python Debugger Not Attaching

```bash
# Verify debugpy is installed
pip install debugpy

# Verify port is open
lsof -i :5678

# Test from container
docker exec -it <container> python -c "import debugpy; print('OK')"
```

### Node.js Source Maps Not Working

```json
{
  "resolveSourceMapLocations": [
    "${workspaceFolder}/**",
    "!**/node_modules/**"
  ],
  "outFiles": ["${workspaceFolder}/dist/**/*.js"],
  "sourceMaps": true
}
```

```bash
# Verify TypeScript source maps are generated
cat tsconfig.json | grep sourceMap
# Should include: "sourceMap": true
```

### Go Delve Connection Refused

```bash
# Verify Delve is installed
go install github.com/go-delve/delve/cmd/dlv@latest

# Verify port is open
lsof -i :2345

# Verify binary was built with debug flags
go build -gcflags="all=-N -l" -o server ./cmd/server
```

### Docker Debug Port Not Accessible

```bash
# Verify port mapping
docker compose ps
# Should show 0.0.0.0:5678->5678/tcp

# Verify debug listener is running inside container
docker exec -it <container> netstat -tlnp | grep 5678
```

```yaml
# Ensure ports are exposed in docker-compose.yml
services:
  api:
    ports:
      - "5678:5678"
```

### Kubernetes Port-Forward Fails

```bash
# Verify pod is running
kubectl get pods -l app=api-server

# Check pod logs for debug listener
kubectl logs deployment/api-server | grep -i debug

# Manual port-forward to verify
kubectl port-forward deployment/api-server 5678:5678
```

## Reference

### VS Code Variables

| Variable | Description |
|----------|-------------|
| `${workspaceFolder}` | Root path of the workspace |
| `${file}` | Currently opened file |
| `${relativeFile}` | Currently opened file relative to workspace |
| `${fileBasename}` | File name without path |
| `${fileDirname}` | Directory of the current file |
| `${input:id}` | Prompts user for input at launch |

### Debug Port Conventions

| Language | Default Port | Protocol |
|----------|-------------|----------|
| Python (debugpy) | 5678 | DAP |
| Node.js | 9229 | Chrome DevTools Protocol |
| Go (Delve) | 2345 | DAP |

### Related Documentation

- [IDE Settings Template](ide_settings_template.md)
- [Python Style Guide](../02_language_guides/python.md)
- [TypeScript Style Guide](../02_language_guides/typescript.md)
- [Go Style Guide](../02_language_guides/go.md)
- [Bash Style Guide](../02_language_guides/bash.md)
- [Dockerfile Style Guide](../02_language_guides/dockerfile.md)
- [Kubernetes Style Guide](../02_language_guides/kubernetes.md)

### External Resources

- [VS Code Debugging Documentation](https://code.visualstudio.com/docs/editor/debugging)
- [VS Code launch.json Reference](https://code.visualstudio.com/docs/editor/debugging#_launchjson-attributes)
- [debugpy Documentation](https://github.com/microsoft/debugpy)
- [Delve Documentation](https://github.com/go-delve/delve)
- [Node.js Debugging Guide](https://nodejs.org/en/learn/getting-started/debugging)
