# Terraform Style Guide (with Terragrunt)

- Use `snake_case` for variables, `kebab-case` for module directories.
- Always run `terraform fmt -recursive`, `tflint`, and `terraform validate` in CI.

## Example variable

```hcl
variable "instance_count" { type = number description = "Count" default = 2 }
```

## Terragrunt

See terragrunt.md for live layout and include patterns.
