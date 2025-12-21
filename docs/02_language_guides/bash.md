---
title: "Bash Scripting Style Guide"
description: "POSIX-compliant shell scripting standards for automation and DevOps"
author: "Tyler Dukes"
tags: [bash, shell, scripting, posix, automation]
category: "Language Guides"
status: "active"
---

## Language Overview

**Bash** (Bourne Again SHell) is a Unix shell and command language used for automation,
system administration, and DevOps workflows. While powerful for system tasks, it has
limitations that make higher-level languages preferable for complex logic.

### Key Characteristics

- **Paradigm**: Procedural scripting language
- **Type System**: Untyped (strings by default)
- **Execution**: Interpreted by shell
- **POSIX Compliance**: Target POSIX sh for maximum portability
- **Use Case**: System automation, CI/CD pipelines, simple glue scripts

### When to Use Bash

✅ **Good Use Cases**:

- Simple automation scripts (< 200 lines)
- System administration tasks
- CI/CD pipeline steps
- Git hooks
- Docker entrypoint scripts
- Environment setup scripts
- File manipulation and system commands

❌ **Avoid Bash For**:

- Complex business logic
- Data processing and transformation
- API clients
- Scripts requiring JSON/YAML parsing
- Code requiring testing frameworks
- Scripts > 200 lines

**Use Python, Go, or TypeScript instead** when:

- You need data structures (maps, arrays, objects)
- JSON/YAML processing is required
- Complex error handling needed
- Unit testing is important
- Cross-platform compatibility matters

---

## Quick Reference

| **Category** | **Convention** | **Example** | **Notes** |
|-------------|----------------|-------------|-----------|
| **Naming** | | | |
| Variables | `lowercase` or `snake_case` | `user_count`, `max_retries` | Local variables lowercase |
| Constants | `UPPER_SNAKE_CASE` | `MAX_RETRIES`, `API_URL` | Readonly global variables |
| Functions | `lowercase` or `snake_case` | `get_user()`, `validate_input()` | Descriptive function names |
| Environment Vars | `UPPER_SNAKE_CASE` | `PATH`, `HOME`, `MYAPP_CONFIG` | Exported variables |
| **Files** | | | |
| Scripts | `kebab-case.sh` | `deploy-app.sh`, `backup.sh` | Lowercase with `.sh` extension |
| Executable | No extension | `deploy-app` | If in PATH, omit `.sh` |
| **Shebang** | | | |
| POSIX | `#!/bin/sh` | `#!/bin/sh` | Maximum portability |
| Bash-specific | `#!/usr/bin/env bash` | `#!/usr/bin/env bash` | When Bash features needed |
| **Formatting** | | | |
| Indentation | 2 spaces | `if [ "$x" = "y" ]; then` | Never tabs |
| Line Length | 80 characters | `# Keep lines short` | Maximum readability |
| **Quoting** | | | |
| Variables | Always quote | `"$variable"` | Prevent word splitting |
| Arrays | Quote expansion | `"${array[@]}"` | Preserve elements |
| **Conditionals** | | | |
| POSIX Test | `[ condition ]` | `if [ "$x" = "y" ]; then` | Single brackets |
| Bash Test | `[[ condition ]]` | `if [[ $x == y ]]; then` | Double brackets (non-POSIX) |
| **Error Handling** | | | |
| Exit on Error | `set -e` | `set -euo pipefail` | Fail fast on errors |
| Undefined Vars | `set -u` | `set -euo pipefail` | Error on undefined variables |
| Pipe Failures | `set -o pipefail` | `set -euo pipefail` | Catch pipe failures |
| **Functions** | | | |
| Declaration | POSIX style | `func_name() { ... }` | No `function` keyword |
| Return | Exit code | `return 1` | 0 = success, non-zero = failure |

---

## POSIX Compliance

Write POSIX-compliant scripts for maximum portability across systems.

```bash
#!/bin/sh
## Good - POSIX compliant shebang
```

```bash
#!/usr/bin/env bash
## Acceptable - When bash-specific features are needed
## Document bash requirement in README
```

### Bash-only Features to Avoid

```bash
## Bad - Bash-specific array syntax
declare -a my_array=("item1" "item2")

## Bad - Bash-specific [[ ]] test
if [[ "$var" == "value" ]]; then
  echo "match"
fi

## Good - POSIX compliant [ ] test
if [ "$var" = "value" ]; then
  echo "match"
fi

## Bad - Bash process substitution
diff <(command1) <(command2)

## Good - Use temporary files
command1 > /tmp/file1
command2 > /tmp/file2
diff /tmp/file1 /tmp/file2
```

---

## Script Header and Metadata

Every script must start with a header including metadata and error handling:

```bash
#!/bin/sh
"""
@module deploy_application
@description Deploys application to production environment
@dependencies curl, jq, docker
@version 1.2.0
@author Tyler Dukes
@last_updated 2025-10-28
"""

## Strict error handling
set -o errexit   # Exit on error
set -o nounset   # Exit on undefined variable
set -o pipefail  # Catch errors in pipelines

## Script constants
readonly SCRIPT_NAME="$(basename "$0")"
readonly SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
readonly LOG_FILE="/var/log/${SCRIPT_NAME}.log"

## Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m' # No Color
```

### Set Options Explained

```bash
set -o errexit    # Exit immediately if a command exits with non-zero status
set -o nounset    # Treat unset variables as errors
set -o pipefail   # Return exit status of last failed command in pipeline

## Alternative short form
set -euo pipefail
```

---

## Function Definitions

Use functions for reusable code blocks:

