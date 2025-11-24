#!/bin/bash
# Script to create all GitHub issues for IMPROVEMENT_PLAN.md
# Generated: 2025-10-28

set -e

echo "Creating Phase 2 GitHub issues..."

# Issue #20: Expand Python Guide
gh issue create --title "[Python] Expand language guide (13 → 400-500 lines)" \
--milestone "Phase 2: Core Language Guides" \
--label "phase-2,language-guide,python,enhancement" \
--body "$(cat <<'EOF'
## Description
Expand Python guide from 13 lines to comprehensive 400-500 line guide.

## Sections to Add
- Module structure and organization
- Class design patterns
- **Google-style docstrings** (per Q16)
- Error handling and exceptions
- Logging standards
- **Type hints REQUIRED for all functions/classes** (per Q17)
- **Basic async/await patterns** (per Q18)
- Testing with pytest
- Packaging (pyproject.toml)
- Context managers and decorators
- Anti-patterns (5-10 examples)
- Security best practices
- Black, Flake8, mypy configuration

## Acceptance Criteria
- [ ] 400-500 lines
- [ ] All 13 template sections included
- [ ] Google-style docstrings documented
- [ ] Type hints required and documented
- [ ] 10+ code examples
- [ ] 5-10 anti-patterns
- [ ] Security section
- [ ] Testing section
- [ ] Tool configs included
- [ ] Quick reference table

**IMPROVEMENT_PLAN.md Suggestions #1, #41-45** | **Effort**: 6-8 hours
EOF
)"

# Issue #21: Expand Terraform Guide
gh issue create --title "[Terraform] Expand language guide (14 → 400-500 lines)" \
--milestone "Phase 2: Core Language Guides" \
--label "phase-2,language-guide,terraform,enhancement" \
--body "$(cat <<'EOF'
## Description
Expand Terraform guide from 14 lines to comprehensive 400-500 line guide.

## Sections to Add
- Module structure and organization
- Variable validation and descriptions
- Output definitions
- Data source conventions
- Provider configuration
- State management
- Resource naming patterns
- Tagging conventions
- Security practices (secrets management)
- **Both Terratest AND native testing** (per Q20)
- Workspaces usage
- Backend configuration
- **Target versions: 1.5.x - 1.9.x** (per Q19)
- Anti-patterns

## Acceptance Criteria
- [ ] 400-500 lines
- [ ] All 13 template sections
- [ ] 10+ code examples
- [ ] Both testing approaches documented
- [ ] Version range specified
- [ ] Security best practices
- [ ] Anti-patterns section
- [ ] tflint, terraform-docs configs

**IMPROVEMENT_PLAN.md Suggestions #2, #46-50** | **Effort**: 6-8 hours
EOF
)"

# Issue #22: Expand Bash Guide
gh issue create --title "[Bash] Expand language guide (14 → 300-400 lines)" \
--milestone "Phase 2: Core Language Guides" \
--label "phase-2,language-guide,bash,enhancement" \
--body "$(cat <<'EOF'
## Description
Expand Bash guide from 14 lines to comprehensive 300-400 line guide.

## Key Requirements (from Q24, Q25)
- **POSIX compliance required** (sh, not bash)
- **Complex scripts → use Python/Go instead**

## Sections to Add
- Function definitions
- Argument parsing patterns
- Error handling and set options
- Logging practices
- Temporary file handling
- Signal trapping
- Array usage
- String manipulation
- Conditional statements
- Loops
- HERE documents
- Command substitution
- Anti-patterns (common mistakes)
- shellcheck, shfmt configuration

## Acceptance Criteria
- [ ] 300-400 lines
- [ ] POSIX compliance emphasized
- [ ] Guidance on when to use Python/Go
- [ ] 10+ code examples
- [ ] 5-10 anti-patterns
- [ ] Tool configs

**IMPROVEMENT_PLAN.md Suggestions #3, #55-58** | **Effort**: 4-6 hours
EOF
)"

# Issue #23: Expand TypeScript Guide
gh issue create --title "[TypeScript] Expand language guide (11 → 400-500 lines)" \
--milestone "Phase 2: Core Language Guides" \
--label "phase-2,language-guide,typescript,enhancement" \
--body "$(cat <<'EOF'
## Description
Expand TypeScript guide from 11 lines to comprehensive 400-500 line guide.

## Key Requirements (from Q22, Q23)
- **Cover React, Next.js, AND Node.js** (per Q22)
- **strict: true for new code, relaxed for legacy** (per Q23)

## Sections to Add
- Interface and type definitions
- Class patterns and inheritance
- Generics
- Enums and const assertions
- Module organization
- React/Next.js/Node.js patterns
- Testing with Jest/Vitest
- Async patterns
- Error handling
- package.json configuration
- tsconfig.json best practices
- Import/export conventions
- Utility types
- Anti-patterns

