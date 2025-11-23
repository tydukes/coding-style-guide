---
title: "Terraform Style Guide"
description: "Infrastructure as Code standards for Terraform modules and configurations"
author: "Tyler Dukes"
date: "2025-10-28"
tags: [terraform, iac, infrastructure-as-code, hashicorp, devops]
category: "Language Guides"
status: "needs-expansion"
version: "0.1.0"
---


- Use `snake_case` for variables, `kebab-case` for module directories.
- Always run `terraform fmt -recursive`, `tflint`, and `terraform validate` in CI.

## Example variable

```hcl
variable "instance_count" { type = number description = "Count" default = 2 }
```

## Terragrunt

See terragrunt.md for live layout and include patterns.