```bash
## Function definition - no 'function' keyword for POSIX compliance
log_info() {
  local message="$1"
  echo "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $message" >&2
}

log_error() {
  local message="$1"
  echo "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $message" >&2
}

log_warning() {
  local message="$1"
  echo "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $message" >&2
}

## Function with return value
check_command_exists() {
  local cmd="$1"
  if command -v "$cmd" >/dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}

## Function with multiple parameters
deploy_service() {
  local service_name="$1"
  local environment="$2"
  local version="${3:-latest}"  # Default to 'latest'

  log_info "Deploying $service_name to $environment (version: $version)"

  # Deployment logic here
  if docker pull "$service_name:$version"; then
    log_info "Successfully pulled $service_name:$version"
    return 0
  else
    log_error "Failed to pull $service_name:$version"
    return 1
  fi
}
```

---

## Argument Parsing

### Simple Argument Parsing

```bash
show_help() {
  cat << EOF
Usage: $SCRIPT_NAME [OPTIONS] <environment>

Deploy application to specified environment

ARGUMENTS:
    environment    Target environment (dev|staging|prod)

OPTIONS:
    -h, --help          Show this help message
    -v, --version       Show script version
    -d, --dry-run       Run in dry-run mode
    -f, --force         Force deployment without confirmation

EXAMPLES:
    $SCRIPT_NAME staging
    $SCRIPT_NAME --dry-run prod
    $SCRIPT_NAME -f staging

EOF
}

## Parse command-line arguments
parse_arguments() {
  DRY_RUN=false
  FORCE=false
  ENVIRONMENT=""

  while [ $# -gt 0 ]; do
    case "$1" in
      -h|--help)
        show_help
        exit 0
        ;;
      -v|--version)
        echo "$SCRIPT_NAME version 1.2.0"
        exit 0
        ;;
      -d|--dry-run)
        DRY_RUN=true
        shift
        ;;
      -f|--force)
        FORCE=true
        shift
        ;;
      -*)
        log_error "Unknown option: $1"
        show_help
        exit 1
        ;;
      *)
        ENVIRONMENT="$1"
        shift
        ;;
    esac
  done

  # Validate required arguments
  if [ -z "$ENVIRONMENT" ]; then
    log_error "Environment argument is required"
    show_help
    exit 1
  fi

  # Validate environment value
  case "$ENVIRONMENT" in
    dev|staging|prod)
      ;;
    *)
      log_error "Invalid environment: $ENVIRONMENT (must be dev, staging, or prod)"
      exit 1
      ;;
  esac
}
```

---

## Error Handling

### Trap Signals for Cleanup

```bash
## Cleanup function
cleanup() {
  local exit_code=$?

  log_info "Cleaning up temporary files..."
  rm -f "$TEMP_FILE"
  rm -rf "$TEMP_DIR"

  if [ $exit_code -ne 0 ]; then
    log_error "Script failed with exit code $exit_code"
  else
    log_info "Script completed successfully"
  fi

  exit $exit_code
}

## Register cleanup trap
trap cleanup EXIT INT TERM

## Create temporary files
TEMP_FILE=$(mktemp)
TEMP_DIR=$(mktemp -d)
```

### Error Handling Patterns

```bash
## Check command success
if ! check_command_exists "docker"; then
  log_error "docker is not installed"
  exit 1
fi

## Capture command output and check status
if output=$(docker ps 2>&1); then
  log_info "Docker is running"
else
  log_error "Docker command failed: $output"
  exit 1
fi

## Conditional execution with error messages
docker pull "$IMAGE_NAME" || {
  log_error "Failed to pull Docker image $IMAGE_NAME"
  exit 1
}

## Use subshell to prevent exit on error
if (set -e; command1 && command2 && command3); then
  log_info "All commands succeeded"
else
  log_error "One or more commands failed"
fi
```

---

## Temporary File Handling

Always use `mktemp` for temporary files and ensure cleanup:

```bash
## Create temporary file
TEMP_FILE=$(mktemp) || {
  log_error "Failed to create temporary file"
  exit 1
}

## Create temporary directory
TEMP_DIR=$(mktemp -d) || {
  log_error "Failed to create temporary directory"
  exit 1
}

## Ensure cleanup on exit
trap 'rm -f "$TEMP_FILE"; rm -rf "$TEMP_DIR"' EXIT

## Use temporary file
echo "data" > "$TEMP_FILE"
process_file "$TEMP_FILE"
```

---

## String Manipulation

```bash
## Variable assignment
name="John Doe"

## String length
length=${#name}

## Substring extraction (not POSIX - use cut/awk instead for portability)
## ${variable:offset:length} is bash-specific

## POSIX-compliant substring with cut
first_name=$(echo "$name" | cut -d' ' -f1)

## String replacement (use sed for POSIX)
## ${variable/pattern/replacement} is bash-specific

## POSIX-compliant replacement
new_name=$(echo "$name" | sed 's/John/Jane/')

## Case conversion (use tr for POSIX)
upper_name=$(echo "$name" | tr '[:lower:]' '[:upper:]')
lower_name=$(echo "$name" | tr '[:upper:]' '[:lower:]')

## String concatenation
full_path="${directory}/${filename}"

## Default values
database_host="${DB_HOST:-localhost}"
database_port="${DB_PORT:-5432}"
```

---

## Conditional Statements

