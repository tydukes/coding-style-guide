---
title: "Shell Aliases and Functions Collection"
description: "Productivity-enhancing shell aliases and functions for common development tasks across Git, Docker, Kubernetes, cloud CLIs, and system operations"
author: "Tyler Dukes"
tags: [bash, shell, aliases, functions, productivity, devops, git, docker, kubernetes]
category: "Language Guides"
status: "active"
---

## Language Overview

**Shell aliases and functions** are productivity multipliers that reduce
repetitive typing, enforce consistent flags, and encapsulate complex
multi-step workflows into memorable commands.

### Key Characteristics

- **Paradigm**: Command-line shorthand and reusable shell functions
- **Shell Compatibility**: Bash, Zsh, and POSIX sh
- **Scope**: Session-scoped (aliases) and file-sourced (functions)
- **Use Case**: Daily development workflows, DevOps operations, system administration

### Aliases vs Functions

- **Aliases**: Simple text substitution for common commands with fixed flags
- **Functions**: Parameterized, multi-step logic with conditionals and error handling

```bash
# Alias: simple text substitution, no parameters
alias gs='git status'

# Function: accepts parameters, has logic
gco() {
  local branch="${1:?Branch name required}"
  git checkout "$branch" 2>/dev/null || git checkout -b "$branch"
}
```

### This Guide Covers

- Git workflow aliases and functions
- Docker and container shortcuts
- Kubernetes operational commands
- Cloud CLI shortcuts (AWS, GCP, Azure)
- Directory navigation helpers
- Process and system management utilities
- Shell profile organization patterns
- Naming conventions and safety practices

---

## Quick Reference

| **Category** | **Alias** | **Expansion** | **Notes** |
|-------------|-----------|---------------|-----------|
| **Git** | | | |
| Status | `gs` | `git status` | Short status view |
| Pull | `gp` | `git pull --rebase` | Rebase by default |
| Commit | `gc` | `git commit -m` | Quick commit with message |
| Branch | `gb` | `git branch` | List branches |
| Diff | `gd` | `git diff` | Unstaged changes |
| Log | `gl` | `git log --oneline -20` | Compact log |
| **Docker** | | | |
| Containers | `dps` | `docker ps --format ...` | Formatted table output |
| Compose | `dcu` | `docker compose up -d` | Detached compose up |
| Clean | `dprune` | `docker system prune -af` | Remove all unused resources |
| **Kubernetes** | | | |
| Kubectl | `k` | `kubectl` | Universal shorthand |
| Get pods | `kgp` | `kubectl get pods` | List pods |
| Get services | `kgs` | `kubectl get svc` | List services |
| Logs | `kl` | `kubectl logs -f` | Follow logs |
| **Cloud** | | | |
| AWS identity | `awswho` | `aws sts get-caller-identity` | Verify AWS identity |
| GCP project | `gcpproject` | `gcloud config get project` | Current project |
| Azure sub | `azsub` | `az account show --query name` | Active subscription |
| **Navigation** | | | |
| Back | `..` | `cd ..` | One level up |
| Projects | `proj` | `cd ~/projects` | Jump to projects |
| **Process** | | | |
| Ports | `ports` | `lsof -i -P -n \| grep LISTEN` | Listening ports |
| Top memory | `topmem` | `ps aux --sort=-%mem \| head` | Memory hogs |

---

## Shell Profile Organization

Organize aliases and functions in modular, sourced files rather than one
monolithic profile.

### Recommended Directory Structure

```bash
# ~/.shell/
# ├── aliases.sh          # Simple aliases (all categories)
# ├── functions.sh        # Complex functions
# ├── git.sh              # Git-specific aliases and functions
# ├── docker.sh           # Docker aliases and functions
# ├── kubernetes.sh       # Kubernetes aliases and functions
# ├── cloud.sh            # Cloud CLI shortcuts
# ├── navigation.sh       # Directory navigation
# ├── process.sh          # Process management
# └── local.sh            # Machine-specific (gitignored)
```

### Profile Loading Pattern

```bash
# ~/.bashrc or ~/.zshrc
# ──────────────────────────────────────────────────────────────
# Source all shell customization files from ~/.shell/
# ──────────────────────────────────────────────────────────────

SHELL_DIR="${HOME}/.shell"

if [ -d "$SHELL_DIR" ]; then
  for file in "$SHELL_DIR"/*.sh; do
    [ -r "$file" ] && source "$file"
  done
  unset file
fi
unset SHELL_DIR

# Source machine-specific overrides (not committed to dotfiles)
[ -r "${HOME}/.shell/local.sh" ] && source "${HOME}/.shell/local.sh"
```

### Bash vs Zsh Compatibility

```bash
# Detect current shell for compatibility
if [ -n "$ZSH_VERSION" ]; then
  CURRENT_SHELL="zsh"
elif [ -n "$BASH_VERSION" ]; then
  CURRENT_SHELL="bash"
else
  CURRENT_SHELL="sh"
fi

# Zsh-specific: enable Bash-compatible word splitting
if [ "$CURRENT_SHELL" = "zsh" ]; then
  setopt SH_WORD_SPLIT
  setopt NO_NOMATCH
fi

# Shell-agnostic alias definition
alias ls='ls --color=auto 2>/dev/null || ls -G'
alias grep='grep --color=auto'
alias diff='diff --color=auto 2>/dev/null || diff'
```

---

## Naming Conventions

### Alias Naming Rules

```bash
# ──────────────────────────────────────────────────────────────
# Rule 1: Use short, mnemonic prefixes grouped by tool
# ──────────────────────────────────────────────────────────────

# Git:        g + action    (gs, gp, gc, gl, gd, gb)
# Docker:     d + action    (dps, dcu, dcd, dprune)
# Kubernetes: k + action    (kgp, kgs, kl, kd)
# Terraform:  tf + action   (tfi, tfp, tfa, tfd)

# ──────────────────────────────────────────────────────────────
# Rule 2: Never shadow system commands
# ──────────────────────────────────────────────────────────────

# Bad - shadows /usr/bin/test
alias test='pytest'

# Good - use a prefix
alias pytest='pytest'

# Bad - shadows built-in cd
alias cd='pushd'

# Good - new name for enhanced behavior
alias pd='pushd'

# ──────────────────────────────────────────────────────────────
# Rule 3: Use consistent verb patterns
# ──────────────────────────────────────────────────────────────

# Pattern: <tool><verb>
# g = get, c = create, d = delete, l = list/logs, a = apply

alias kgp='kubectl get pods'           # k + g(et) + p(ods)
alias kgs='kubectl get svc'            # k + g(et) + s(vc)
alias kgd='kubectl get deployments'    # k + g(et) + d(eployments)
alias kgn='kubectl get nodes'          # k + g(et) + n(odes)
alias kdp='kubectl describe pod'       # k + d(escribe) + p(od)
alias kds='kubectl describe svc'       # k + d(escribe) + s(vc)
alias klp='kubectl logs -f'            # k + l(ogs) + p(od) follow
```

### Function Naming Rules

