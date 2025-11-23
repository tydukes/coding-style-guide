---
title: "Terragrunt Style Guide"
description: "Terragrunt wrapper standards for DRY Terraform configurations"
author: "Tyler Dukes"
date: "2025-10-28"
tags: [terragrunt, terraform, iac, dry, devops]
category: "Language Guides"
status: "needs-expansion"
version: "0.1.0"
---


- Use `live/<env>/<region>/<stack>/terragrunt.hcl` pattern.
- Centralize remote state in top-level `terragrunt.hcl`.

## Example

```hcl
# @module: vpc-live
include { path = find_in_parent_folders() }
terraform { source = "git::ssh://...//modules//vpc?ref=v1.2.0" }
inputs = { name = "my-vpc" }
```
