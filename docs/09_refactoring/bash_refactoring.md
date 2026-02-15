---
title: "Bash Refactoring Examples"
description: "Real-world Bash script refactoring examples with before/after comparisons"
author: "Tyler Dukes"
tags: [bash, refactoring, best-practices, examples, shell-scripting]
category: "Refactoring"
status: "active"
search_keywords: [bash, refactoring, shell scripts, clean code, functions, improvement]
---

Real-world examples of refactoring Bash scripts to improve reliability, maintainability, and adherence to best practices.

## Extract Functions from Scripts

### Problem: Long monolithic script with duplicated code

**Before** (300+ line script):

```bash
#!/bin/bash

## Deploy application script
APP_NAME="myapp"
ENVIRONMENT=$1

if [ -z "$ENVIRONMENT" ]; then
    echo "Error: Environment not specified"
    exit 1
fi

if [ "$ENVIRONMENT" != "dev" ] && [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    echo "Error: Invalid environment"
    exit 1
fi

## Stop application
echo "Stopping $APP_NAME..."
systemctl stop $APP_NAME
if [ $? -ne 0 ]; then
    echo "Error: Failed to stop service"
    exit 1
fi

## Backup current version
BACKUP_DIR="/opt/$APP_NAME/backups"
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
echo "Creating backup..."
tar -czf $BACKUP_DIR/backup_$TIMESTAMP.tar.gz /opt/$APP_NAME/current
if [ $? -ne 0 ]; then
    echo "Error: Backup failed"
    exit 1
fi

## Download new version
echo "Downloading new version..."
curl -o /tmp/$APP_NAME.tar.gz https://releases.example.com/$APP_NAME/latest.tar.gz
if [ $? -ne 0 ]; then
    echo "Error: Download failed"
    exit 1
fi

## Extract new version
echo "Extracting new version..."
rm -rf /opt/$APP_NAME/current
tar -xzf /tmp/$APP_NAME.tar.gz -C /opt/$APP_NAME/
if [ $? -ne 0 ]; then
    echo "Error: Extraction failed"
    # Restore backup
    echo "Restoring backup..."
    tar -xzf $BACKUP_DIR/backup_$TIMESTAMP.tar.gz -C /
    systemctl start $APP_NAME
    exit 1
fi

## Start application
echo "Starting $APP_NAME..."
systemctl start $APP_NAME
if [ $? -ne 0 ]; then
    echo "Error: Failed to start service"
    # Restore backup
    echo "Restoring backup..."
    tar -xzf $BACKUP_DIR/backup_$TIMESTAMP.tar.gz -C /
    systemctl start $APP_NAME
    exit 1
fi

## Check application health
echo "Checking application health..."
sleep 5
curl -f http://localhost:8080/health
if [ $? -ne 0 ]; then
    echo "Error: Health check failed"
    # Restore backup
    echo "Restoring backup..."
    systemctl stop $APP_NAME
    tar -xzf $BACKUP_DIR/backup_$TIMESTAMP.tar.gz -C /
    systemctl start $APP_NAME
    exit 1
fi

echo "Deployment completed successfully"
## ... 200+ more lines with similar patterns
```

**After** (modular with functions):