```bash
## Basic if statement
if [ "$ENVIRONMENT" = "prod" ]; then
  log_warning "Deploying to production"
fi

## If-else
if [ -f "$config_file" ]; then
  log_info "Config file found: $config_file"
else
  log_error "Config file not found: $config_file"
  exit 1
fi

## If-elif-else
if [ "$status_code" -eq 200 ]; then
  log_info "Request successful"
elif [ "$status_code" -eq 404 ]; then
  log_error "Resource not found"
elif [ "$status_code" -ge 500 ]; then
  log_error "Server error"
else
  log_warning "Unexpected status code: $status_code"
fi

## Test operators
[ -f "$file" ]       # File exists and is regular file
[ -d "$dir" ]        # Directory exists
[ -z "$var" ]        # String is empty
[ -n "$var" ]        # String is not empty
[ "$a" = "$b" ]      # Strings are equal
[ "$a" != "$b" ]     # Strings are not equal
[ "$a" -eq "$b" ]    # Numbers are equal
[ "$a" -ne "$b" ]    # Numbers are not equal
[ "$a" -lt "$b" ]    # a less than b
[ "$a" -le "$b" ]    # a less than or equal to b
[ "$a" -gt "$b" ]    # a greater than b
[ "$a" -ge "$b" ]    # a greater than or equal to b

## Logical operators
[ -f "$file" ] && [ -r "$file" ]   # AND
[ -f "$file" ] || [ -d "$dir" ]    # OR
[ ! -f "$file" ]                    # NOT
```

---

## Loops

```bash
## For loop with list
for env in dev staging prod; do
  log_info "Deploying to $env"
  deploy_to_environment "$env"
done

## For loop with command output
for file in *.txt; do
  if [ -f "$file" ]; then
    process_file "$file"
  fi
done

## For loop with range (use seq for POSIX)
for i in $(seq 1 5); do
  echo "Iteration $i"
done

## While loop
count=0
while [ $count -lt 10 ]; do
  log_info "Count: $count"
  count=$((count + 1))
done

## Read file line by line
while IFS= read -r line; do
  process_line "$line"
done < "$input_file"

## Until loop
until check_service_health; do
  log_info "Waiting for service to be healthy..."
  sleep 5
done
```

---

## HERE Documents

```bash
## Basic HERE document
cat << EOF
This is a multi-line
text block that will
be printed as-is
EOF

## HERE document with variable expansion
cat << EOF
Environment: $ENVIRONMENT
Deployment time: $(date)
User: $USER
EOF

## HERE document without variable expansion (quoted delimiter)
cat << 'EOF'
This will not expand $VARIABLES
Use this for literal text
EOF

## HERE document to file
cat << EOF > config.yaml
---
environment: $ENVIRONMENT
database:
  host: $DB_HOST
  port: $DB_PORT
EOF

## HERE document to command
docker run -i myimage << EOF
command1
command2
command3
EOF
```

---

## Command Substitution

```bash
## Modern command substitution (POSIX)
current_date=$(date '+%Y-%m-%d')
file_count=$(ls -1 | wc -l)
git_branch=$(git rev-parse --abbrev-ref HEAD)

## Nested command substitution
project_root=$(cd "$(dirname "$0")/.." && pwd)

## Capture command output and status
if output=$(docker ps 2>&1); then
  log_info "Docker running with $(echo "$output" | wc -l) containers"
fi
```

---

## Arrays (Use Carefully - Bash-specific)

For POSIX compliance, use whitespace-separated strings or multiple variables:

```bash
## POSIX-compliant approach - avoid arrays
environments="dev staging prod"
for env in $environments; do
  echo "$env"
done

## If you MUST use arrays (bash-only), document the requirement
#!/bin/bash  # Note: requires bash, not POSIX sh

## Bash array declaration
declare -a servers=("server1" "server2" "server3")

## Array iteration
for server in "${servers[@]}"; do
  echo "Processing $server"
done

## Array length
count=${#servers[@]}
```

---

## Common Pitfalls

### Unquoted Variable Expansion

**Issue**: Unquoted variables undergo word splitting and glob expansion, causing failures with
filenames containing spaces or special characters.

**Example**:

```bash
## Bad - Breaks with spaces in filename
file="my document.txt"
if [ -f $file ]; then  # Expands to: [ -f my document.txt ]
  cat $file  # Error: cat: my: No such file or directory
fi
```

**Solution**: Always quote variable expansions unless you explicitly need word splitting.

```bash
## Good - Properly quoted
file="my document.txt"
if [ -f "$file" ]; then  # Correctly: [ -f "my document.txt" ]
  cat "$file"
fi

## Good - Array handling
files=("file1.txt" "file 2.txt" "file 3.txt")
for file in "${files[@]}"; do  # Preserves each element
  process "$file"
done
```

**Key Points**:

- Always quote variables: `"$var"` not `$var`
- Quote array expansions: `"${array[@]}"`
- Exceptions: When word splitting is intended (rare)
- Use ShellCheck to catch unquoted variables

### Subshell Variable Scope

**Issue**: Variables set in subshells (pipes, command substitution) don't persist in the parent shell.

**Example**:

```bash
## Bad - count remains 0
count=0
echo "line1\nline2\nline3" | while read line; do
  count=$((count + 1))  # Executes in subshell
done
echo "Lines: $count"  # Prints: Lines: 0 (subshell variable lost)
```

**Solution**: Use process substitution, here-strings, or avoid pipes for variable assignment.

```bash
## Good - Process substitution (no subshell)
count=0
while read line; do
  count=$((count + 1))
done < <(echo -e "line1\nline2\nline3")
echo "Lines: $count"  # Prints: Lines: 3

## Good - Here-string
count=0
while read line; do
  count=$((count + 1))
done <<< "$(cat file.txt)"
echo "Lines: $count"

## Good - Read from file directly
count=0
while IFS= read -r line; do
  count=$((count + 1))
done < file.txt
echo "Lines: $count"
```

**Key Points**:

- Pipes create subshells; variables set inside don't persist
- Use `while ... done < <(command)` to avoid subshells
- Command substitution `$(...)` runs in subshell
- Export doesn't help with pipe subshells