## Acceptance Criteria
- [ ] 400-500 lines
- [ ] All frameworks covered
- [ ] Strict mode policy documented
- [ ] 10+ code examples
- [ ] ESLint, Prettier configs
- [ ] Anti-patterns section

**IMPROVEMENT_PLAN.md Suggestions #8, #51-54** | **Effort**: 6-8 hours
EOF
)"

# Issue #24: Expand Ansible Guide
gh issue create --title "[Ansible] Expand language guide (13 → 350-400 lines)" \
--milestone "Phase 2: Core Language Guides" \
--label "phase-2,language-guide,ansible,enhancement" \
--body "$(cat <<'EOF'
## Description
Expand Ansible guide from 13 lines to comprehensive 350-400 line guide.

## Key Requirements (from Q28, Q29)
- **Ansible 2.15.x - 2.17.x** (per Q28)
- **Collections only** (new approach, per Q29)

## Sections to Add
- Playbook structure
- Inventory organization
- Variable precedence
- Role dependencies
- Handlers
- Jinja2 templates
- Ansible Vault
- Tags strategy
- Error handling
- Testing with molecule
- Collections usage
- Anti-patterns

## Acceptance Criteria
- [ ] 350-400 lines
- [ ] Version range specified
- [ ] Collections-focused
- [ ] 10+ code examples
- [ ] ansible-lint config
- [ ] Anti-patterns section

**IMPROVEMENT_PLAN.md Suggestions #24, #59-62** | **Effort**: 5-6 hours
EOF
)"

# Issue #25: Create Kubernetes & Helm Guide
gh issue create --title "[Kubernetes] Create comprehensive guide (4 → 400-500 lines)" \
--milestone "Phase 2: Core Language Guides" \
--label "phase-2,language-guide,kubernetes,enhancement" \
--body "$(cat <<'EOF'
## Description
Create Kubernetes & Helm guide from scratch (currently only 4 lines).

## Key Requirements (from Q30, Q31)
- **Kubernetes 1.28.x - 1.31.x** (per Q30)
- **Helm charts focus** (per Q31)

## Sections to Add
- Deployment manifests
- Service definitions
- ConfigMap and Secret patterns
- Namespace conventions
- Label standards
- Annotation patterns
- Resource limits/requests
- Liveness/readiness/startup probes
- Helm chart structure
- values.yaml patterns
- Helper templates (_helpers.tpl)
- Chart dependencies
- Anti-patterns

## Acceptance Criteria
- [ ] 400-500 lines
- [ ] Version range specified
- [ ] Helm-focused
- [ ] 10+ code examples
- [ ] kubelinter config
- [ ] Anti-patterns section

**IMPROVEMENT_PLAN.md Suggestion #6** | **Effort**: 6-8 hours
EOF
)"

# Issue #26: Expand SQL Guide
gh issue create --title "[SQL] Expand language guide (11 → 300-350 lines)" \
--milestone "Phase 2: Core Language Guides" \
--label "phase-2,language-guide,sql,enhancement" \
--body "$(cat <<'EOF'
## Description
Expand SQL guide from 11 lines to comprehensive 300-350 line guide.

## Key Requirements (from Q26, Q27, Q63)
- **Database-agnostic SQL** (per Q26)
- **UPPERCASE keywords** (SELECT, FROM, WHERE - per Q27 & Q63)
- **lowercase identifiers** (current guide says "your preference" - make opinionated)

## Sections to Add
- Keyword case (UPPERCASE)
- Identifier case (lowercase/snake_case)
- JOIN conventions
- CTEs (Common Table Expressions)
- Stored procedures
- Functions
- Index naming
- Table design patterns
- Transaction handling
- Migration scripts
- Query optimization
- Anti-patterns

## Acceptance Criteria
- [ ] 300-350 lines
- [ ] UPPERCASE keyword standard
- [ ] Database-agnostic examples
- [ ] 10+ code examples
- [ ] Anti-patterns section

**IMPROVEMENT_PLAN.md Suggestions #25, #63-65** | **Effort**: 4-5 hours
EOF
)"

# Issue #27: Create PowerShell Guide
gh issue create --title "[PowerShell] Create comprehensive guide (4 → 350-400 lines)" \
--milestone "Phase 2: Core Language Guides" \
--label "phase-2,language-guide,powershell,enhancement" \
--body "$(cat <<'EOF'
## Description
Create PowerShell guide from scratch (currently only 4 lines, ZERO examples).

## Key Requirements (from Q32)
- **PowerShell 7+ cross-platform** (per Q32)