```bash
#!/bin/bash
#
## Deploy application script
#
## Usage: deploy.sh <environment>
## Example: deploy.sh production

set -euo pipefail
IFS=$'\n\t'

## Constants
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly APP_NAME="myapp"
readonly APP_DIR="/opt/${APP_NAME}"
readonly BACKUP_DIR="${APP_DIR}/backups"
readonly HEALTH_ENDPOINT="http://localhost:8080/health"

## Colors for output
readonly COLOR_RED='\033[0;31m'
readonly COLOR_GREEN='\033[0;32m'
readonly COLOR_YELLOW='\033[1;33m'
readonly COLOR_NC='\033[0m' # No Color

## Global variables
ENVIRONMENT=""
TIMESTAMP=""
BACKUP_FILE=""

#######################################
## Print error message and exit
## Arguments:
##   $1 - Error message
## Returns:
##   None (exits with code 1)
#######################################
error_exit() {
    echo -e "${COLOR_RED}Error: $1${COLOR_NC}" >&2
    exit 1
}

#######################################
## Print info message
## Arguments:
##   $1 - Info message
#######################################
info() {
    echo -e "${COLOR_GREEN}[INFO]${COLOR_NC} $1"
}

#######################################
## Print warning message
## Arguments:
##   $1 - Warning message
#######################################
warn() {
    echo -e "${COLOR_YELLOW}[WARN]${COLOR_NC} $1"
}

#######################################
## Validate environment parameter
## Arguments:
##   $1 - Environment name
## Returns:
##   0 if valid, exits if invalid
#######################################
validate_environment() {
    local env=$1
    local valid_envs=("dev" "staging" "production")

    if [[ -z "${env}" ]]; then
        error_exit "Environment not specified. Usage: $0 <environment>"
    fi

    if [[ ! " ${valid_envs[*]} " =~ ${env} ]]; then
        error_exit "Invalid environment '${env}'. Valid options: ${valid_envs[*]}"
    fi

    ENVIRONMENT="${env}"
    info "Environment validated: ${ENVIRONMENT}"
}

#######################################
## Stop the application service
## Returns:
##   0 on success, exits on failure
#######################################
stop_service() {
    info "Stopping ${APP_NAME} service..."

    if ! systemctl stop "${APP_NAME}"; then
        error_exit "Failed to stop ${APP_NAME} service"
    fi

    info "Service stopped successfully"
}

#######################################
## Start the application service
## Returns:
##   0 on success, exits on failure
#######################################
start_service() {
    info "Starting ${APP_NAME} service..."

    if ! systemctl start "${APP_NAME}"; then
        error_exit "Failed to start ${APP_NAME} service"
    fi

    info "Service started successfully"
}

#######################################
## Create backup of current version
## Sets:
##   BACKUP_FILE - Path to created backup
## Returns:
##   0 on success, exits on failure
#######################################
create_backup() {
    info "Creating backup of current version..."

    mkdir -p "${BACKUP_DIR}"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.tar.gz"

    if ! tar -czf "${BACKUP_FILE}" -C "${APP_DIR}" current; then
        error_exit "Failed to create backup"
    fi

    info "Backup created: ${BACKUP_FILE}"
}

#######################################
## Restore from backup file
## Arguments:
##   $1 - Backup file path
## Returns:
##   0 on success, 1 on failure
#######################################
restore_backup() {
    local backup_file=$1

    warn "Restoring from backup: ${backup_file}"

    if [[ ! -f "${backup_file}" ]]; then
        echo "Backup file not found: ${backup_file}" >&2
        return 1
    fi

    rm -rf "${APP_DIR}/current"

    if ! tar -xzf "${backup_file}" -C "${APP_DIR}"; then
        echo "Failed to restore backup" >&2
        return 1
    fi

    info "Backup restored successfully"
    return 0
}

#######################################
## Download new application version
## Returns:
##   0 on success, exits on failure
#######################################
download_release() {
    local release_url="https://releases.example.com/${APP_NAME}/latest.tar.gz"
    local download_path="/tmp/${APP_NAME}.tar.gz"

    info "Downloading release from ${release_url}..."

    if ! curl -fSL -o "${download_path}" "${release_url}"; then
        error_exit "Failed to download release"
    fi

    info "Download completed"
}

#######################################
## Extract downloaded release
## Returns:
##   0 on success, exits on failure
#######################################
extract_release() {
    local archive_path="/tmp/${APP_NAME}.tar.gz"

    info "Extracting release..."

    rm -rf "${APP_DIR}/current"
    mkdir -p "${APP_DIR}/current"

    if ! tar -xzf "${archive_path}" -C "${APP_DIR}/current"; then
        error_exit "Failed to extract release"
    fi

    rm -f "${archive_path}"
    info "Extraction completed"
}

#######################################
## Check application health
## Arguments:
##   $1 - Max retries (default: 5)
##   $2 - Retry delay in seconds (default: 5)
## Returns:
##   0 if healthy, 1 if unhealthy
#######################################
check_health() {
    local max_retries=${1:-5}
    local retry_delay=${2:-5}
    local attempt=1

    info "Checking application health..."

    while [[ ${attempt} -le ${max_retries} ]]; do
        if curl -fSL "${HEALTH_ENDPOINT}" >/dev/null 2>&1; then
            info "Health check passed"
            return 0
        fi

        warn "Health check failed (attempt ${attempt}/${max_retries})"

        if [[ ${attempt} -lt ${max_retries} ]]; then
            sleep "${retry_delay}"
        fi

        ((attempt++))
    done

    echo "Health check failed after ${max_retries} attempts" >&2
    return 1
}

#######################################
## Rollback deployment
## Returns:
##   None (exits after rollback attempt)
#######################################
rollback_deployment() {
    warn "Rolling back deployment..."

    stop_service || true

    if restore_backup "${BACKUP_FILE}"; then
        start_service

        if check_health 3 5; then
            error_exit "Deployment failed. Successfully rolled back to previous version."
        else
            error_exit "Deployment failed. Rollback completed but health check failed."
        fi
    else
        error_exit "Deployment failed. Rollback also failed. Manual intervention required."
    fi
}

#######################################
## Main deployment workflow
#######################################
main() {
    validate_environment "$1"

    info "Starting deployment to ${ENVIRONMENT}"

    # Stop service
    stop_service

    # Create backup
    create_backup

    # Download and extract
    if ! download_release; then
        rollback_deployment
    fi

    if ! extract_release; then
        rollback_deployment
    fi

    # Start service
    start_service

    # Health check
    if ! check_health; then
        rollback_deployment
    fi

    info "Deployment completed successfully!"
}

## Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
```