### Test Command Bracket Confusion

**Issue**: Mixing `[ ]` (POSIX test) and `[[ ]]` (Bash extension) causes portability issues and subtle bugs.

**Example**:

```bash
## Bad - Using == in POSIX test
if [ "$var" == "value" ]; then  # Not POSIX compliant!
  echo "match"
fi

## Bad - Pattern matching in [ ]
if [ "$file" == *.txt ]; then  # Doesn't work as expected
  echo "text file"
fi
```

**Solution**: Use `[ ]` with `=` for POSIX compliance, or use `[[ ]]` for Bash-specific features.

```bash
## Good - POSIX compliant
if [ "$var" = "value" ]; then  # Single = for POSIX
  echo "match"
fi

## Good - Bash pattern matching (requires [[ ]])
if [[ "$file" == *.txt ]]; then  # Works with [[ ]]
  echo "text file"
fi

## Good - Bash regex matching
if [[ "$email" =~ ^[a-z]+@[a-z]+\.[a-z]+$ ]]; then
  echo "valid email"
fi
```

**Key Points**:

- Use `=` not `==` in `[ ]` for portability
- Pattern matching requires `[[ ]]` (Bash-only)
- Regex matching only works with `[[ ]]`
- `[ ]` is POSIX, `[[ ]]` is Bash-specific
- Choose based on portability needs

### Exit Code Confusion

**Issue**: Misunderstanding that 0 means success and non-zero means failure leads to inverted logic.

**Example**:

```bash
## Bad - Inverted logic
check_status() {
  if systemctl is-active myapp; then
    return 1  # Wrong! Returns failure on success
  else
    return 0  # Wrong! Returns success on failure
  fi
}

if check_status; then  # Triggers on 0 (wrong condition)
  echo "Service is down"
fi
```

**Solution**: Return 0 for success, non-zero for failure. Test exit codes correctly.

```bash
## Good - Correct exit codes
check_status() {
  if systemctl is-active myapp >/dev/null 2>&1; then
    return 0  # Success
  else
    return 1  # Failure
  fi
}

if check_status; then  # if command succeeds (returns 0)
  echo "Service is running"
else
  echo "Service is down"
fi

## Good - Direct command testing
if systemctl is-active myapp >/dev/null 2>&1; then
  echo "Running"
fi
```

**Key Points**:

- Exit code 0 = success, non-zero = failure
- `if command` succeeds when command returns 0
- Use `$?` to capture last exit code
- Functions return values via exit codes, not stdout
- Test exit codes: `if [ $? -eq 0 ]`

### Arithmetic Expansion Gotchas

**Issue**: Shell arithmetic doesn't support floating point, and leading zeros cause octal interpretation.

**Example**:

```bash
## Bad - Floating point (not supported)
result=$((10 / 3))  # Result: 3 (not 3.333...)
ratio=$((5.5 * 2))  # Error: invalid arithmetic operator

## Bad - Octal interpretation
number=08
result=$((number + 1))  # Error: invalid octal number

## Bad - Unquoted variables
value="10 + 5"
result=$((value))  # Evaluates to 15 (code injection risk!)
```

**Solution**: Use `bc` for floating point, strip leading zeros, validate input.

```bash
## Good - Use bc for floating point
result=$(echo "scale=2; 10 / 3" | bc)  # 3.33
ratio=$(echo "scale=2; 5.5 * 2" | bc)  # 11.0

## Good - Strip leading zeros
number=08
number=$((10#$number))  # Force base-10: 8
result=$((number + 1))  # 9

## Good - Validate numeric input
if [[ "$value" =~ ^[0-9]+$ ]]; then
  result=$((value + 10))
else
  echo "Error: Not a number"
fi
```

**Key Points**:

- Shell arithmetic is integer-only
- Use `bc` for floating point calculations
- Leading zeros trigger octal (base-8) interpretation
- Use `10#$var` to force base-10
- Validate numeric input before arithmetic

### Set -e Trap Pitfalls

**Issue**: `set -e` doesn't exit on all errors, particularly in conditionals and pipes, creating false sense of safety.

**Example**:

```bash
#!/bin/bash
set -e  # Exit on error

## Bad - These don't trigger exit despite errors
if false; then  # Condition checked, no exit
  echo "won't print"
fi

result=$(false)  # Command substitution checked, no exit
echo "Still running: $result"

false && echo "won't print"  # Left side of && doesn't exit
false || echo "will print"   # Left side of || doesn't exit
```

**Solution**: Combine `set -e` with explicit error checking, use `set -o pipefail`, and understand its limitations.

```bash
#!/bin/bash
set -euo pipefail  # Exit on error, undefined vars, pipe failures

## Good - Explicit error handling
if ! command1; then
  echo "command1 failed" >&2
  exit 1
fi

## Good - Check command substitution
if ! result=$(complex_command); then
  echo "complex_command failed" >&2
  exit 1
fi

## Good - Trap for cleanup
trap 'echo "Error on line $LINENO" >&2' ERR
```

**Key Points**:

- `set -e` doesn't exit in: `if`, `while`, `&&`, `||`, `!`
- Add `set -o pipefail` to catch pipe failures
- Use `set -u` to catch undefined variables
- Add traps for cleanup on error
- Don't rely solely on `set -e`

---

## Anti-Patterns

### ❌ Avoid: Unquoted Variables

```bash
## Bad - Word splitting and globbing issues
file=$1
if [ -f $file ]; then  # Breaks with spaces in filename
  cat $file
fi

## Good - Always quote variables
file="$1"
if [ -f "$file" ]; then
  cat "$file"
fi
```

### ❌ Avoid: Using `eval`