## Sections to Add
- Function definitions (approved verbs)
- Cmdlet naming conventions (Verb-Noun)
- Parameter definitions and validation
- Pipeline usage
- Error handling (try/catch/finally)
- Comment-based help
- Module structure
- Script vs. module guidance
- Testing with Pester
- Security (execution policy, constrained language)
- Anti-patterns

## Acceptance Criteria
- [ ] 350-400 lines
- [ ] PowerShell 7+ focus
- [ ] 10+ code examples
- [ ] All template sections
- [ ] PSScriptAnalyzer config
- [ ] Anti-patterns section

**IMPROVEMENT_PLAN.md Suggestion #4** | **Effort**: 5-6 hours
EOF
)"

# Issue #28: Create Jenkins/Groovy Guide
gh issue create --title "[Jenkins] Create comprehensive guide (4 → 300-400 lines)" \
--milestone "Phase 2: Core Language Guides" \
--label "phase-2,language-guide,jenkins,ci-cd,enhancement" \
--body "$(cat <<'EOF'
## Description
Create Jenkins/Groovy guide from scratch (currently only 4 lines, ZERO examples).

## Key Requirements (from Q33, Q34)
- **Range of Jenkins versions** (per Q33)
- **Both Declarative and Scripted, prefer Declarative** (per Q34)

## Sections to Add
- Declarative pipeline structure (preferred)
- Scripted pipeline (when to use)
- Shared libraries organization
- Parameters definition
- Environment variables
- Credentials handling
- Parallel stages
- Post actions
- When conditions
- Agent configuration
- Docker integration
- Testing pipelines
- Anti-patterns

## Acceptance Criteria
- [ ] 300-400 lines
- [ ] Both pipeline types, Declarative preferred
- [ ] 10+ code examples
- [ ] All template sections
- [ ] Anti-patterns section

**IMPROVEMENT_PLAN.md Suggestion #5** | **Effort**: 5-6 hours
EOF
)"

# Issue #29: Expand Terragrunt Guide
gh issue create --title "[Terragrunt] Expand language guide (13 → 300-350 lines)" \
--milestone "Phase 2: Core Language Guides" \
--label "phase-2,language-guide,terraform,terragrunt,enhancement" \
--body "$(cat <<'EOF'
## Description
Expand Terragrunt guide from 13 lines to comprehensive 300-350 line guide.

## Sections to Add
- Dependency management
- Include patterns
- Locals usage
- Generate blocks
- Hooks (before/after)
- Error handling
- Environment-specific configuration
- Remote state backends
- Inheritance patterns (terragrunt.hcl)
- Anti-patterns

## Acceptance Criteria
- [ ] 300-350 lines
- [ ] All template sections
- [ ] 10+ code examples
- [ ] Anti-patterns section
- [ ] Integration with Terraform guide

**IMPROVEMENT_PLAN.md Suggestion #26** | **Effort**: 4-5 hours
EOF
)"

echo "Phase 2 issues created successfully!"
echo ""
echo "Creating Phase 3 GitHub issues..."

# Issue #30: Split yaml_json_docker.md
gh issue create --title "Split yaml_json_docker.md into 3 separate files" \
--milestone "Phase 3: Split Files & New Guides" \
--label "phase-3,language-guide,refactoring" \
--body "$(cat <<'EOF'
## Description
Split yaml_json_docker.md (currently 5 lines, 3 languages) into 3 dedicated files.

## Files to Create
1. **yaml.md** (250-300 lines)
   - Anchors/aliases examples
   - Multi-document files
   - yamllint configuration

2. **json.md** (200-250 lines)
   - Schema validation
   - JSON5 considerations
   - Formatting standards

3. **dockerfile.md** (300-350 lines)
   - Multi-stage builds
   - **Alpine base images** (per Q35)
   - Security best practices
   - Optimization techniques
   - .dockerignore patterns
   - Anti-patterns

## Acceptance Criteria
- [ ] yaml.md created (250-300 lines)
- [ ] json.md created (200-250 lines)
- [ ] dockerfile.md created (300-350 lines)
- [ ] Original file removed
- [ ] mkdocs.yml navigation updated
- [ ] All template sections in each file
- [ ] Cross-references between files

**IMPROVEMENT_PLAN.md Suggestion #7** | **Effort**: 6-8 hours total
EOF
)"

# Issue #31: Create GitHub Actions Guide
gh issue create --title "[GitHub Actions] Create comprehensive guide (300-400 lines)" \
--milestone "Phase 3: Split Files & New Guides" \
--label "phase-3,language-guide,ci-cd,github-actions" \
--body "$(cat <<'EOF'
## Description
Create GitHub Actions YAML guide (new language guide).

## Sections to Add
- Workflow structure
- Job definitions
- Step patterns
- Matrix builds
- Secrets and environment variables
- Reusable workflows
- Custom actions
- Security best practices
- Caching strategies
- Anti-patterns