```bash
# ──────────────────────────────────────────────────────────────
# Rule 1: Use descriptive snake_case names
# ──────────────────────────────────────────────────────────────

# Good - clear purpose
git_cleanup_branches() { ... }
docker_stop_all() { ... }
k8s_port_forward() { ... }
aws_switch_profile() { ... }

# Bad - too short, unclear
gcb() { ... }
dsa() { ... }

# ──────────────────────────────────────────────────────────────
# Rule 2: Prefix with tool/domain name
# ──────────────────────────────────────────────────────────────

# Git functions
git_amend() { ... }
git_undo_last() { ... }
git_branch_age() { ... }

# Docker functions
docker_exec_shell() { ... }
docker_logs_since() { ... }

# Kubernetes functions
k8s_get_secret() { ... }
k8s_restart_deploy() { ... }

# Cloud functions
aws_assume_role() { ... }
gcp_switch_project() { ... }
az_switch_sub() { ... }
```

---

## Git Aliases and Functions

### Essential Git Aliases

```bash
# ──────────────────────────────────────────────────────────────
# Core Git Aliases
# ──────────────────────────────────────────────────────────────

# Status and info
alias gs='git status'
alias gss='git status --short'
alias gb='git branch'
alias gba='git branch --all'
alias gd='git diff'
alias gds='git diff --staged'
alias gdn='git diff --name-only'

# Logging
alias gl='git log --oneline -20'
alias gla='git log --oneline --all --graph -20'
alias glg='git log --graph --pretty=format:"%C(red)%h%C(reset) -%C(yellow)%d%C(reset) %s %C(green)(%cr) %C(bold blue)<%an>%C(reset)" --abbrev-commit -20'
alias grl='git reflog --date=relative -20'

# Staging and committing
alias ga='git add'
alias gap='git add --patch'
alias gc='git commit -m'
alias gca='git commit --amend --no-edit'
alias gcam='git commit --amend'

# Branching and checkout
alias gco='git checkout'
alias gcb='git checkout -b'
alias gsw='git switch'
alias gswc='git switch --create'

# Pull, push, fetch
alias gp='git pull --rebase'
alias gpp='git push'
alias gpf='git push --force-with-lease'
alias gf='git fetch --all --prune'

# Stash
alias gst='git stash'
alias gstp='git stash pop'
alias gstl='git stash list'

# Reset
alias grh='git reset HEAD'
alias grh1='git reset HEAD~1'
```

### Git Functions

```bash
# ──────────────────────────────────────────────────────────────
# Interactive branch checkout with fuzzy search (requires fzf)
# ──────────────────────────────────────────────────────────────
git_checkout_fuzzy() {
  local branch
  branch=$(git branch --all \
    | sed 's/remotes\/origin\///' \
    | sed 's/^\* //' \
    | sort -u \
    | fzf --height=40% --reverse --prompt="branch> ")

  if [ -n "$branch" ]; then
    git checkout "$branch"
  fi
}
alias gcof='git_checkout_fuzzy'

# ──────────────────────────────────────────────────────────────
# Delete merged branches (keeps main, master, develop)
# ──────────────────────────────────────────────────────────────
git_cleanup_branches() {
  local default_branch
  default_branch=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null \
    | sed 's@^refs/remotes/origin/@@')
  default_branch="${default_branch:-main}"

  echo "Cleaning up branches merged into ${default_branch}..."

  git branch --merged "$default_branch" \
    | grep -v -E "^\*|main|master|develop|${default_branch}" \
    | while read -r branch; do
        echo "  Deleting: $branch"
        git branch -d "$branch"
      done

  echo "Pruning remote tracking branches..."
  git remote prune origin
}

# ──────────────────────────────────────────────────────────────
# Show commit history for a specific file
# ──────────────────────────────────────────────────────────────
git_file_history() {
  local file="${1:?Usage: git_file_history <file>}"
  git log --follow --oneline --all -- "$file"
}

# ──────────────────────────────────────────────────────────────
# Create a conventional commit with type selection
# ──────────────────────────────────────────────────────────────
git_conventional_commit() {
  local commit_type scope message

  echo "Select commit type:"
  echo "  1) feat     - A new feature"
  echo "  2) fix      - A bug fix"
  echo "  3) docs     - Documentation changes"
  echo "  4) style    - Code style changes"
  echo "  5) refactor - Code refactoring"
  echo "  6) test     - Adding tests"
  echo "  7) chore    - Maintenance tasks"
  echo "  8) ci       - CI/CD changes"
  printf "Choice [1-8]: "
  read -r choice

  case "$choice" in
    1) commit_type="feat" ;;
    2) commit_type="fix" ;;
    3) commit_type="docs" ;;
    4) commit_type="style" ;;
    5) commit_type="refactor" ;;
    6) commit_type="test" ;;
    7) commit_type="chore" ;;
    8) commit_type="ci" ;;
    *) echo "Invalid choice"; return 1 ;;
  esac

  printf "Scope (optional, press Enter to skip): "
  read -r scope
  printf "Message: "
  read -r message

  if [ -n "$scope" ]; then
    git commit -m "${commit_type}(${scope}): ${message}"
  else
    git commit -m "${commit_type}: ${message}"
  fi
}
alias gcc='git_conventional_commit'

# ──────────────────────────────────────────────────────────────
# Show branch age (sorted by last commit date)
# ──────────────────────────────────────────────────────────────
git_branch_age() {
  git for-each-ref --sort=-committerdate refs/heads/ \
    --format='%(committerdate:relative)|%(refname:short)|%(subject)' \
    | column -t -s '|' \
    | head -20
}

# ──────────────────────────────────────────────────────────────
# Quick fixup commit and autosquash rebase
# ──────────────────────────────────────────────────────────────
git_fixup() {
  local commit="${1:?Usage: git_fixup <commit-hash>}"
  git commit --fixup="$commit"
  echo "Fixup commit created. Run 'git rebase -i --autosquash' to squash."
}

# ──────────────────────────────────────────────────────────────
# Undo last commit (keep changes staged)
# ──────────────────────────────────────────────────────────────
git_undo_last() {
  echo "Undoing last commit (changes will remain staged)..."
  git reset --soft HEAD~1
  git status --short
}
```

### Git Worktree Helpers

```bash
# ──────────────────────────────────────────────────────────────
# Create a new worktree for a branch
# ──────────────────────────────────────────────────────────────
git_worktree_add() {
  local branch="${1:?Usage: git_worktree_add <branch>}"
  local worktree_dir="../${PWD##*/}-${branch}"

  git worktree add "$worktree_dir" "$branch" 2>/dev/null \
    || git worktree add -b "$branch" "$worktree_dir"

  echo "Worktree created at: $worktree_dir"
  cd "$worktree_dir" || return 1
}

# ──────────────────────────────────────────────────────────────
# List worktrees with status
# ──────────────────────────────────────────────────────────────
git_worktree_list() {
  git worktree list --porcelain | while read -r line; do
    case "$line" in
      worktree*) printf "\n%s" "${line#worktree }" ;;
      HEAD*)     printf "  HEAD: %s" "${line#HEAD }" ;;
      branch*)   printf "  Branch: %s" "${line#branch refs/heads/}" ;;
    esac
  done
  echo ""
}

# ──────────────────────────────────────────────────────────────
# Remove a worktree by branch name
# ──────────────────────────────────────────────────────────────
git_worktree_remove() {
  local branch="${1:?Usage: git_worktree_remove <branch>}"
  local worktree_dir="../${PWD##*/}-${branch}"

  if [ -d "$worktree_dir" ]; then
    git worktree remove "$worktree_dir"
    echo "Worktree removed: $worktree_dir"
  else
    echo "Worktree not found: $worktree_dir"
    return 1
  fi
}
```

---

## Docker Aliases and Functions