```bash
## Bad - Security risk, arbitrary code execution
user_input="$1"
eval "$user_input"

## Good - Use explicit commands
case "$command" in
  start) start_service ;;
  stop)  stop_service ;;
  *)     log_error "Unknown command" ;;
esac
```

### ❌ Avoid: Parsing ls Output

```bash
## Bad - Breaks with spaces, special characters
for file in $(ls *.txt); do
  echo "$file"
done

## Good - Use glob patterns
for file in *.txt; do
  if [ -f "$file" ]; then
    echo "$file"
  fi
done
```

### ❌ Avoid: Useless cat

```bash
## Bad - Unnecessary use of cat
cat file.txt | grep "pattern"

## Good - Direct input redirection
grep "pattern" file.txt
```

### ❌ Avoid: Test with ==

```bash
## Bad - Not POSIX compliant
if [ "$var" == "value" ]; then
  echo "match"
fi

## Good - POSIX single =
if [ "$var" = "value" ]; then
  echo "match"
fi
```

### ❌ Avoid: Ignoring Exit Codes

```bash
## Bad - No error checking
curl -o file.txt https://example.com/file.txt
process_file file.txt

## Good - Check exit codes
if curl -o file.txt https://example.com/file.txt; then
  process_file file.txt
else
  log_error "Failed to download file"
  exit 1
fi
```

### ❌ Avoid: Using cd Without Checks

```bash
## Bad - cd might fail
cd /some/directory
rm -rf *

## Good - Check cd success
if ! cd /some/directory; then
  log_error "Failed to change directory"
  exit 1
fi
rm -rf *

## Better - Use subshell
(
  cd /some/directory || exit 1
  rm -rf *
)
```

---

## Tool Configuration

### shellcheck

`.shellcheckrc`:

```text
## Disable specific warnings
disable=SC2034  # Unused variable
disable=SC2086  # Unquoted variable (if intentional)

## Enable all optional checks
enable=all

## Specify shell dialect
shell=sh
```

Run shellcheck:

```bash
shellcheck script.sh
shellcheck -x script.sh  # Follow source files
```

### shfmt

`.editorconfig`:

```ini
[*.sh]
indent_style = space
indent_size = 2
shell_variant = posix
```

Format scripts:

```bash
shfmt -w script.sh         # Format in place
shfmt -i 2 -s script.sh    # 2-space indent, simplify
```

### Pre-commit Hook

`.pre-commit-config.yaml`:

```yaml
repos:
  - repo: https://github.com/shellcheck-py/shellcheck-py
    rev: v0.9.0.5
    hooks:
      - id: shellcheck

  - repo: https://github.com/scop/pre-commit-shfmt
    rev: v3.7.0-1
    hooks:
      - id: shfmt
        args: [-w, -i, "2", -s]
```

---

## Complete Script Example

```bash
#!/bin/sh
"""
@module database_backup
@description Automated PostgreSQL database backup with rotation
@dependencies pg_dump, gzip, aws-cli
@version 1.0.0
@author Tyler Dukes
@last_updated 2025-10-28
"""

## Strict error handling
set -o errexit
set -o nounset
set -o pipefail

## Constants
readonly SCRIPT_NAME="$(basename "$0")"
readonly SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
readonly BACKUP_DIR="/var/backups/postgres"
readonly RETENTION_DAYS=7
readonly S3_BUCKET="s3://my-backups/postgres"

## Color codes
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m'

## Logging functions
log_info() {
  echo "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" >&2
}

log_error() {
  echo "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" >&2
}

log_warning() {
  echo "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" >&2
}

## Cleanup function
cleanup() {
  local exit_code=$?

  log_info "Cleaning up temporary files..."
  rm -f "$TEMP_FILE"

  if [ $exit_code -ne 0 ]; then
    log_error "Backup failed with exit code $exit_code"
  fi

  exit $exit_code
}

## Register cleanup trap
trap cleanup EXIT INT TERM

## Check prerequisites
check_prerequisites() {
  local missing_deps=""

  for cmd in pg_dump gzip aws; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
      missing_deps="$missing_deps $cmd"
    fi
  done

  if [ -n "$missing_deps" ]; then
    log_error "Missing dependencies:$missing_deps"
    return 1
  fi

  return 0
}

## Create backup
create_backup() {
  local database="$1"
  local timestamp=$(date '+%Y%m%d_%H%M%S')
  local backup_file="${BACKUP_DIR}/${database}_${timestamp}.sql.gz"

  log_info "Creating backup of database: $database"

  # Create backup directory if needed
  mkdir -p "$BACKUP_DIR"

  # Create backup
  if pg_dump "$database" | gzip > "$backup_file"; then
    log_info "Backup created: $backup_file"
    echo "$backup_file"
    return 0
  else
    log_error "Failed to create backup"
    return 1
  fi
}

## Upload to S3
upload_to_s3() {
  local backup_file="$1"
  local s3_path="${S3_BUCKET}/$(basename "$backup_file")"

  log_info "Uploading backup to S3: $s3_path"

  if aws s3 cp "$backup_file" "$s3_path"; then
    log_info "Backup uploaded successfully"
    return 0
  else
    log_error "Failed to upload backup to S3"
    return 1
  fi
}

## Rotate old backups
rotate_backups() {
  log_info "Rotating backups older than $RETENTION_DAYS days"

  find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

  local deleted_count=$(find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +$RETENTION_DAYS | wc -l)
  log_info "Deleted $deleted_count old backup(s)"
}

## Main function
main() {
  local database="${1:-myapp_production}"

  log_info "Starting database backup process"

  # Check prerequisites
  if ! check_prerequisites; then
    exit 1
  fi

  # Create temporary file
  TEMP_FILE=$(mktemp)

  # Create backup
  if backup_file=$(create_backup "$database"); then
    log_info "Backup created successfully"
  else
    exit 1
  fi

  # Upload to S3
  if upload_to_s3 "$backup_file"; then
    log_info "Upload successful"
  else
    log_warning "Upload failed, backup kept locally"
  fi

  # Rotate old backups
  rotate_backups

  log_info "Backup process completed successfully"
}

## Run main function with arguments
main "$@"
```

