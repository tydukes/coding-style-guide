# Bash Style Guide

- Use set -o errexit -o nounset -o pipefail and `shellcheck`.
- Provide metadata header and `--help`.

## Template
```bash
#!/usr/bin/env bash
# @script: deploy-helper
set -o errexit
set -o nounset
set -o pipefail
```