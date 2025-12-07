---
title: "Code Block Language Tag Standards"
description: "Standardized language tags for markdown code blocks across all documentation"
author: "Tyler Dukes"
date: "2025-12-07"
tags: [standards, documentation, code-blocks, markdown, syntax-highlighting]
category: "Standards"
status: "active"
version: "1.0.0"
---

## Purpose

This document defines the standardized language tags for all code blocks in the Dukes Engineering Style Guide
documentation. Consistent language tags enable proper syntax highlighting, improve readability, and ensure a
professional presentation of code examples.

## General Principles

### Language Tag Requirements

1. **All code blocks MUST have a language tag** - No untagged code blocks (```) are allowed
2. **Use the canonical tag name** - Follow the standard names defined in this document
3. **Be specific when possible** - Use `typescript` not `javascript` for TypeScript code
4. **Match the actual content** - Don't tag Python code as `bash` or vice versa

### Syntax

```markdown
\```languagetag
code here
\```
```

**Examples**:

```markdown
\```python
def hello_world():
    print("Hello, World!")
\```

\```bash
echo "Hello, World!"
\```
```

## Canonical Language Tags

### Infrastructure as Code

| Language/Tool | Tag | Alternative Tags (Avoid) | Notes |
|--------------|-----|--------------------------|-------|
| Terraform | `hcl` | `terraform`, `tf` | Use HCL for Terraform code |
| Terragrunt | `hcl` | `terragrunt` | Terragrunt uses HCL syntax |
| AWS CDK (TypeScript) | `typescript` | `ts`, `cdk` | Use TypeScript tag |
| AWS CDK (Python) | `python` | `py`, `cdk` | Use Python tag |
| Kubernetes YAML | `yaml` | `yml`, `k8s`, `kubernetes` | Use YAML tag |
| Helm Templates | `yaml` | `helm`, `gotmpl` | Use YAML for values files |
| Helm Chart.yaml | `yaml` | `helm` | Use YAML tag |

### Configuration Management

| Language/Tool | Tag | Alternative Tags (Avoid) | Notes |
|--------------|-----|--------------------------|-------|
| Ansible Playbooks | `yaml` | `yml`, `ansible` | Use YAML tag |
| Ansible Inventory | `ini` | `ansible` | For INI-format inventory |

### Programming Languages

| Language | Tag | Alternative Tags (Avoid) | Notes |
|----------|-----|--------------------------|-------|
| Python | `python` | `py`, `python3` | Always use `python` |
| TypeScript | `typescript` | `ts` | Always use full name |
| JavaScript | `javascript` | `js` | Always use full name |
| Bash | `bash` | `sh`, `shell`, `zsh` | Use `bash` for shell scripts |
| PowerShell | `powershell` | `ps1`, `posh` | Use `powershell` |
| SQL | `sql` | | Generic SQL tag |
| Go | `go` | `golang` | Use `go` |
| Ruby | `ruby` | `rb` | Use `ruby` |

### CI/CD & Automation

| Tool | Tag | Alternative Tags (Avoid) | Notes |
|------|-----|--------------------------|-------|
| GitHub Actions | `yaml` | `yml`, `github-actions` | Use YAML tag |
| GitLab CI | `yaml` | `yml`, `gitlab-ci` | Use YAML tag |
| Jenkins (Declarative) | `groovy` | `jenkinsfile` | Use Groovy tag |
| Jenkins (Scripted) | `groovy` | `jenkins` | Use Groovy tag |
| Makefile | `makefile` | `make`, `mk` | Use `makefile` |

### Data & Configuration Formats

| Format | Tag | Alternative Tags (Avoid) | Notes |
|--------|-----|--------------------------|-------|
| YAML | `yaml` | `yml` | Always use `yaml` |
| JSON | `json` | | Standard JSON |
| JSON5 | `json5` | | JSON with extensions (comments, trailing commas) |
| JSONC | `jsonc` | | JSON with Comments (VS Code format) |
| TOML | `toml` | | TOML configuration files |
| INI | `ini` | `cfg`, `conf` | INI format files |
| XML | `xml` | | XML documents |
| Properties | `properties` | `props` | Java properties files |

### Containerization

| Tool/File | Tag | Alternative Tags (Avoid) | Notes |
|-----------|-----|--------------------------|-------|
| Dockerfile | `dockerfile` | `docker` | Always use `dockerfile` |
| Docker Compose | `yaml` | `yml`, `docker-compose` | Use YAML tag |
| .dockerignore | `dockerignore` | `gitignore`, `text` | Use `dockerignore` |

### Special Purpose Tags

| Purpose | Tag | When to Use |
|---------|-----|-------------|
| Plain text | `text` | Unformatted text, placeholders, generic output |
| Markdown | `markdown` | When showing markdown syntax examples |
| Git config | `gitignore` | For `.gitignore` file examples |
| Environment | `env` | For `.env` file examples |
| Templates | `jinja2` | For Jinja2 template examples |
| Vim script | `vim` | For `.vimrc` or Vim configuration |
| Emacs Lisp | `elisp` | For Emacs configuration |
| Nginx config | `nginx` | For nginx.conf examples |
| Mermaid diagrams | `mermaid` | For Mermaid diagram code |
| Lua | `lua` | For Lua scripts (e.g., Neovim config) |

## JSON Variants

### When to Use Each JSON Tag

**Use `json` for**:

- Standard JSON configuration files
- API request/response examples
- Package.json, tsconfig.json (strict JSON)
- Any JSON that must be strictly valid

**Use `json5` for**:

- Configuration files that support JSON5 (comments, trailing commas)
- Examples showing JSON5 features explicitly
- Documentation where you want to include inline comments

**Use `jsonc` for**:

- VS Code configuration files (settings.json, etc.)
- Any Microsoft tool configuration that uses JSONC
- When specifically documenting VS Code integration

## Code Block Examples

### Good Examples

#### Python with Proper Tag

````markdown
```python
from typing import List

def process_data(items: List[str]) -> None:
    """Process a list of items."""
    for item in items:
        print(f"Processing: {item}")
```
````

#### Bash Script with Proper Tag

````markdown
```bash
#!/bin/bash
set -euo pipefail

echo "Starting deployment..."
kubectl apply -f deployment.yaml
```
````

#### YAML Configuration with Proper Tag

````markdown
```yaml
version: '3.8'
services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
```
````

### Bad Examples (Don't Do This)

#### Missing Language Tag

````markdown
❌ ```
def hello():
    print("No language tag!")
```
````

**Fix**: Add `python` tag

````markdown
✅ ```python
def hello():
    print("No language tag!")
```
````

#### Wrong Language Tag

````markdown
❌ ```javascript
// This is actually TypeScript
interface User {
    id: number;
    name: string;
}
```
````

**Fix**: Use `typescript` tag

````markdown
✅ ```typescript
// This is actually TypeScript
interface User {
    id: number;
    name: string;
}
```
````

#### Using Abbreviation

````markdown
❌ ```sh
#!/bin/bash
echo "Wrong tag!"
```
````

**Fix**: Use canonical `bash` tag

````markdown
✅ ```bash
#!/bin/bash
echo "Correct tag!"
```
````

## Nested Code Blocks

When showing markdown examples that contain code blocks (like in this document), use 4 backticks for the outer
block and 3 for the inner block:

`````markdown
````markdown
```python
# This is shown as an example
print("Hello")
```
````
`````

## Template Placeholders

For template files that show placeholder code, use the appropriate language tag for the target language, not a
generic `text` tag:

**Template Example**:

```text
[language-extension]
```

**Preferred** - When showing a Python template:

```python
# Replace [function_name] with actual function name
def [function_name]([parameters]):
    """Replace with actual docstring."""
    pass
```

## Verification

### Automated Checking

You can verify all code blocks have language tags using:

```bash
# Find code blocks without language tags
grep -rn '^```$' docs/
```

Expected result: Only closing ``` blocks (which correctly have no tag)

### Language Tag Audit

To see all language tags currently in use:

```bash
grep -rh '^```\w' docs/ | sed 's/```//' | sort | uniq -c | sort -rn
```

## Enforcement

### Pre-commit Hooks

Add markdownlint rules to enforce language tags:

```yaml
# .markdownlint.yaml
MD040:  # Fenced code blocks should have a language specified
  enabled: true
  allowed_languages: []  # Empty = allow any language
```

### CI/CD Validation

Include in GitHub Actions workflow:

```yaml
- name: Check code blocks have language tags
  run: |
    if grep -rn '^```\s*$' docs/ --include="*.md" | grep -v '```$'; then
      echo "Found code blocks without language tags!"
      exit 1
    fi
```

## Migration Guide

### Updating Existing Documentation

If you find code blocks without language tags:

1. **Identify the language** based on content
2. **Choose the canonical tag** from this document
3. **Add the tag** to the opening fence
4. **Verify syntax highlighting** works in preview

### Example Migration

**Before**:

````markdown
```
kubectl get pods
```
````

**After**:

````markdown
```bash
kubectl get pods
```
````

## Current Status

**As of 2025-12-07**:

- ✅ All 1,501 code blocks in documentation have language tags
- ✅ 32 unique language tags in use
- ✅ Consistent usage across most languages
- ⚠️  JSON has 3 variants (json, json5, jsonc) - all valid for different use cases

## See Also

### Related Standards

- [Heading Structure Standards](heading_structure.md) - Documentation heading hierarchy
- [Metadata Schema](../03_metadata_schema/schema_reference.md) - Frontmatter standards

### Language Guides

- [Python Guide](../02_language_guides/python.md) - Python code examples
- [TypeScript Guide](../02_language_guides/typescript.md) - TypeScript examples
- [Bash Guide](../02_language_guides/bash.md) - Shell script examples
- [Terraform Guide](../02_language_guides/terraform.md) - HCL code examples

### CI/CD Documentation

- [Pre-commit Hooks Guide](../05_ci_cd/precommit_hooks_guide.md) - Automated validation
- [GitHub Actions Guide](../05_ci_cd/github_actions_guide.md) - CI/CD integration

## References

### External Resources

- [GitHub Flavored Markdown Spec](https://github.github.com/gfm/#info-string) - Fenced code blocks
- [Linguist Languages](https://github.com/github/linguist/blob/master/lib/linguist/languages.yml) - GitHub language definitions
- [Prism Supported Languages](https://prismjs.com/#supported-languages) - Syntax highlighting support
- [Pygments Lexers](https://pygments.org/docs/lexers/) - Python syntax highlighting lexers

## Version History

- **v1.0.0** (2025-12-07): Initial code block language tag standards