---

## Testing

### Testing Framework: BATS

Use [BATS (Bash Automated Testing System)](https://github.com/bats-core/bats-core) for testing shell scripts:

```bash
## Install BATS
git clone https://github.com/bats-core/bats-core.git
cd bats-core
./install.sh /usr/local

## Or via package manager
brew install bats-core  # macOS
apt-get install bats    # Debian/Ubuntu
```

### Test Structure

Organize tests in a `tests/` directory:

```text
project/
├── scripts/
│   └── deploy.sh
├── tests/
│   ├── test_helper.bash
│   ├── deploy.bats
│   └── fixtures/
│       └── sample_config.yaml
└── .bats-version
```

### BATS Test Example

```bash
## tests/deploy.bats
#!/usr/bin/env bats

# Load test helpers
load test_helper

setup() {
  # Run before each test
  export TEST_DIR="$(mktemp -d)"
  export PATH="$BATS_TEST_DIRNAME/../scripts:$PATH"
}

teardown() {
  # Run after each test
  rm -rf "$TEST_DIR"
}

@test "deploy script exists and is executable" {
  run which deploy.sh
  [ "$status" -eq 0 ]
  [ -x "$(which deploy.sh)" ]
}

@test "deploy fails without required environment variable" {
  run deploy.sh staging
  [ "$status" -eq 1 ]
  [[ "$output" =~ "DB_HOST not set" ]]
}

@test "deploy succeeds with valid configuration" {
  export DB_HOST="localhost"
  export DB_PORT="5432"

  run deploy.sh staging
  [ "$status" -eq 0 ]
  [[ "$output" =~ "Deployment successful" ]]
}

@test "validate_path rejects path traversal" {
  source ../scripts/deploy.sh

  run validate_path "../../../etc/passwd"
  [ "$status" -eq 1 ]
  [[ "$output" =~ "Path traversal detected" ]]
}

@test "log functions write to stderr" {
  source ../scripts/deploy.sh

  run log_info "test message"
  [ "$status" -eq 0 ]
  # BATS captures stderr in $output when using run
  [[ "$output" =~ "test message" ]]
}
```

### Test Helper Functions

```bash
## tests/test_helper.bash

# Common test setup
export FIXTURES="$BATS_TEST_DIRNAME/fixtures"

# Helper to check command exists
assert_command_exists() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || {
    echo "Required command not found: $cmd"
    return 1
  }
}

# Helper to assert file contains string
assert_file_contains() {
  local file="$1"
  local pattern="$2"

  grep -q "$pattern" "$file" || {
    echo "File $file does not contain: $pattern"
    return 1
  }
}

# Helper to mock external commands
mock_command() {
  local cmd_name="$1"
  local mock_script="$2"

  # Create mock in temporary bin directory
  mkdir -p "$TEST_DIR/bin"
  cat > "$TEST_DIR/bin/$cmd_name" << EOF
#!/bin/sh
$mock_script
EOF
  chmod +x "$TEST_DIR/bin/$cmd_name"
  export PATH="$TEST_DIR/bin:$PATH"
}
```

### Testing Script Functions

```bash
## Example: Testing individual functions
## tests/functions.bats
#!/usr/bin/env bats

load test_helper

setup() {
  # Source the script to test individual functions
  source "$BATS_TEST_DIRNAME/../scripts/backup.sh"
}

@test "check_prerequisites detects missing commands" {
  # Mock command to return failure
  mock_command "pg_dump" "exit 1"

  run check_prerequisites
  [ "$status" -eq 1 ]
  [[ "$output" =~ "Missing dependencies" ]]
}

@test "create_backup generates valid filename" {
  export BACKUP_DIR="$TEST_DIR/backups"

  run create_backup "testdb"
  [ "$status" -eq 0 ]

  # Check filename format: database_YYYYMMDD_HHMMSS.sql.gz
  [[ "$output" =~ testdb_[0-9]{8}_[0-9]{6}.sql.gz ]]
}

@test "rotate_backups removes old files" {
  export BACKUP_DIR="$TEST_DIR/backups"
  mkdir -p "$BACKUP_DIR"

  # Create old backup file (8 days old)
  old_backup="$BACKUP_DIR/old_backup.sql.gz"
  touch "$old_backup"
  touch -t "$(date -d '8 days ago' +%Y%m%d%H%M)" "$old_backup"

  # Create recent backup
  recent_backup="$BACKUP_DIR/recent_backup.sql.gz"
  touch "$recent_backup"

  run rotate_backups
  [ "$status" -eq 0 ]

  # Old backup should be deleted
  [ ! -f "$old_backup" ]
  # Recent backup should remain
  [ -f "$recent_backup" ]
}
```

### Integration Testing

```bash
## tests/integration.bats
#!/usr/bin/env bats

load test_helper

setup() {
  export TEST_DIR="$(mktemp -d)"
  export PATH="$BATS_TEST_DIRNAME/../scripts:$PATH"

  # Setup test environment
  export DB_HOST="localhost"
  export DB_PORT="5432"
  export ENVIRONMENT="test"
}

teardown() {
  rm -rf "$TEST_DIR"
}

@test "full deployment workflow" {
  # Mock external dependencies
  mock_command "docker" "echo 'Image pulled successfully'"
  mock_command "kubectl" "echo 'Deployment updated'"

  run deploy.sh test
  [ "$status" -eq 0 ]

  # Verify deployment steps occurred
  [[ "$output" =~ "Checking prerequisites" ]]
  [[ "$output" =~ "Pulling Docker image" ]]
  [[ "$output" =~ "Updating Kubernetes deployment" ]]
  [[ "$output" =~ "Deployment successful" ]]
}
```

### Running Tests

```bash
## Run all tests
bats tests/

## Run specific test file
bats tests/deploy.bats

## Run tests with verbose output
bats --verbose tests/

## Run tests with tap output (for CI/CD)
bats --tap tests/

## Run tests recursively
bats --recursive tests/

## Run tests with timing
bats --timing tests/
```

### ShellCheck Integration

Combine BATS with ShellCheck for comprehensive testing:

```bash
## tests/shellcheck.bats
#!/usr/bin/env bats

@test "all scripts pass shellcheck" {
  for script in scripts/*.sh; do
    run shellcheck "$script"
    [ "$status" -eq 0 ]
  done
}

@test "scripts follow POSIX standards" {
  for script in scripts/*.sh; do
    run shellcheck --shell=sh "$script"
    [ "$status" -eq 0 ]
  done
}
```

### CI/CD Integration

```yaml
## .github/workflows/test.yml
name: Test Scripts

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install BATS
        run: |
          sudo apt-get update
          sudo apt-get install -y bats

      - name: Install ShellCheck
        run: sudo apt-get install -y shellcheck

      - name: Run BATS tests
        run: bats --recursive --tap tests/

      - name: Run ShellCheck
        run: |
          find scripts -name "*.sh" -exec shellcheck {} +

      - name: Check script formatting
        run: |
          shfmt -d -i 2 -s scripts/
```

### Coverage and Quality Metrics

While Bash doesn't have native coverage tools, you can track test quality:

```bash
## tests/coverage.sh
#!/bin/sh

# Count functions in scripts
total_functions=$(grep -r "^[a-z_]*() {" scripts/ | wc -l)

# Count tested functions
tested_functions=$(grep -r "@test.*function" tests/ | wc -l)

# Calculate coverage percentage
coverage=$((tested_functions * 100 / total_functions))

echo "Function Test Coverage: ${coverage}%"
echo "Total Functions: $total_functions"
echo "Tested Functions: $tested_functions"

if [ "$coverage" -lt 80 ]; then
  echo "ERROR: Coverage below 80% threshold"
  exit 1
fi
```

---

## Security Best Practices

### Command Injection Prevention

Always quote variables and validate input to prevent command injection attacks.

```bash
## Bad - Vulnerable to command injection
user_input="$1"
eval "ls $user_input"  # NEVER use eval with user input!
files=$(find . -name $user_input)  # Unquoted variable vulnerable

## Good - Properly quoted and validated
user_input="$1"

# Validate input matches expected pattern
if ! printf '%s\n' "$user_input" | grep -Eq '^[a-zA-Z0-9_-]+$'; then
  echo "Error: Invalid input format" >&2
  exit 1
fi

# Always quote variables
files=$(find . -name "$user_input")

## Better - Use arrays for complex commands
search_paths=("/var/log" "/var/tmp")
find "${search_paths[@]}" -name "*.log"
```

### Input Validation and Sanitization

```bash
## Validate file paths
validate_path() {
  local path="$1"

  # Check for path traversal attempts
  case "$path" in
    *..*)
      echo "Error: Path traversal detected" >&2
      return 1
      ;;
    /*)
      echo "Error: Absolute paths not allowed" >&2
      return 1
      ;;
  esac

  # Check path exists and is within allowed directory
  if [ ! -e "$path" ]; then
    echo "Error: Path does not exist" >&2
    return 1
  fi

  return 0
}

## Validate numeric input
validate_number() {
  local input="$1"

  case "$input" in
    ''|*[!0-9]*)
      echo "Error: Not a valid number" >&2
      return 1
      ;;
  esac

  return 0
}

## Example usage
user_file="$1"
if validate_path "$user_file"; then
  cat "$user_file"
fi
```

### Secure Credential Management

```bash
## Bad - Hardcoded credentials (NEVER DO THIS)
DB_PASSWORD="supersecret123"
API_KEY="sk_live_abc123"
aws_access_key="AKIAIOSFODNN7EXAMPLE"

## Good - Use environment variables
DB_PASSWORD="${DB_PASSWORD:?Database password not set}"
API_KEY="${API_KEY:?API key not set}"

## Good - Read from secure file with restricted permissions
read_secret() {
  local secret_file="$1"

  # Verify file permissions (should be 600 or 400)
  if [ -f "$secret_file" ]; then
    perms=$(stat -c '%a' "$secret_file" 2>/dev/null || stat -f '%A' "$secret_file" 2>/dev/null)
    if [ "$perms" != "600" ] && [ "$perms" != "400" ]; then
      echo "Error: Secret file has insecure permissions: $perms" >&2
      return 1
    fi
    cat "$secret_file"
  else
    echo "Error: Secret file not found" >&2
    return 1
  fi
}

## Use secrets
db_password=$(read_secret "/run/secrets/db_password")
```

### Secure Temporary File Handling

```bash
## Bad - Predictable temp file names (race condition vulnerability)
tmp_file="/tmp/myapp.txt"
echo "data" > "$tmp_file"  # Attacker can predict this!

## Good - Use mktemp for secure temporary files
tmp_file=$(mktemp) || exit 1
trap 'rm -f "$tmp_file"' EXIT INT TERM

echo "sensitive data" > "$tmp_file"
chmod 600 "$tmp_file"  # Restrict permissions

## Process temp file
# ...

## Cleanup handled by trap

## Good - Temporary directory
tmp_dir=$(mktemp -d) || exit 1
trap 'rm -rf "$tmp_dir"' EXIT INT TERM

# Work in temporary directory
cd "$tmp_dir" || exit 1
```

### Safe File Operations

```bash
## Prevent symlink attacks
safe_write() {
  local target_file="$1"
  local content="$2"

  # Check if file is a symlink
  if [ -L "$target_file" ]; then
    echo "Error: Will not write to symlink" >&2
    return 1
  fi

  # Create file with restrictive permissions
  (umask 077 && printf '%s\n' "$content" > "$target_file")
}

## Safely delete files
safe_delete() {
  local file="$1"

  # Verify file exists and is a regular file
  if [ ! -f "$file" ]; then
    echo "Error: Not a regular file" >&2
    return 1
  fi

  # Check we're not deleting system files
  case "$file" in
    /bin/*|/sbin/*|/usr/bin/*|/usr/sbin/*|/etc/*)
      echo "Error: Refusing to delete system file" >&2
      return 1
      ;;
  esac

  rm -f "$file"
}
```

### Secure Downloads

```bash
## Download files securely with verification
secure_download() {
  local url="$1"
  local output="$2"
  local expected_checksum="$3"

  # Download with timeout and fail on error
  if ! curl --fail --silent --show-error --max-time 300 \
            --location "$url" --output "$output"; then
    echo "Error: Download failed" >&2
    return 1
  fi

  # Verify checksum if provided
  if [ -n "$expected_checksum" ]; then
    actual_checksum=$(sha256sum "$output" | cut -d' ' -f1)
    if [ "$actual_checksum" != "$expected_checksum" ]; then
      echo "Error: Checksum mismatch" >&2
      echo "Expected: $expected_checksum" >&2
      echo "Got: $actual_checksum" >&2
      rm -f "$output"
      return 1
    fi
  fi

  return 0
}

## Example usage
url="https://example.com/package.tar.gz"
checksum="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
secure_download "$url" "package.tar.gz" "$checksum"
```

### Logging Sensitive Data

```bash
## Bad - Logging passwords and secrets
echo "Connecting to database with password: $DB_PASSWORD"  # NEVER!
curl -v "https://api.example.com?api_key=$API_KEY"  # Logged in curl output!

## Good - Redact sensitive information
log_safe() {
  local message="$1"
  # Redact potential secrets (credit cards, API keys, tokens)
  echo "$message" | sed -E \
    -e 's/password[=:][^ ]*/password=***REDACTED***/gi' \
    -e 's/api[_-]?key[=:][^ ]*/api_key=***REDACTED***/gi' \
    -e 's/token[=:][^ ]*/token=***REDACTED***/gi' \
    -e 's/[0-9]{13,19}/****-****-****-****/g'  # Credit card numbers
}

## Use for logging
message="Connecting to API with api_key=sk_live_abc123"
log_safe "$message"  # Outputs: Connecting to API with api_key=***REDACTED***
```

### Process Isolation

```bash
## Run untrusted commands with limited permissions
run_sandboxed() {
  local command="$1"

  # Create restricted user if needed
  if ! id sandbox-user >/dev/null 2>&1; then
    useradd -r -s /bin/false sandbox-user
  fi

  # Run command as limited user with timeout
  sudo -u sandbox-user timeout 30s sh -c "$command"
}

## Limit resource usage
ulimit -t 30      # CPU time limit (seconds)
ulimit -v 1000000 # Virtual memory limit (KB)
ulimit -f 10000   # File size limit (blocks)
```

---

## When to Use Higher-Level Languages

Replace Bash with Python, Go, or TypeScript when you need:

### Use Python When

- Parsing JSON/YAML configuration files
- Making HTTP API calls
- Complex data transformations
- String manipulation beyond basic patterns
- Scripts requiring unit tests
- Cross-platform compatibility

### Use Go When

- Building compiled binaries for distribution
- Performance is critical
- Strong typing needed
- Concurrent operations required
- Building CLI tools with subcommands

### Use TypeScript/Node.js When

- Integrating with JavaScript ecosystems
- Processing JSON extensively
- Building CLI tools with rich UX
- Async I/O operations

### Example: When NOT to Use Bash

```bash
## Bad - Complex JSON parsing in Bash
## This should be Python/Go/TypeScript
response=$(curl -s https://api.example.com/users)
## Trying to parse JSON with grep/sed is fragile and error-prone
user_id=$(echo "$response" | grep -o '"id":[0-9]*' | cut -d: -f2)
```

```python
## Good - Use Python for JSON APIs
import requests

response = requests.get('https://api.example.com/users')
data = response.json()
user_id = data['id']
```

---

## References

### Official Documentation

- [POSIX Shell Specification](https://pubs.opengroup.org/onlinepubs/9699919799/utilities/V3_chap02.html)
- [Bash Reference Manual](https://www.gnu.org/software/bash/manual/)
- [Google Shell Style Guide](https://google.github.io/styleguide/shellguide.html)

### Tools

- [shellcheck](https://www.shellcheck.net/) - Shell script static analysis tool
- [shfmt](https://github.com/mvdan/sh) - Shell script formatter
- [bats](https://github.com/bats-core/bats-core) - Bash Automated Testing System

### Best Practices

- [Bash Pitfalls](https://mywiki.wooledge.org/BashPitfalls)
- [Safe Ways to do Things in Bash](https://github.com/anordal/shellharden/blob/master/how_to_do_things_safely_in_bash.md)
- [Bash Strict Mode](http://redsymbol.net/articles/unofficial-bash-strict-mode/)

---

**Status**: Active