### Essential Docker Aliases

```bash
# ──────────────────────────────────────────────────────────────
# Core Docker Aliases
# ──────────────────────────────────────────────────────────────

# Container management
alias dps='docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"'
alias dpsa='docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"'
alias dimg='docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"'
alias drm='docker rm'
alias drmi='docker rmi'
alias dstop='docker stop'

# Docker Compose
alias dcu='docker compose up -d'
alias dcd='docker compose down'
alias dcr='docker compose restart'
alias dcl='docker compose logs -f'
alias dcps='docker compose ps'
alias dcb='docker compose build --no-cache'
alias dce='docker compose exec'

# Cleanup
alias dprune='docker system prune -af --volumes'
alias dvprune='docker volume prune -f'
alias diprune='docker image prune -af'

# Build
alias dbuild='docker build -t'
alias dbuildnc='docker build --no-cache -t'

# Inspect
alias dinspect='docker inspect --format'
alias dlogs='docker logs -f'
alias dstats='docker stats --no-stream'
```

### Docker Functions

```bash
# ──────────────────────────────────────────────────────────────
# Execute a shell in a running container
# ──────────────────────────────────────────────────────────────
docker_exec_shell() {
  local container="${1:?Usage: docker_exec_shell <container> [shell]}"
  local shell="${2:-/bin/sh}"

  docker exec -it "$container" "$shell"
}
alias dsh='docker_exec_shell'

# ──────────────────────────────────────────────────────────────
# Stop all running containers
# ──────────────────────────────────────────────────────────────
docker_stop_all() {
  local containers
  containers=$(docker ps -q)

  if [ -z "$containers" ]; then
    echo "No running containers."
    return 0
  fi

  echo "Stopping all running containers..."
  echo "$containers" | xargs docker stop
  echo "All containers stopped."
}
alias dstopall='docker_stop_all'

# ──────────────────────────────────────────────────────────────
# Show container resource usage sorted by memory
# ──────────────────────────────────────────────────────────────
docker_top() {
  docker stats --no-stream --format \
    "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}" \
    | sort -k3 -h -r
}
alias dtop='docker_top'

# ──────────────────────────────────────────────────────────────
# View logs for a container since a relative time
# ──────────────────────────────────────────────────────────────
docker_logs_since() {
  local container="${1:?Usage: docker_logs_since <container> [duration]}"
  local since="${2:-1h}"

  docker logs --since "$since" -f "$container"
}
alias dlsince='docker_logs_since'

# ──────────────────────────────────────────────────────────────
# Show environment variables of a running container
# ──────────────────────────────────────────────────────────────
docker_env() {
  local container="${1:?Usage: docker_env <container>}"

  docker inspect "$container" \
    --format '{{range .Config.Env}}{{println .}}{{end}}' \
    | sort
}
alias denv='docker_env'

# ──────────────────────────────────────────────────────────────
# Build, tag, and push an image in one step
# ──────────────────────────────────────────────────────────────
docker_build_push() {
  local image="${1:?Usage: docker_build_push <image:tag>}"
  local context="${2:-.}"

  echo "Building ${image}..."
  docker build -t "$image" "$context" || return 1

  echo "Pushing ${image}..."
  docker push "$image"
}

# ──────────────────────────────────────────────────────────────
# Get the IP address of a container
# ──────────────────────────────────────────────────────────────
docker_ip() {
  local container="${1:?Usage: docker_ip <container>}"

  docker inspect "$container" \
    --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
}

# ──────────────────────────────────────────────────────────────
# Quickly run a throwaway container with common tools
# ──────────────────────────────────────────────────────────────
docker_debug() {
  local image="${1:-alpine}"

  echo "Starting debug container (${image})..."
  docker run --rm -it \
    --name "debug-$(date +%s)" \
    --network host \
    "$image" \
    sh -c 'apk add --no-cache curl jq bind-tools 2>/dev/null; exec sh'
}
alias ddebug='docker_debug'
```

### Docker Compose Workflow Functions

```bash
# ──────────────────────────────────────────────────────────────
# Rebuild and restart a specific service
# ──────────────────────────────────────────────────────────────
dc_rebuild_service() {
  local service="${1:?Usage: dc_rebuild_service <service>}"

  echo "Rebuilding and restarting ${service}..."
  docker compose build --no-cache "$service" \
    && docker compose up -d --force-recreate "$service"
}

# ──────────────────────────────────────────────────────────────
# Show combined logs for specific services
# ──────────────────────────────────────────────────────────────
dc_logs_multi() {
  if [ $# -eq 0 ]; then
    echo "Usage: dc_logs_multi <service1> [service2] ..."
    return 1
  fi

  docker compose logs -f "$@"
}

# ──────────────────────────────────────────────────────────────
# Full compose reset: down, build, up
# ──────────────────────────────────────────────────────────────
dc_reset() {
  echo "Tearing down all services..."
  docker compose down --remove-orphans --volumes

  echo "Rebuilding all services..."
  docker compose build --no-cache

  echo "Starting all services..."
  docker compose up -d

  echo "Service status:"
  docker compose ps
}
alias dcreset='dc_reset'
```

---

## Kubernetes Aliases and Functions

### Essential Kubernetes Aliases

```bash
# ──────────────────────────────────────────────────────────────
# Core Kubectl Aliases
# ──────────────────────────────────────────────────────────────

# Base command
alias k='kubectl'

# Get resources
alias kgp='kubectl get pods'
alias kgpa='kubectl get pods --all-namespaces'
alias kgpw='kubectl get pods -o wide'
alias kgs='kubectl get svc'
alias kgd='kubectl get deployments'
alias kgn='kubectl get nodes'
alias kgns='kubectl get namespaces'
alias kgi='kubectl get ingress'
alias kgcm='kubectl get configmaps'
alias kgsec='kubectl get secrets'
alias kgsa='kubectl get serviceaccounts'
alias kge='kubectl get events --sort-by=.lastTimestamp'

# Describe resources
alias kdp='kubectl describe pod'
alias kds='kubectl describe svc'
alias kdd='kubectl describe deployment'
alias kdn='kubectl describe node'

# Logs
alias kl='kubectl logs -f'
alias kl1='kubectl logs --tail=100'
alias klp='kubectl logs -f --previous'

# Execute
alias kexec='kubectl exec -it'

# Apply and delete
alias ka='kubectl apply -f'
alias kd='kubectl delete -f'
alias kdel='kubectl delete'

# Context and namespace
alias kctx='kubectl config get-contexts'
alias kns='kubectl config set-context --current --namespace'

# Resource usage
alias ktop='kubectl top pods'
alias ktopn='kubectl top nodes'

# Watch resources
alias kwatch='kubectl get pods -w'
```

### Kubernetes Functions

