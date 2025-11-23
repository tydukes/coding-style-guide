---
title: "Bash Scripting Style Guide"
description: "POSIX-compliant shell scripting standards for automation and DevOps"
author: "Tyler Dukes"
date: "2025-10-28"
tags: [bash, shell, scripting, posix, automation]
category: "Language Guides"
status: "needs-expansion"
version: "0.1.0"
---


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
