# Terragrunt Style Guide

- Use `live/<env>/<region>/<stack>/terragrunt.hcl` pattern.
- Centralize remote state in top-level `terragrunt.hcl`.

## Example

```hcl
# @module: vpc-live
include { path = find_in_parent_folders() }
terraform { source = "git::ssh://...//modules//vpc?ref=v1.2.0" }
inputs = { name = "my-vpc" }
```