```bash
# ──────────────────────────────────────────────────────────────
# Switch namespace with fuzzy search (requires fzf)
# ──────────────────────────────────────────────────────────────
k8s_switch_namespace() {
  local ns
  ns=$(kubectl get namespaces -o jsonpath='{.items[*].metadata.name}' \
    | tr ' ' '\n' \
    | fzf --height=40% --reverse --prompt="namespace> ")

  if [ -n "$ns" ]; then
    kubectl config set-context --current --namespace="$ns"
    echo "Switched to namespace: $ns"
  fi
}
alias knsf='k8s_switch_namespace'

# ──────────────────────────────────────────────────────────────
# Switch context with fuzzy search (requires fzf)
# ──────────────────────────────────────────────────────────────
k8s_switch_context() {
  local ctx
  ctx=$(kubectl config get-contexts -o name \
    | fzf --height=40% --reverse --prompt="context> ")

  if [ -n "$ctx" ]; then
    kubectl config use-context "$ctx"
    echo "Switched to context: $ctx"
  fi
}
alias kctxf='k8s_switch_context'

# ──────────────────────────────────────────────────────────────
# Port forward a pod by partial name match
# ──────────────────────────────────────────────────────────────
k8s_port_forward() {
  local pattern="${1:?Usage: k8s_port_forward <pod-pattern> <local:remote>}"
  local ports="${2:?Usage: k8s_port_forward <pod-pattern> <local:remote>}"
  local namespace="${3:-}"

  local ns_flag=""
  [ -n "$namespace" ] && ns_flag="-n $namespace"

  local pod
  pod=$(kubectl get pods $ns_flag -o name \
    | grep "$pattern" \
    | head -1)

  if [ -z "$pod" ]; then
    echo "No pod found matching: $pattern"
    return 1
  fi

  echo "Port forwarding ${pod} -> ${ports}"
  kubectl port-forward $ns_flag "$pod" "$ports"
}
alias kpf='k8s_port_forward'

# ──────────────────────────────────────────────────────────────
# Get decoded secret values
# ──────────────────────────────────────────────────────────────
k8s_get_secret() {
  local secret="${1:?Usage: k8s_get_secret <secret-name> [namespace]}"
  local namespace="${2:-}"

  local ns_flag=""
  [ -n "$namespace" ] && ns_flag="-n $namespace"

  kubectl get secret $ns_flag "$secret" -o json \
    | jq -r '.data | to_entries[] | "\(.key): \(.value | @base64d)"'
}
alias ksecret='k8s_get_secret'

# ──────────────────────────────────────────────────────────────
# Exec into a pod by partial name match
# ──────────────────────────────────────────────────────────────
k8s_exec_shell() {
  local pattern="${1:?Usage: k8s_exec_shell <pod-pattern> [shell]}"
  local shell="${2:-/bin/sh}"
  local namespace="${3:-}"

  local ns_flag=""
  [ -n "$namespace" ] && ns_flag="-n $namespace"

  local pod
  pod=$(kubectl get pods $ns_flag -o name \
    | grep "$pattern" \
    | head -1)

  if [ -z "$pod" ]; then
    echo "No pod found matching: $pattern"
    return 1
  fi

  echo "Connecting to ${pod}..."
  kubectl exec $ns_flag -it "$pod" -- "$shell"
}
alias ksh='k8s_exec_shell'

# ──────────────────────────────────────────────────────────────
# Restart a deployment (rolling restart)
# ──────────────────────────────────────────────────────────────
k8s_restart_deploy() {
  local deploy="${1:?Usage: k8s_restart_deploy <deployment> [namespace]}"
  local namespace="${2:-}"

  local ns_flag=""
  [ -n "$namespace" ] && ns_flag="-n $namespace"

  echo "Rolling restart: $deploy"
  kubectl rollout restart deployment/$deploy $ns_flag
  kubectl rollout status deployment/$deploy $ns_flag
}
alias krestart='k8s_restart_deploy'

# ──────────────────────────────────────────────────────────────
# Show all pods not in Running/Succeeded state
# ──────────────────────────────────────────────────────────────
k8s_troubled_pods() {
  local namespace="${1:---all-namespaces}"

  if [ "$namespace" != "--all-namespaces" ]; then
    namespace="-n $namespace"
  fi

  kubectl get pods $namespace \
    --field-selector='status.phase!=Running,status.phase!=Succeeded' \
    -o wide
}
alias ktroubled='k8s_troubled_pods'

# ──────────────────────────────────────────────────────────────
# Show resource usage per namespace
# ──────────────────────────────────────────────────────────────
k8s_namespace_usage() {
  echo "=== Pod Count by Namespace ==="
  kubectl get pods --all-namespaces --no-headers \
    | awk '{ns[$1]++} END {for (n in ns) printf "  %-30s %d\n", n, ns[n]}' \
    | sort -k2 -rn

  echo ""
  echo "=== Resource Requests by Namespace ==="
  kubectl get pods --all-namespaces -o json \
    | jq -r '.items[]
      | {ns: .metadata.namespace,
         cpu: (.spec.containers[].resources.requests.cpu // "0"),
         mem: (.spec.containers[].resources.requests.memory // "0")}
      | "\(.ns) \(.cpu) \(.mem)"' \
    | sort \
    | head -30
}
```

### Kubernetes Debug Helpers

```bash
# ──────────────────────────────────────────────────────────────
# Launch a debug pod in the cluster with common tools
# ──────────────────────────────────────────────────────────────
k8s_debug_pod() {
  local namespace="${1:-default}"
  local image="${2:-nicolaka/netshoot}"

  echo "Launching debug pod in namespace: $namespace"
  kubectl run "debug-$(date +%s)" \
    --namespace="$namespace" \
    --rm -it \
    --restart=Never \
    --image="$image" \
    -- /bin/bash
}
alias kdebug='k8s_debug_pod'

# ──────────────────────────────────────────────────────────────
# Get all images running in the cluster
# ──────────────────────────────────────────────────────────────
k8s_running_images() {
  kubectl get pods --all-namespaces -o jsonpath=\
'{range .items[*]}{.metadata.namespace}{"\t"}{.metadata.name}{"\t"}{range .spec.containers[*]}{.image}{"\n"}{end}{end}' \
    | sort -u \
    | column -t
}

# ──────────────────────────────────────────────────────────────
# Watch events in real-time for a namespace
# ──────────────────────────────────────────────────────────────
k8s_watch_events() {
  local namespace="${1:-default}"

  kubectl get events \
    --namespace="$namespace" \
    --sort-by='.lastTimestamp' \
    --watch
}
alias kevents='k8s_watch_events'
```

---

## Cloud CLI Aliases and Functions

### AWS Aliases and Functions

