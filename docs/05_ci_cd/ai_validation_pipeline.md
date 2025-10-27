
# CI / AI Validation Pipeline

- Steps:
  1. Checkout
  2. Run pre-commit hooks
  3. Run linters and formatters
  4. Run metadata validation script
  5. Run tests (unit + integration)
  6. Terraform/Terragrunt plan (dry run) and attach plan output

- AI advisory bot runs in PRs commenting style suggestions (advisory only).