**Improvements**:

- ✅ Functions with single responsibilities
- ✅ Comprehensive error handling
- ✅ Automatic rollback on failure
- ✅ Documented functions (following Google style)
- ✅ Consistent naming conventions
- ✅ Proper exit codes
- ✅ Retry logic for health checks
- ✅ Color-coded output

---

## Add Error Handling

### Problem: No error handling, script continues after failures

**Before**:

```bash
#!/bin/bash

## Process log files
LOG_DIR="/var/log/myapp"
ARCHIVE_DIR="/var/log/myapp/archive"

## Create archive directory
mkdir $ARCHIVE_DIR

## Find old logs
OLD_LOGS=$(find $LOG_DIR -name "*.log" -mtime +7)

## Compress old logs
for log in $OLD_LOGS; do
    gzip $log
    mv $log.gz $ARCHIVE_DIR/
done

## Delete very old archives
find $ARCHIVE_DIR -name "*.gz" -mtime +30 -delete

## Upload to S3
aws s3 sync $ARCHIVE_DIR s3://my-bucket/logs/

echo "Log processing complete"
## If any command fails, we might delete logs before uploading!
```

**After**:

```bash
#!/bin/bash
#
## Process and archive application logs
#
## This script:
##   1. Compresses logs older than 7 days
##   2. Moves compressed logs to archive directory
##   3. Uploads archives to S3
##   4. Deletes archives older than 30 days

## Exit on error, undefined variables, and pipe failures
set -euo pipefail

## Set IFS to prevent word splitting issues
IFS=$'\n\t'

## Constants
readonly SCRIPT_NAME=$(basename "$0")
readonly LOG_DIR="/var/log/myapp"
readonly ARCHIVE_DIR="${LOG_DIR}/archive"
readonly S3_BUCKET="s3://my-bucket/logs"
readonly RETENTION_DAYS=7
readonly ARCHIVE_RETENTION_DAYS=30

## Logging functions
log_info() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [INFO] $*" >&2
}

log_error() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [ERROR] $*" >&2
}

log_fatal() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [FATAL] $*" >&2
    exit 1
}

#######################################
## Validate prerequisites
## Checks that required commands and directories exist
#######################################
validate_prerequisites() {
    log_info "Validating prerequisites..."

    # Check required commands
    local required_commands=("find" "gzip" "aws")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "${cmd}" &> /dev/null; then
            log_fatal "Required command not found: ${cmd}"
        fi
    done

    # Validate log directory exists
    if [[ ! -d "${LOG_DIR}" ]]; then
        log_fatal "Log directory does not exist: ${LOG_DIR}"
    fi

    # Validate AWS credentials
    if ! aws sts get-caller-identity &>/dev/null; then
        log_fatal "AWS credentials not configured or invalid"
    fi

    log_info "Prerequisites validated"
}

#######################################
## Create archive directory if it doesn't exist
#######################################
create_archive_dir() {
    log_info "Creating archive directory..."

    if [[ ! -d "${ARCHIVE_DIR}" ]]; then
        if ! mkdir -p "${ARCHIVE_DIR}"; then
            log_fatal "Failed to create archive directory: ${ARCHIVE_DIR}"
        fi
        log_info "Archive directory created: ${ARCHIVE_DIR}"
    else
        log_info "Archive directory already exists"
    fi
}

#######################################
## Compress old log files
## Returns:
##   Number of files compressed
#######################################
compress_old_logs() {
    log_info "Searching for logs older than ${RETENTION_DAYS} days..."

    local compressed_count=0
    local failed_count=0

    # Find old logs (excluding already compressed files)
    while IFS= read -r -d '' log_file; do
        log_info "Compressing: ${log_file}"

        if gzip -9 "${log_file}"; then
            ((compressed_count++))
        else
            log_error "Failed to compress: ${log_file}"
            ((failed_count++))
        fi
    done < <(find "${LOG_DIR}" -maxdepth 1 -name "*.log" -type f -mtime "+${RETENTION_DAYS}" -print0)

    log_info "Compressed ${compressed_count} files (${failed_count} failures)"

    if [[ ${failed_count} -gt 0 ]]; then
        log_error "Some files failed to compress"
        return 1
    fi

    return 0
}

#######################################
## Move compressed logs to archive
#######################################
move_to_archive() {
    log_info "Moving compressed logs to archive..."

    local moved_count=0
    local failed_count=0

    while IFS= read -r -d '' gz_file; do
        local filename=$(basename "${gz_file}")

        if mv "${gz_file}" "${ARCHIVE_DIR}/${filename}"; then
            log_info "Moved: ${filename}"
            ((moved_count++))
        else
            log_error "Failed to move: ${filename}"
            ((failed_count++))
        fi
    done < <(find "${LOG_DIR}" -maxdepth 1 -name "*.log.gz" -type f -print0)

    log_info "Moved ${moved_count} files (${failed_count} failures)"

    if [[ ${failed_count} -gt 0 ]]; then
        log_error "Some files failed to move"
        return 1
    fi

    return 0
}

#######################################
## Upload archives to S3
#######################################
upload_to_s3() {
    log_info "Uploading archives to S3: ${S3_BUCKET}..."

    # Count files before upload
    local file_count
    file_count=$(find "${ARCHIVE_DIR}" -name "*.gz" -type f | wc -l)

    if [[ ${file_count} -eq 0 ]]; then
        log_info "No files to upload"
        return 0
    fi

    log_info "Uploading ${file_count} archive files..."

    # Sync with S3, keeping a local copy
    if ! aws s3 sync "${ARCHIVE_DIR}" "${S3_BUCKET}" \
            --storage-class STANDARD_IA \
            --no-progress; then
        log_error "S3 upload failed"
        return 1
    fi

    log_info "Upload completed successfully"
    return 0
}

#######################################
## Delete old archives (already uploaded to S3)
#######################################
cleanup_old_archives() {
    log_info "Cleaning up archives older than ${ARCHIVE_RETENTION_DAYS} days..."

    local deleted_count=0

    while IFS= read -r -d '' archive_file; do
        local filename=$(basename "${archive_file}")
        log_info "Deleting old archive: ${filename}"

        if rm "${archive_file}"; then
            ((deleted_count++))
        else
            log_error "Failed to delete: ${filename}"
        fi
    done < <(find "${ARCHIVE_DIR}" -name "*.gz" -type f -mtime "+${ARCHIVE_RETENTION_DAYS}" -print0)

    log_info "Deleted ${deleted_count} old archives"
    return 0
}

#######################################
## Main execution
#######################################
main() {
    log_info "Starting log archival process"

    validate_prerequisites
    create_archive_dir

    # Compress and move (fail if either fails)
    if ! compress_old_logs; then
        log_fatal "Log compression failed"
    fi

    if ! move_to_archive; then
        log_fatal "Moving logs to archive failed"
    fi

    # Upload to S3 (critical - fail if upload fails)
    if ! upload_to_s3; then
        log_fatal "S3 upload failed - archives retained locally"
    fi

    # Cleanup (not critical - warn on failure)
    if ! cleanup_old_archives; then
        log_error "Cleanup failed, but archives are uploaded to S3"
    fi

    log_info "Log archival process completed successfully"
}

## Trap errors for additional logging
trap 'log_error "Script failed on line $LINENO"' ERR

## Run main function
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
```