```bash
# ──────────────────────────────────────────────────────────────
# AWS CLI Aliases
# ──────────────────────────────────────────────────────────────

alias awswho='aws sts get-caller-identity'
alias awsregions='aws ec2 describe-regions --output table'
alias awsvpcs='aws ec2 describe-vpcs --output table'

# S3 shortcuts
alias s3ls='aws s3 ls'
alias s3cp='aws s3 cp'
alias s3sync='aws s3 sync'

# EC2 shortcuts
alias ec2ls='aws ec2 describe-instances --query "Reservations[].Instances[].{ID:InstanceId,Type:InstanceType,State:State.Name,Name:Tags[?Key==\`Name\`].Value|[0],IP:PrivateIpAddress}" --output table'
alias ec2running='aws ec2 describe-instances \
  --filters "Name=instance-state-name,Values=running" \
  --query "Reservations[].Instances[].{ID:InstanceId,Name:Tags[?Key==\`Name\`].Value|[0],IP:PrivateIpAddress}" \
  --output table'

# EKS
alias eksls='aws eks list-clusters --output table'

# ──────────────────────────────────────────────────────────────
# Switch AWS profile
# ──────────────────────────────────────────────────────────────
aws_switch_profile() {
  local profile="${1:-}"

  if [ -z "$profile" ]; then
    profile=$(aws configure list-profiles \
      | fzf --height=40% --reverse --prompt="AWS profile> ")
  fi

  if [ -n "$profile" ]; then
    export AWS_PROFILE="$profile"
    echo "AWS profile: $profile"
    aws sts get-caller-identity --output table 2>/dev/null \
      || echo "Warning: Unable to verify credentials for profile $profile"
  fi
}
alias awsp='aws_switch_profile'

# ──────────────────────────────────────────────────────────────
# Connect to EKS cluster
# ──────────────────────────────────────────────────────────────
aws_eks_connect() {
  local cluster="${1:-}"
  local region="${2:-${AWS_DEFAULT_REGION:-us-east-1}}"

  if [ -z "$cluster" ]; then
    cluster=$(aws eks list-clusters --region "$region" \
      --query 'clusters[]' --output text \
      | tr '\t' '\n' \
      | fzf --height=40% --reverse --prompt="EKS cluster> ")
  fi

  if [ -n "$cluster" ]; then
    echo "Connecting to EKS cluster: $cluster (region: $region)"
    aws eks update-kubeconfig --name "$cluster" --region "$region"
  fi
}

# ──────────────────────────────────────────────────────────────
# List Lambda functions with runtime info
# ──────────────────────────────────────────────────────────────
aws_lambda_list() {
  aws lambda list-functions \
    --query 'Functions[].{Name:FunctionName,Runtime:Runtime,Memory:MemorySize,Timeout:Timeout}' \
    --output table
}
alias awslambda='aws_lambda_list'

# ──────────────────────────────────────────────────────────────
# Get SSM parameter value
# ──────────────────────────────────────────────────────────────
aws_ssm_get() {
  local param="${1:?Usage: aws_ssm_get <parameter-name>}"

  aws ssm get-parameter \
    --name "$param" \
    --with-decryption \
    --query 'Parameter.Value' \
    --output text
}
```

### Google Cloud Aliases and Functions

```bash
# ──────────────────────────────────────────────────────────────
# GCP CLI Aliases
# ──────────────────────────────────────────────────────────────

alias gcpproject='gcloud config get project'
alias gcpregion='gcloud config get compute/region'
alias gcpzone='gcloud config get compute/zone'
alias gcpauth='gcloud auth login'
alias gcplist='gcloud projects list'
alias gcpconfigs='gcloud config configurations list'

# GKE
alias gkeclusters='gcloud container clusters list'

# Compute
alias gcels='gcloud compute instances list'

# ──────────────────────────────────────────────────────────────
# Switch GCP project
# ──────────────────────────────────────────────────────────────
gcp_switch_project() {
  local project="${1:-}"

  if [ -z "$project" ]; then
    project=$(gcloud projects list --format='value(projectId)' \
      | fzf --height=40% --reverse --prompt="GCP project> ")
  fi

  if [ -n "$project" ]; then
    gcloud config set project "$project"
    echo "GCP project: $project"
  fi
}
alias gcpp='gcp_switch_project'

# ──────────────────────────────────────────────────────────────
# Connect to GKE cluster
# ──────────────────────────────────────────────────────────────
gcp_gke_connect() {
  local cluster="${1:?Usage: gcp_gke_connect <cluster> [zone]}"
  local zone="${2:-$(gcloud config get compute/zone 2>/dev/null)}"

  if [ -z "$zone" ]; then
    echo "Error: No zone specified and no default zone configured."
    return 1
  fi

  echo "Connecting to GKE cluster: $cluster (zone: $zone)"
  gcloud container clusters get-credentials "$cluster" --zone "$zone"
}

# ──────────────────────────────────────────────────────────────
# SSH into a GCE instance
# ──────────────────────────────────────────────────────────────
gcp_ssh() {
  local instance="${1:-}"

  if [ -z "$instance" ]; then
    instance=$(gcloud compute instances list \
      --format='value(name,zone)' \
      | fzf --height=40% --reverse --prompt="instance> " \
      | awk '{print $1}')
  fi

  if [ -n "$instance" ]; then
    gcloud compute ssh "$instance"
  fi
}
```

### Azure CLI Aliases and Functions

```bash
# ──────────────────────────────────────────────────────────────
# Azure CLI Aliases
# ──────────────────────────────────────────────────────────────

alias azsub='az account show --query name -o tsv'
alias azsubid='az account show --query id -o tsv'
alias azsubs='az account list --query "[].{Name:name,ID:id,Default:isDefault}" -o table'
alias azrg='az group list --query "[].{Name:name,Location:location}" -o table'
alias azlogin='az login'

# AKS
alias aksls='az aks list -o table'

# VMs
alias azvmls='az vm list -d --query "[].{Name:name,RG:resourceGroup,State:powerState,IP:privateIps}" -o table'

# ──────────────────────────────────────────────────────────────
# Switch Azure subscription
# ──────────────────────────────────────────────────────────────
az_switch_sub() {
  local sub="${1:-}"

  if [ -z "$sub" ]; then
    sub=$(az account list --query '[].{name:name, id:id}' -o tsv \
      | fzf --height=40% --reverse --prompt="Azure subscription> " \
      | awk -F'\t' '{print $2}')
  fi

  if [ -n "$sub" ]; then
    az account set --subscription "$sub"
    echo "Azure subscription: $(az account show --query name -o tsv)"
  fi
}
alias azs='az_switch_sub'

# ──────────────────────────────────────────────────────────────
# Connect to AKS cluster
# ──────────────────────────────────────────────────────────────
az_aks_connect() {
  local cluster="${1:?Usage: az_aks_connect <cluster> <resource-group>}"
  local rg="${2:?Usage: az_aks_connect <cluster> <resource-group>}"

  echo "Connecting to AKS cluster: $cluster (RG: $rg)"
  az aks get-credentials --name "$cluster" --resource-group "$rg"
}

# ──────────────────────────────────────────────────────────────
# List all resources in a resource group
# ──────────────────────────────────────────────────────────────
az_rg_resources() {
  local rg="${1:?Usage: az_rg_resources <resource-group>}"

  az resource list \
    --resource-group "$rg" \
    --query "[].{Name:name,Type:type,Location:location}" \
    --output table
}
```

---

## Terraform Aliases and Functions

```bash
# ──────────────────────────────────────────────────────────────
# Terraform Aliases
# ──────────────────────────────────────────────────────────────

alias tfi='terraform init'
alias tfp='terraform plan'
alias tfa='terraform apply'
alias tfaa='terraform apply -auto-approve'
alias tfd='terraform destroy'
alias tff='terraform fmt -recursive'
alias tfv='terraform validate'
alias tfo='terraform output'
alias tfs='terraform state list'
alias tfss='terraform show'
alias tfw='terraform workspace'
alias tfwl='terraform workspace list'
alias tfws='terraform workspace select'

# Terragrunt
alias tg='terragrunt'
alias tgi='terragrunt init'
alias tgp='terragrunt plan'
alias tga='terragrunt apply'
alias tgaa='terragrunt run-all apply'
alias tgpa='terragrunt run-all plan'

# ──────────────────────────────────────────────────────────────
# Plan with output file for review workflow
# ──────────────────────────────────────────────────────────────
tf_plan_review() {
  local plan_file="${1:-tfplan}"

  echo "Creating plan file: ${plan_file}"
  terraform plan -out="$plan_file"
  echo ""
  echo "Review the plan above, then apply with:"
  echo "  terraform apply \"${plan_file}\""
}

# ──────────────────────────────────────────────────────────────
# Show resources in a specific state
# ──────────────────────────────────────────────────────────────
tf_state_search() {
  local pattern="${1:?Usage: tf_state_search <pattern>}"

  terraform state list | grep -i "$pattern"
}

# ──────────────────────────────────────────────────────────────
# Switch Terraform workspace with fuzzy search
# ──────────────────────────────────────────────────────────────
tf_workspace_switch() {
  local ws
  ws=$(terraform workspace list \
    | sed 's/^\* //' \
    | sed 's/^ *//' \
    | fzf --height=40% --reverse --prompt="workspace> ")

  if [ -n "$ws" ]; then
    terraform workspace select "$ws"
  fi
}
alias tfwsf='tf_workspace_switch'
```