## Acceptance Criteria
- [ ] 300-400 lines
- [ ] All 13 template sections
- [ ] 10+ code examples
- [ ] Reusable workflow examples
- [ ] Security section
- [ ] Anti-patterns

**IMPROVEMENT_PLAN.md Suggestion #68** | **Effort**: 5-6 hours
EOF
)"

# Issue #32: Create Makefile Guide
gh issue create --title "[Makefile] Create comprehensive guide (250-300 lines)" \
--milestone "Phase 3: Split Files & New Guides" \
--label "phase-3,language-guide,tooling" \
--body "$(cat <<'EOF'
## Description
Create Makefile guide (new language guide).

## Sections to Add
- Target organization
- Variables and functions
- Phony targets
- Pattern rules
- Dependency management
- Help target
- Common tasks (build, test, deploy)
- Anti-patterns

## Acceptance Criteria
- [ ] 250-300 lines
- [ ] All 13 template sections
- [ ] 8+ code examples
- [ ] Help target example
- [ ] Anti-patterns

**IMPROVEMENT_PLAN.md Suggestion #69** | **Effort**: 4-5 hours
EOF
)"

# Issue #33: Create Docker Compose Guide
gh issue create --title "[Docker Compose] Create comprehensive guide (300-350 lines)" \
--milestone "Phase 3: Split Files & New Guides" \
--label "phase-3,language-guide,docker" \
--body "$(cat <<'EOF'
## Description
Create Docker Compose guide (new language guide).

## Sections to Add
- Service definitions
- Network configuration
- Volume management
- Environment variables
- Multi-stage setups
- Development vs. production configs
- Health checks
- Dependency ordering
- Anti-patterns

## Acceptance Criteria
- [ ] 300-350 lines
- [ ] All 13 template sections
- [ ] 8+ code examples
- [ ] Dev vs prod examples
- [ ] Anti-patterns

**IMPROVEMENT_PLAN.md Suggestion #70** | **Effort**: 5-6 hours
EOF
)"

# Issue #34: Create GitLab CI Guide
gh issue create --title "[GitLab CI] Create comprehensive guide (300-350 lines)" \
--milestone "Phase 3: Split Files & New Guides" \
--label "phase-3,language-guide,ci-cd,gitlab" \
--body "$(cat <<'EOF'
## Description
Create GitLab CI YAML guide (new language guide).

## Sections to Add
- Pipeline structure
- Job definitions
- Stage organization
- Variables and secrets
- Artifacts and caching
- Includes and templates
- Rules and conditions
- Docker integration
- Anti-patterns

## Acceptance Criteria
- [ ] 300-350 lines
- [ ] All 13 template sections
- [ ] 10+ code examples
- [ ] Template examples
- [ ] Anti-patterns

**IMPROVEMENT_PLAN.md Suggestion #73** | **Effort**: 5-6 hours
EOF
)"

# Issue #35: Create CDK Guide
gh issue create --title "[CDK] Create comprehensive guide (350-400 lines)" \
--milestone "Phase 3: Split Files & New Guides" \
--label "phase-3,language-guide,iac,cdk" \
--body "$(cat <<'EOF'
## Description
Create AWS CDK guide (new language guide - TypeScript/Python).

## Sections to Add
- Stack organization
- Construct patterns
- Language choice (TypeScript vs. Python)
- Testing with CDK assertions
- Environment handling
- Cross-stack references
- Anti-patterns

## Acceptance Criteria
- [ ] 350-400 lines
- [ ] Both TypeScript and Python examples
- [ ] All 13 template sections
- [ ] 10+ code examples
- [ ] Anti-patterns

**IMPROVEMENT_PLAN.md Suggestion #74** | **Effort**: 6-7 hours
EOF
)"

# Issue #36: Create HCL Guide
gh issue create --title "[HCL] Create comprehensive guide (250-300 lines)" \
--milestone "Phase 3: Split Files & New Guides" \
--label "phase-3,language-guide,iac,hcl" \
--body "$(cat <<'EOF'
## Description
Create HCL guide for Packer and Vault configurations (new language guide).

## Sections to Add
- HCL syntax fundamentals
- Packer configurations
- Vault configurations
- Variables and locals
- Functions
- Differences from Terraform HCL
- Anti-patterns

## Acceptance Criteria
- [ ] 250-300 lines
- [ ] Packer examples
- [ ] Vault examples
- [ ] Terraform HCL differences noted
- [ ] Anti-patterns

**IMPROVEMENT_PLAN.md Suggestion #75** | **Effort**: 4-5 hours
EOF
)"

echo "Phase 3 issues created successfully!"
echo ""
echo "Total issues created: Phase 2 (10 issues), Phase 3 (7 issues)"
echo "Continuing with Phase 4, 5, and 6..."