**Improvements**:

- ✅ `set -euo pipefail` for strict error handling
- ✅ Validation of prerequisites before execution
- ✅ Structured error logging with timestamps
- ✅ Graceful handling of failures
- ✅ Safe file processing with `-print0` and `read -d ''`
- ✅ Count and report successes/failures
- ✅ Critical operations fail fast, non-critical warn only
- ✅ Error trap for debugging

---

## Use Arrays Instead of Strings

### Problem: String manipulation for lists causing word splitting issues

**Before**:

```bash
#!/bin/bash

## Install packages
PACKAGES="nginx mysql-server redis-server git curl wget"

## Install each package
for package in $PACKAGES; do
    apt-get install -y $package
done

## Process files
FILES=$(find /var/log -name "*.log")

for file in $FILES; do
    # This breaks on filenames with spaces!
    gzip $file
done

## Server list
SERVERS="web-01 web-02 db-01 cache-01"

## Check server status
for server in $SERVERS; do
    ssh $server "systemctl status myapp"
done
```

**After**:

```bash
#!/bin/bash

set -euo pipefail

## Use arrays for lists
declare -a PACKAGES=(
    "nginx"
    "mysql-server"
    "redis-server"
    "git"
    "curl"
    "wget"
)

## Install packages
install_packages() {
    local package

    for package in "${PACKAGES[@]}"; do
        echo "Installing ${package}..."
        if ! apt-get install -y "${package}"; then
            echo "Failed to install ${package}" >&2
            return 1
        fi
    done
}

## Process files safely
process_log_files() {
    local -a log_files

    # Read into array safely
    mapfile -t log_files < <(find /var/log -name "*.log" -type f)

    if [[ ${#log_files[@]} -eq 0 ]]; then
        echo "No log files found"
        return 0
    fi

    local file
    for file in "${log_files[@]}"; do
        echo "Processing: ${file}"

        # Handles filenames with spaces correctly
        if [[ -f "${file}" ]]; then
            gzip "${file}"
        fi
    done
}

## Server configuration
declare -A SERVERS=(
    [web-01]="10.0.1.10"
    [web-02]="10.0.1.11"
    [db-01]="10.0.2.10"
    [cache-01]="10.0.3.10"
)

## Check server status
check_servers() {
    local hostname
    local ip_address

    for hostname in "${!SERVERS[@]}"; do
        ip_address="${SERVERS[${hostname}]}"

        echo "Checking ${hostname} (${ip_address})..."

        if ssh -o ConnectTimeout=5 "${ip_address}" "systemctl status myapp"; then
            echo "${hostname}: OK"
        else
            echo "${hostname}: FAILED" >&2
        fi
    done
}

## Example with array of complex objects
declare -a DEPLOYMENTS=(
    "app:myapp version:1.0.0 env:production"
    "app:api version:2.1.0 env:staging"
    "app:frontend version:1.5.2 env:production"
)

## Process deployments
process_deployments() {
    local deployment
    local app version env

    for deployment in "${DEPLOYMENTS[@]}"; do
        # Parse deployment string
        app=$(echo "${deployment}" | grep -oP 'app:\K\S+')
        version=$(echo "${deployment}" | grep -oP 'version:\K\S+')
        env=$(echo "${deployment}" | grep -oP 'env:\K\S+')

        echo "Deploying ${app} v${version} to ${env}"
    done
}

main() {
    install_packages
    process_log_files
    check_servers
    process_deployments
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
```