---

## Directory Navigation

### Navigation Aliases

```bash
# ──────────────────────────────────────────────────────────────
# Quick Directory Navigation
# ──────────────────────────────────────────────────────────────

# Parent directories
alias ..='cd ..'
alias ...='cd ../..'
alias ....='cd ../../..'
alias .....='cd ../../../..'

# Common project directories (customize per environment)
alias proj='cd ~/projects'
alias repos='cd ~/repos'
alias dl='cd ~/Downloads'
alias desk='cd ~/Desktop'
alias dotfiles='cd ~/dotfiles'

# Listing improvements
alias ll='ls -lAh'
alias la='ls -la'
alias lt='ls -lAht'
alias lsize='ls -lAhS'

# Quick directory operations
alias mkdir='mkdir -pv'
alias md='mkdir -pv'
```

### Navigation Functions

```bash
# ──────────────────────────────────────────────────────────────
# Create directory and cd into it
# ──────────────────────────────────────────────────────────────
mkcd() {
  local dir="${1:?Usage: mkcd <directory>}"
  mkdir -p "$dir" && cd "$dir" || return 1
}

# ──────────────────────────────────────────────────────────────
# Fuzzy find and cd into a directory (requires fzf and fd)
# ──────────────────────────────────────────────────────────────
fcd() {
  local dir
  dir=$(find "${1:-.}" -type d -not -path '*/\.*' 2>/dev/null \
    | fzf --height=40% --reverse --prompt="cd> ")

  if [ -n "$dir" ]; then
    cd "$dir" || return 1
  fi
}

# ──────────────────────────────────────────────────────────────
# Jump to a project directory (searches common project roots)
# ──────────────────────────────────────────────────────────────
project() {
  local search_dirs=(
    "$HOME/projects"
    "$HOME/repos"
    "$HOME/work"
    "$HOME/src"
  )

  local dirs=""
  for base in "${search_dirs[@]}"; do
    if [ -d "$base" ]; then
      dirs="${dirs}$(find "$base" -maxdepth 2 -type d -name '.git' \
        -exec dirname {} \; 2>/dev/null)
"
    fi
  done

  local selected
  selected=$(echo "$dirs" | grep -v '^$' | sort -u \
    | fzf --height=40% --reverse --prompt="project> ")

  if [ -n "$selected" ]; then
    cd "$selected" || return 1
    echo "$(pwd)"
    git status --short 2>/dev/null
  fi
}
alias p='project'

# ──────────────────────────────────────────────────────────────
# Bookmark directories for quick access
# ──────────────────────────────────────────────────────────────
BOOKMARKS_FILE="${HOME}/.shell_bookmarks"

bookmark_save() {
  local name="${1:?Usage: bookmark_save <name>}"
  local dir="${2:-$(pwd)}"

  # Remove existing bookmark with same name
  if [ -f "$BOOKMARKS_FILE" ]; then
    grep -v "^${name}|" "$BOOKMARKS_FILE" > "${BOOKMARKS_FILE}.tmp"
    mv "${BOOKMARKS_FILE}.tmp" "$BOOKMARKS_FILE"
  fi

  echo "${name}|${dir}" >> "$BOOKMARKS_FILE"
  echo "Bookmark saved: ${name} -> ${dir}"
}

bookmark_go() {
  local name="${1:-}"

  if [ ! -f "$BOOKMARKS_FILE" ]; then
    echo "No bookmarks found."
    return 1
  fi

  if [ -z "$name" ]; then
    # Fuzzy search bookmarks
    local entry
    entry=$(cat "$BOOKMARKS_FILE" \
      | fzf --height=40% --reverse --prompt="bookmark> " \
             --delimiter='|' --with-nth=1)
    name=$(echo "$entry" | cut -d'|' -f1)
  fi

  local dir
  dir=$(grep "^${name}|" "$BOOKMARKS_FILE" | cut -d'|' -f2)

  if [ -n "$dir" ] && [ -d "$dir" ]; then
    cd "$dir" || return 1
    echo "$(pwd)"
  else
    echo "Bookmark not found or directory missing: $name"
    return 1
  fi
}

bookmark_list() {
  if [ ! -f "$BOOKMARKS_FILE" ]; then
    echo "No bookmarks found."
    return 0
  fi

  echo "Saved bookmarks:"
  while IFS='|' read -r name dir; do
    printf "  %-20s %s\n" "$name" "$dir"
  done < "$BOOKMARKS_FILE"
}

alias bm='bookmark_save'
alias bmg='bookmark_go'
alias bml='bookmark_list'
```

### Directory History Stack

```bash
# ──────────────────────────────────────────────────────────────
# Enhanced directory history with pushd/popd
# ──────────────────────────────────────────────────────────────
cd() {
  if [ $# -eq 0 ]; then
    builtin pushd "$HOME" > /dev/null || return 1
  else
    builtin pushd "$@" > /dev/null || return 1
  fi
}

# Show directory stack
alias dh='dirs -v | head -20'

# Go back to previous directory
alias bd='popd > /dev/null'

# Jump to Nth directory in stack
d() {
  local index="${1:?Usage: d <stack-index>}"
  local dir
  dir=$(dirs -l "+$index" 2>/dev/null)

  if [ -n "$dir" ]; then
    builtin pushd "+$index" > /dev/null || return 1
  else
    echo "Invalid stack index: $index"
    return 1
  fi
}
```

---

## Process and System Management

### Process Aliases

```bash
# ──────────────────────────────────────────────────────────────
# Process Management Aliases
# ──────────────────────────────────────────────────────────────

# Find processes
alias psg='ps aux | grep -v grep | grep -i'
alias pst='ps aux --sort=-%cpu | head -15'
alias psm='ps aux --sort=-%mem | head -15'

# Network
alias ports='lsof -i -P -n | grep LISTEN'
alias myip='curl -s https://ifconfig.me'
alias localip='hostname -I 2>/dev/null || ipconfig getifaddr en0 2>/dev/null'

# Disk usage
alias duf='df -h | grep -v tmpfs | grep -v snap'
alias dush='du -sh * 2>/dev/null | sort -rh | head -20'

# System info
alias cpucount='nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null'
alias meminfo='free -h 2>/dev/null || vm_stat 2>/dev/null'

# File operations
alias cpv='rsync -ah --progress'
```

### Process Functions

```bash
# ──────────────────────────────────────────────────────────────
# Kill process on a specific port
# ──────────────────────────────────────────────────────────────
kill_port() {
  local port="${1:?Usage: kill_port <port>}"

  local pids
  pids=$(lsof -ti ":$port" 2>/dev/null)

  if [ -z "$pids" ]; then
    echo "No process found on port $port"
    return 0
  fi

  echo "Killing process(es) on port $port: $pids"
  echo "$pids" | xargs kill -9
  echo "Done."
}

# ──────────────────────────────────────────────────────────────
# Show which process is using a specific port
# ──────────────────────────────────────────────────────────────
port_info() {
  local port="${1:?Usage: port_info <port>}"

  lsof -i ":$port" -P -n 2>/dev/null \
    || ss -tlnp 2>/dev/null | grep ":$port"
}

# ──────────────────────────────────────────────────────────────
# Watch a command output (portable alternative to watch)
# ──────────────────────────────────────────────────────────────
repeat_cmd() {
  local interval="${1:?Usage: repeat_cmd <seconds> <command>}"
  shift

  while true; do
    clear
    echo "Every ${interval}s: $*"
    echo "──────────────────────────────────────────"
    eval "$@"
    sleep "$interval"
  done
}

# ──────────────────────────────────────────────────────────────
# Find large files in the current directory tree
# ──────────────────────────────────────────────────────────────
find_large_files() {
  local size="${1:-100M}"

  echo "Files larger than ${size}:"
  find . -type f -size "+${size}" -exec ls -lh {} \; 2>/dev/null \
    | awk '{printf "  %s %s\n", $5, $NF}' \
    | sort -rh
}
alias biggies='find_large_files'

# ──────────────────────────────────────────────────────────────
# Quick HTTP server for current directory
# ──────────────────────────────────────────────────────────────
serve() {
  local port="${1:-8000}"

  echo "Serving current directory on http://localhost:${port}"
  python3 -m http.server "$port" 2>/dev/null \
    || python -m SimpleHTTPServer "$port" 2>/dev/null \
    || echo "Python not available. Install Python to use this function."
}

# ──────────────────────────────────────────────────────────────
# Extract any archive format
# ──────────────────────────────────────────────────────────────
extract() {
  local file="${1:?Usage: extract <file>}"

  if [ ! -f "$file" ]; then
    echo "File not found: $file"
    return 1
  fi

  case "$file" in
    *.tar.bz2) tar xjf "$file"    ;;
    *.tar.gz)  tar xzf "$file"    ;;
    *.tar.xz)  tar xJf "$file"    ;;
    *.bz2)     bunzip2 "$file"    ;;
    *.rar)     unrar x "$file"    ;;
    *.gz)      gunzip "$file"     ;;
    *.tar)     tar xf "$file"     ;;
    *.tbz2)    tar xjf "$file"    ;;
    *.tgz)     tar xzf "$file"    ;;
    *.zip)     unzip "$file"      ;;
    *.Z)       uncompress "$file" ;;
    *.7z)      7z x "$file"       ;;
    *)         echo "Unknown archive format: $file" ; return 1 ;;
  esac
}
```

### Network Utilities

```bash
# ──────────────────────────────────────────────────────────────
# Quick connectivity check
# ──────────────────────────────────────────────────────────────
check_connectivity() {
  local targets=(
    "8.8.8.8|Google DNS"
    "1.1.1.1|Cloudflare DNS"
    "github.com|GitHub"
  )

  for entry in "${targets[@]}"; do
    local host="${entry%%|*}"
    local label="${entry##*|}"

    if ping -c1 -W2 "$host" > /dev/null 2>&1; then
      printf "  %-20s %s\n" "$label" "OK"
    else
      printf "  %-20s %s\n" "$label" "UNREACHABLE"
    fi
  done
}
alias netcheck='check_connectivity'

# ──────────────────────────────────────────────────────────────
# DNS lookup helper
# ──────────────────────────────────────────────────────────────
dns_lookup() {
  local domain="${1:?Usage: dns_lookup <domain>}"

  echo "=== A Records ==="
  dig +short A "$domain"

  echo ""
  echo "=== CNAME Records ==="
  dig +short CNAME "$domain"

  echo ""
  echo "=== MX Records ==="
  dig +short MX "$domain"

  echo ""
  echo "=== NS Records ==="
  dig +short NS "$domain"
}

# ──────────────────────────────────────────────────────────────
# Test HTTP endpoint response
# ──────────────────────────────────────────────────────────────
http_check() {
  local url="${1:?Usage: http_check <url>}"

  curl -s -o /dev/null -w \
    "URL: %{url_effective}\nHTTP Code: %{http_code}\nTime Total: %{time_total}s\nSize: %{size_download} bytes\n" \
    "$url"
}
alias hcheck='http_check'
```

---

## Safety and Best Practices

### Dangerous Command Protection

```bash
# ──────────────────────────────────────────────────────────────
# Add confirmation prompts to destructive commands
# ──────────────────────────────────────────────────────────────
alias rm='rm -i'
alias mv='mv -i'
alias cp='cp -i'

# Or use a safer rm alternative
alias trash='mv -t ~/.Trash 2>/dev/null || mv -t /tmp/trash'

# ──────────────────────────────────────────────────────────────
# Prevent accidental recursive operations on root
# ──────────────────────────────────────────────────────────────

# Good - requires --no-preserve-root for root operations
alias rm='rm -I --preserve-root 2>/dev/null || rm -i'
alias chmod='chmod --preserve-root 2>/dev/null || chmod'
alias chown='chown --preserve-root 2>/dev/null || chown'
```

### Environment Variable Safety

```bash
# ──────────────────────────────────────────────────────────────
# Validate required environment variables before operations
# ──────────────────────────────────────────────────────────────
require_env() {
  local missing=0

  for var in "$@"; do
    if [ -z "$(eval echo "\$$var")" ]; then
      echo "Error: Required environment variable $var is not set."
      missing=1
    fi
  done

  return $missing
}

# Usage in other functions
aws_deploy() {
  require_env AWS_PROFILE AWS_REGION || return 1

  echo "Deploying to $AWS_REGION with profile $AWS_PROFILE..."
  # ... deployment logic
}

# ──────────────────────────────────────────────────────────────
# Safe credential loading from files
# ──────────────────────────────────────────────────────────────
load_env() {
  local env_file="${1:-.env}"

  if [ ! -f "$env_file" ]; then
    echo "Environment file not found: $env_file"
    return 1
  fi

  # Only export valid KEY=VALUE lines, skip comments and empty lines
  while IFS= read -r line; do
    case "$line" in
      \#*|"") continue ;;
      *=*)
        local key="${line%%=*}"
        local value="${line#*=}"
        # Remove surrounding quotes
        value="${value%\"}"
        value="${value#\"}"
        value="${value%\'}"
        value="${value#\'}"
        export "$key=$value"
        ;;
    esac
  done < "$env_file"

  echo "Loaded environment from: $env_file"
}
```

### Alias Conflict Detection