**Even Better** (using associative arrays for configuration):

```bash
#!/bin/bash

set -euo pipefail

## Server configuration with associative arrays
declare -A WEB01=(
    [hostname]="web-01"
    [ip]="10.0.1.10"
    [role]="webserver"
    [environment]="production"
)

declare -A WEB02=(
    [hostname]="web-02"
    [ip]="10.0.1.11"
    [role]="webserver"
    [environment]="production"
)

declare -A DB01=(
    [hostname]="db-01"
    [ip]="10.0.2.10"
    [role]="database"
    [environment]="production"
)

## Array of server variable names
declare -a ALL_SERVERS=(WEB01 WEB02 DB01)

## Check server with full configuration
check_server() {
    local -n server=$1  # nameref to associative array

    echo "Checking ${server[hostname]} (${server[role]})..."
    echo "  IP: ${server[ip]}"
    echo "  Environment: ${server[environment]}"

    if ssh -o ConnectTimeout=5 "${server[ip]}" "systemctl status myapp"; then
        echo "  Status: OK"
        return 0
    else
        echo "  Status: FAILED" >&2
        return 1
    fi
}

## Main execution
main() {
    local server_name
    local failed_count=0

    for server_name in "${ALL_SERVERS[@]}"; do
        if ! check_server "${server_name}"; then
            ((failed_count++))
        fi
        echo
    done

    if [[ ${failed_count} -gt 0 ]]; then
        echo "${failed_count} server(s) failed health check" >&2
        exit 1
    fi

    echo "All servers healthy"
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
```

**Improvements**:

- ✅ No word splitting issues
- ✅ Handles filenames with spaces
- ✅ Type-safe with `declare`
- ✅ Associative arrays for key-value pairs
- ✅ Named references (nameref) for passing arrays to functions
- ✅ Proper quoting of array elements

---

## Apply POSIX Compliance

### Problem: Bash-specific features prevent portability

**Before** (Bash-specific):

```bash
#!/bin/bash

## Bash-specific features
function deploy_app() {
    local APP_NAME=$1
    local VERSION=$2

    # Bash arrays
    declare -a SERVERS=("web-01" "web-02" "web-03")

    # Bash string manipulation
    VERSION_NUMBER=${VERSION#v}

    # Process substitution
    while read -r server; do
        ssh $server "systemctl stop ${APP_NAME}"
    done < <(printf '%s\n' "${SERVERS[@]}")

    # Bash regex
    if [[ $VERSION =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        echo "Valid version format"
    fi

    # Here-string
    aws s3 cp - s3://bucket/version.txt <<< "$VERSION"
}

deploy_app "myapp" "v1.2.3"
```

**After** (POSIX-compliant):

```bash
#!/bin/sh
#
## POSIX-compliant deployment script
## Compatible with sh, dash, bash, and other POSIX shells

set -eu

## POSIX-compliant functions (no 'function' keyword)
deploy_app() {
    app_name="$1"
    version="$2"

    # Validate arguments
    if [ -z "${app_name}" ] || [ -z "${version}" ]; then
        printf 'Error: Missing required arguments\n' >&2
        return 1
    fi

    # Use space-separated string instead of array
    servers="web-01 web-02 web-03"

    # POSIX parameter expansion
    version_number="${version#v}"

    # POSIX-compliant loop (no process substitution)
    for server in ${servers}; do
        printf 'Stopping %s on %s\n' "${app_name}" "${server}"

        if ssh "${server}" "systemctl stop ${app_name}"; then
            printf '  Stopped successfully\n'
        else
            printf '  Failed to stop\n' >&2
            return 1
        fi
    done

    # POSIX regex with case statement
    case "${version}" in
        v[0-9]*.[0-9]*.[0-9]*)
            printf 'Valid version format: %s\n' "${version}"
            ;;
        *)
            printf 'Invalid version format: %s\n' "${version}" >&2
            return 1
            ;;
    esac

    # POSIX-compliant here-document (no here-string)
    aws s3 cp - "s3://bucket/version.txt" <<EOF
${version}
EOF

    return 0
}

## Main execution
main() {
    if [ $# -ne 2 ]; then
        printf 'Usage: %s <app-name> <version>\n' "$0" >&2
        exit 1
    fi

    deploy_app "$1" "$2"
}

## Script entry point
if [ "${0##*/}" = "$(basename "${0}")" ]; then
    main "$@"
fi
```

**Comparison of Features**:

```bash
## Bash vs POSIX

## Function declaration
function bash_func() { ... }     # Bash
bash_func() { ... }               # POSIX

## Variable declaration
declare -r VAR="value"            # Bash
readonly VAR="value"              # POSIX

## Arrays
declare -a arr=("a" "b")          # Bash (no POSIX equivalent)
list="a b c"                      # POSIX (space-separated)

## String comparison
[[ "$a" == "$b" ]]                # Bash
[ "$a" = "$b" ]                   # POSIX

## Pattern matching
[[ "$str" =~ ^[0-9]+$ ]]          # Bash
case "$str" in [0-9]*) ;; esac    # POSIX

## Process substitution
diff <(cmd1) <(cmd2)              # Bash
cmd1 > file1; cmd2 > file2; diff file1 file2  # POSIX

## Here-string
cmd <<< "string"                  # Bash
printf '%s\n' "string" | cmd      # POSIX

## Command substitution
output=$(command)                 # Bash/POSIX (preferred)
output=`command`                  # POSIX (old style)
```