```bash
# ──────────────────────────────────────────────────────────────
# Check if an alias or function would shadow an existing command
# ──────────────────────────────────────────────────────────────
check_alias_conflict() {
  local name="${1:?Usage: check_alias_conflict <name>}"

  echo "Checking: $name"

  # Check alias
  if alias "$name" 2>/dev/null; then
    echo "  WARNING: Existing alias found"
  fi

  # Check function
  if type "$name" 2>/dev/null | grep -q "function"; then
    echo "  WARNING: Existing function found"
  fi

  # Check binary
  if command -v "$name" > /dev/null 2>&1; then
    echo "  WARNING: Existing command found at $(command -v "$name")"
  fi
}

# ──────────────────────────────────────────────────────────────
# List all custom aliases grouped by prefix
# ──────────────────────────────────────────────────────────────
list_aliases() {
  echo "=== Git Aliases ==="
  alias | grep "^alias g" | sed 's/^alias /  /'

  echo ""
  echo "=== Docker Aliases ==="
  alias | grep "^alias d" | sed 's/^alias /  /'

  echo ""
  echo "=== Kubernetes Aliases ==="
  alias | grep "^alias k" | sed 's/^alias /  /'

  echo ""
  echo "=== Cloud Aliases ==="
  alias | grep -E "^alias (aws|gcp|az)" | sed 's/^alias /  /'

  echo ""
  echo "=== All Custom Functions ==="
  typeset -F 2>/dev/null | awk '{print "  " $3}' | sort
}
alias aliases='list_aliases'
```

---

## Loading Performance

### Lazy Loading for Slow Initializations

```bash
# ──────────────────────────────────────────────────────────────
# Lazy-load tools that have slow initialization
# ──────────────────────────────────────────────────────────────

# Lazy-load nvm (Node Version Manager)
# nvm init takes ~500ms, defer until first use
nvm() {
  unset -f nvm
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
  nvm "$@"
}

# Lazy-load pyenv
pyenv() {
  unset -f pyenv
  export PYENV_ROOT="$HOME/.pyenv"
  export PATH="$PYENV_ROOT/bin:$PATH"
  eval "$(command pyenv init -)"
  pyenv "$@"
}

# Lazy-load rbenv
rbenv() {
  unset -f rbenv
  eval "$(command rbenv init -)"
  rbenv "$@"
}
```

### Measuring Shell Startup Time

```bash
# ──────────────────────────────────────────────────────────────
# Profile shell startup time
# ──────────────────────────────────────────────────────────────
shell_profile_startup() {
  local shell="${1:-$SHELL}"
  local iterations="${2:-5}"
  local total=0

  echo "Profiling ${shell} startup (${iterations} iterations)..."

  for i in $(seq 1 "$iterations"); do
    local start
    start=$(date +%s%N 2>/dev/null || python3 -c 'import time; print(int(time.time()*1e9))')

    $shell -i -c exit 2>/dev/null

    local end
    end=$(date +%s%N 2>/dev/null || python3 -c 'import time; print(int(time.time()*1e9))')

    local elapsed=$(( (end - start) / 1000000 ))
    total=$(( total + elapsed ))
    echo "  Run $i: ${elapsed}ms"
  done

  echo "Average: $(( total / iterations ))ms"
}

# ──────────────────────────────────────────────────────────────
# Measure time to source a specific file
# ──────────────────────────────────────────────────────────────
time_source() {
  local file="${1:?Usage: time_source <file>}"

  if [ ! -f "$file" ]; then
    echo "File not found: $file"
    return 1
  fi

  local start end elapsed
  start=$(date +%s%N 2>/dev/null || python3 -c 'import time; print(int(time.time()*1e9))')
  source "$file"
  end=$(date +%s%N 2>/dev/null || python3 -c 'import time; print(int(time.time()*1e9))')
  elapsed=$(( (end - start) / 1000000 ))

  echo "${file}: ${elapsed}ms"
}
```

---

## Complete Shell Profile Example

```bash
#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# ~/.shell/aliases.sh - Complete alias collection
#
# @module shell_aliases
# @description Productivity aliases for development workflows
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2025-01-15
# @status stable
# ──────────────────────────────────────────────────────────────

# ── Git ──────────────────────────────────────────────────────
alias gs='git status'
alias gss='git status --short'
alias gp='git pull --rebase'
alias gpp='git push'
alias gpf='git push --force-with-lease'
alias gc='git commit -m'
alias gca='git commit --amend --no-edit'
alias ga='git add'
alias gap='git add --patch'
alias gd='git diff'
alias gds='git diff --staged'
alias gl='git log --oneline -20'
alias gla='git log --oneline --all --graph -20'
alias gb='git branch'
alias gba='git branch --all'
alias gco='git checkout'
alias gcb='git checkout -b'
alias gf='git fetch --all --prune'
alias gst='git stash'
alias gstp='git stash pop'
alias grl='git reflog --date=relative -20'

# ── Docker ───────────────────────────────────────────────────
alias dps='docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"'
alias dpsa='docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"'
alias dimg='docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"'
alias dcu='docker compose up -d'
alias dcd='docker compose down'
alias dcr='docker compose restart'
alias dcl='docker compose logs -f'
alias dcps='docker compose ps'
alias dcb='docker compose build --no-cache'
alias dprune='docker system prune -af --volumes'
alias dlogs='docker logs -f'
alias dstats='docker stats --no-stream'

# ── Kubernetes ───────────────────────────────────────────────
alias k='kubectl'
alias kgp='kubectl get pods'
alias kgpa='kubectl get pods --all-namespaces'
alias kgs='kubectl get svc'
alias kgd='kubectl get deployments'
alias kgn='kubectl get nodes'
alias kgns='kubectl get namespaces'
alias kdp='kubectl describe pod'
alias kds='kubectl describe svc'
alias kdd='kubectl describe deployment'
alias kl='kubectl logs -f'
alias kl1='kubectl logs --tail=100'
alias kexec='kubectl exec -it'
alias ka='kubectl apply -f'
alias kd='kubectl delete -f'
alias ktop='kubectl top pods'
alias ktopn='kubectl top nodes'
alias kwatch='kubectl get pods -w'

# ── Cloud CLIs ───────────────────────────────────────────────
alias awswho='aws sts get-caller-identity'
alias s3ls='aws s3 ls'
alias gcpproject='gcloud config get project'
alias gcpconfigs='gcloud config configurations list'
alias azsub='az account show --query name -o tsv'
alias azsubs='az account list --query "[].{Name:name,ID:id}" -o table'

# ── Terraform ────────────────────────────────────────────────
alias tfi='terraform init'
alias tfp='terraform plan'
alias tfa='terraform apply'
alias tff='terraform fmt -recursive'
alias tfv='terraform validate'
alias tfo='terraform output'
alias tfs='terraform state list'
alias tfw='terraform workspace'

# ── Navigation ───────────────────────────────────────────────
alias ..='cd ..'
alias ...='cd ../..'
alias ....='cd ../../..'
alias ll='ls -lAh'
alias la='ls -la'
alias lt='ls -lAht'
alias mkdir='mkdir -pv'

# ── Process/System ───────────────────────────────────────────
alias ports='lsof -i -P -n | grep LISTEN'
alias psg='ps aux | grep -v grep | grep -i'
alias myip='curl -s https://ifconfig.me'
alias duf='df -h | grep -v tmpfs | grep -v snap'
alias dush='du -sh * 2>/dev/null | sort -rh | head -20'

# ── Safety ───────────────────────────────────────────────────
alias rm='rm -i'
alias mv='mv -i'
alias cp='cp -i'
```

---

## References

- [Bash Reference Manual](https://www.gnu.org/software/bash/manual/)
- [Google Shell Style Guide](https://google.github.io/styleguide/shellguide.html)
- [fzf - Command-line Fuzzy Finder](https://github.com/junegunn/fzf)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [AWS CLI Command Reference](https://docs.aws.amazon.com/cli/latest/)
- [gcloud CLI Reference](https://cloud.google.com/sdk/gcloud/reference)
- [Azure CLI Reference](https://learn.microsoft.com/en-us/cli/azure/)