**Improvements**:

- ✅ Compatible with any POSIX shell
- ✅ Works on systems without bash
- ✅ More portable across Unix systems
- ✅ Clearer intent with explicit POSIX features
- ✅ Better for embedded systems and minimal environments

---

## Improve Variable Quoting

### Problem: Unquoted variables cause word splitting and glob expansion

**Before** (unsafe quoting):

```bash
#!/bin/bash

FILE_NAME="my document.txt"
DIR_PATH="/tmp/my files"
USER_INPUT=$1

## Unsafe operations
cd $DIR_PATH
cat $FILE_NAME
rm $USER_INPUT

## Unsafe command substitution
FILES=$(ls *.txt)
for f in $FILES; do
    echo $f
done

## Unsafe in conditionals
if [ $USER_INPUT = "admin" ]; then
    echo "Admin user"
fi

## Unsafe array expansion
SERVERS=(web-01 web-02)
ssh ${SERVERS[0]} "echo $HOME"
```

**After** (proper quoting):

```bash
#!/bin/bash

set -euo pipefail

readonly FILE_NAME="my document.txt"
readonly DIR_PATH="/tmp/my files"
readonly USER_INPUT="${1:-}"

## Safe operations
cd "${DIR_PATH}"
cat "${FILE_NAME}"
rm "${USER_INPUT}"

## Safe command substitution (use arrays)
mapfile -t files < <(find . -name "*.txt" -type f)
for file in "${files[@]}"; do
    echo "${file}"
done

## Safe conditionals
if [ "${USER_INPUT}" = "admin" ]; then
    echo "Admin user"
fi

## Safe array expansion
declare -a SERVERS=(web-01 web-02)
ssh "${SERVERS[0]}" "echo \${HOME}"  # Escape $ to run on remote

## Safe variable defaults
USERNAME="${2:-default_user}"
TIMEOUT="${TIMEOUT:-30}"

## Safe concatenation
OUTPUT_FILE="${DIR_PATH}/${FILE_NAME}.processed"

## Safe in arithmetic (quotes not needed but ok)
count=0
((count++))
total=$((count + 5))

## Safe globbing
shopt -s nullglob  # Empty glob returns empty, not literal pattern
for log_file in /var/log/*.log; do
    if [ -f "${log_file}" ]; then
        echo "Processing: ${log_file}"
    fi
done
```

**Quoting Rules Summary**:

```bash
## Always quote:
"${variable}"                 # Variables
"${array[@]}"                 # Array expansion (all elements)
"$(command)"                  # Command substitution
"$*"                          # All positional parameters as single word
"$@"                          # All positional parameters as separate words

## Don't quote:
$((arithmetic))               # Arithmetic expansion
$(( $var + 1 ))              # Variables in arithmetic (but ok to quote)
${#array[@]}                  # Array length
case "$var" in pattern)       # Patterns in case statements

## Quote unless you explicitly want word splitting:
echo "${variable}"            # Correct - preserves spaces
echo ${variable}              # Dangerous - splits on spaces

## Quote in assignments:
var="${value}"                # Correct
var=${value}                  # Usually works, but quote for consistency

## Always quote empty checks:
if [ -z "${var}" ]; then      # Correct
if [ -z $var ]; then          # Fails if var is unset
```

**Improvements**:

- ✅ No word splitting on spaces
- ✅ No unexpected glob expansion
- ✅ Safe handling of empty variables
- ✅ Predictable behavior
- ✅ Prevents injection vulnerabilities
- ✅ Works correctly with special characters

---

## Resources

### Tools

- **shellcheck**: Static analysis for shell scripts
- **shfmt**: Shell script formatter
- **bashate**: Bash script style checker
- **checkbashisms**: Check for bash-specific features

### Running ShellCheck

```bash
## Check a script
shellcheck script.sh

## Check with specific shell
shellcheck --shell=bash script.sh
shellcheck --shell=sh script.sh  # POSIX

## Exclude specific warnings
shellcheck --exclude=SC2086 script.sh

## Format as JSON
shellcheck --format=json script.sh
```

### Related Documentation

- [Bash Style Guide](../02_language_guides/bash.md)
- [Testing Strategies](../05_ci_cd/testing_strategies.md)

---
