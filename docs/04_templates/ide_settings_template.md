---
title: "IDE Settings Template"
description: "Pre-configured IDE settings for automatic style guide compliance"
author: "Tyler Dukes"
tags: [template, ide, vscode, intellij, editorconfig, tooling]
category: "Templates"
status: "active"
---

This template provides pre-configured IDE settings files that automatically
enforce the Dukes Engineering Style Guide standards across all supported
languages and editors.

## Overview

Copy these configuration files to your project root to enable automatic
formatting, linting, and style enforcement without manual IDE configuration.

**Supported IDEs:**

- Visual Studio Code
- IntelliJ IDEA / PyCharm / WebStorm
- Any editor with EditorConfig support

**Supported Languages:**

- Python, TypeScript, Bash, PowerShell, SQL, Groovy (Jenkins)
- Terraform, Terragrunt, HCL, AWS CDK, Kubernetes/Helm, Ansible
- YAML, JSON, Markdown, Dockerfile, Docker Compose, Makefile
- GitHub Actions, GitLab CI/CD

## Quick Start

### Option 1: Copy from This Repository

```bash
# Clone the style guide repository
git clone https://github.com/tydukes/coding-style-guide.git

# Copy IDE settings to your project
cp -r coding-style-guide/.vscode your-project/
cp -r coding-style-guide/.idea your-project/
cp coding-style-guide/.editorconfig your-project/
```

### Option 2: Use as Git Submodule

```bash
# Add as submodule
cd your-project
git submodule add https://github.com/tydukes/coding-style-guide.git .style-guide

# Symlink IDE settings
ln -s .style-guide/.vscode .vscode
ln -s .style-guide/.idea .idea
ln -s .style-guide/.editorconfig .editorconfig
```

### Option 3: Manual Setup

Create each file as documented below in your project root.

## File Structure

```text
your-project/
├── .vscode/
│   ├── settings.json          # VS Code settings
│   └── extensions.json        # Extension recommendations
├── .idea/
│   ├── codeStyles/
│   │   ├── Project.xml        # IntelliJ code styles
│   │   └── codeStyleConfig.xml
│   └── inspectionProfiles/
│       ├── Project.xml        # IntelliJ inspections
│       └── profiles_settings.xml
└── .editorconfig              # Universal editor configuration
```

## VS Code Setup

### 1. Settings File (`.vscode/settings.json`)

Comprehensive settings for all languages matching pre-commit hook configurations.

**Key features:**

- Black formatter for Python (100 char line)
- Flake8 linting (extends ignore E203, W503)
- yamllint integration (120 char line)
- markdownlint with custom rules
- shellcheck integration
- Terraform language server with auto-format
- TypeScript/JavaScript Prettier integration
- Automatic trailing whitespace removal
- Final newline enforcement

**Python example:**

```json
{
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter",
    "editor.formatOnSave": true,
    "editor.rulers": [100],
    "editor.tabSize": 4
  },
  "python.linting.flake8Enabled": true,
  "python.linting.flake8Args": [
    "--max-line-length=100",
    "--extend-ignore=E203,W503"
  ]
}
```

**YAML example:**

```json
{
  "[yaml]": {
    "editor.defaultFormatter": "redhat.vscode-yaml",
    "editor.formatOnSave": true,
    "editor.rulers": [120],
    "editor.tabSize": 2
  }
}
```

**Terraform example:**

```json
{
  "[terraform]": {
    "editor.defaultFormatter": "hashicorp.terraform",
    "editor.formatOnSave": true,
    "editor.rulers": [120],
    "editor.tabSize": 2
  },
  "terraform.languageServer.enable": true
}
```

### 2. Extension Recommendations (`.vscode/extensions.json`)

Automatically prompts users to install required extensions.

**Required extensions:**

```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.black-formatter",
    "ms-python.flake8",
    "redhat.vscode-yaml",
    "DavidAnson.vscode-markdownlint",
    "timonwong.shellcheck",
    "hashicorp.terraform",
    "hashicorp.hcl",
    "ms-azuretools.vscode-docker",
    "esbenp.prettier-vscode",
    "ms-vscode.powershell",
    "eamodio.gitlens",
    "EditorConfig.EditorConfig",
    "sonarsource.sonarlint-vscode",
    "redhat.ansible",
    "dbaeumer.vscode-eslint",
    "aws-scripting-guy.cdk-snippets",
    "ms-kubernetes-tools.vscode-kubernetes-tools",
    "tim-koehler.helm-intellisense",
    "github.vscode-github-actions",
    "gitlab.gitlab-workflow"
  ]
}
```

**Install all extensions:**

```bash
# Install extensions from command line
cat .vscode/extensions.json | jq -r '.recommendations[]' | xargs -L 1 code --install-extension
```

## IntelliJ/PyCharm Setup

### 1. Code Styles (`.idea/codeStyles/Project.xml`)

Language-specific formatting rules matching the style guide.

**Python configuration:**

```xml
<Python>
  <option name="INDENT_SIZE" value="4" />
  <option name="RIGHT_MARGIN" value="100" />
  <option name="BLACK_FORMATTER" value="true" />
  <option name="OPTIMIZE_IMPORTS_ON_THE_FLY" value="true" />
</Python>
```

**YAML configuration:**

```xml
<YAMLCodeStyleSettings>
  <option name="INDENT_SIZE" value="2" />
  <option name="RIGHT_MARGIN" value="120" />
</YAMLCodeStyleSettings>
```

**Terraform configuration:**

```xml
<TerraformCodeStyleSettings>
  <option name="INDENT_SIZE" value="2" />
  <option name="RIGHT_MARGIN" value="120" />
</TerraformCodeStyleSettings>
```

### 2. Inspections (`.idea/inspectionProfiles/Project.xml`)

Enabled inspections matching linting standards.

**Python inspections:**

```xml
<inspection_tool class="PyPep8Inspection" enabled="true" level="WEAK WARNING">
  <option name="ignoredErrors">
    <list>
      <option value="E203" />
      <option value="W503" />
    </list>
  </option>
</inspection_tool>
```

**Shell inspections:**

```xml
<inspection_tool class="ShellCheck" enabled="true" level="ERROR" />
```

**Terraform inspections:**

```xml
<inspection_tool class="TFIncorrectVariableType" enabled="true" level="ERROR" />
<inspection_tool class="TFMissingModule" enabled="true" level="ERROR" />
```

## EditorConfig Setup

### Universal Settings (`.editorconfig`)

Works with **all editors** (VS Code, IntelliJ, Vim, Emacs, etc.).

**Complete example:**

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

[*.py]
indent_size = 4
max_line_length = 100

[*.{yaml,yml}]
indent_size = 2
max_line_length = 120

[*.{tf,tfvars,hcl}]
indent_size = 2
max_line_length = 120

[*.{sh,bash}]
indent_size = 2
max_line_length = 100

[*.md]
max_line_length = 120
trim_trailing_whitespace = false

[Makefile]
indent_style = tab
```

**EditorConfig precedence:**

1. `.editorconfig` (universal baseline)
2. IDE-specific settings (`.vscode/settings.json`, `.idea/codeStyles/`)
3. User global settings

**Benefits:**

- Works across all team members regardless of IDE choice
- No IDE-specific configuration needed
- Portable across projects
- Language-aware indentation and line endings

## Language-Specific Configuration

### Python

**VS Code:**

```json
{
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter",
    "editor.rulers": [100],
    "editor.tabSize": 4
  },
  "python.linting.flake8Args": ["--max-line-length=100", "--extend-ignore=E203,W503"]
}
```

**EditorConfig:**

```ini
[*.py]
indent_size = 4
max_line_length = 100
```

### Terraform/HCL

**VS Code:**

```json
{
  "[terraform]": {
    "editor.defaultFormatter": "hashicorp.terraform",
    "editor.formatOnSave": true,
    "editor.tabSize": 2
  },
  "terraform.languageServer.enable": true
}
```

**EditorConfig:**

```ini
[*.{tf,tfvars,hcl}]
indent_size = 2
max_line_length = 120
```

### YAML

**VS Code:**

```json
{
  "[yaml]": {
    "editor.defaultFormatter": "redhat.vscode-yaml",
    "editor.rulers": [120],
    "editor.tabSize": 2
  }
}
```

**EditorConfig:**

```ini
[*.{yaml,yml}]
indent_size = 2
max_line_length = 120
```

### Bash/Shell

**VS Code:**

```json
{
  "[shellscript]": {
    "editor.defaultFormatter": "foxundermoon.shell-format",
    "editor.tabSize": 2
  },
  "shellcheck.enable": true
}
```

**EditorConfig:**

```ini
[*.{sh,bash}]
indent_size = 2
max_line_length = 100
```

### TypeScript/JavaScript

**VS Code:**

```json
{
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.rulers": [100],
    "editor.tabSize": 2
  }
}
```

**EditorConfig:**

```ini
[*.{ts,tsx,js,jsx}]
indent_size = 2
max_line_length = 100
```

### Markdown

**VS Code:**

```json
{
  "[markdown]": {
    "editor.defaultFormatter": "DavidAnson.vscode-markdownlint",
    "editor.rulers": [120],
    "files.trimTrailingWhitespace": false
  },
  "markdownlint.config": {
    "MD013": { "line_length": 120 }
  }
}
```

**EditorConfig:**

```ini
[*.md]
max_line_length = 120
trim_trailing_whitespace = false
```

### Makefile

**VS Code:**

```json
{
  "[makefile]": {
    "editor.insertSpaces": false,
    "editor.detectIndentation": false
  }
}
```

**EditorConfig:**

```ini
[Makefile]
indent_style = tab
```

### Ansible

**VS Code:**

```json
{
  "[ansible]": {
    "editor.defaultFormatter": "redhat.ansible",
    "editor.formatOnSave": true,
    "editor.rulers": [120],
    "editor.tabSize": 2
  },
  "ansible.ansible.useFullyQualifiedCollectionNames": true,
  "ansible.validation.enabled": true,
  "ansible.validation.lint.enabled": true,
  "ansible.validation.lint.path": "ansible-lint"
}
```

**EditorConfig:**

```ini
[*.{yaml,yml}]
indent_size = 2
max_line_length = 120
```

### AWS CDK

**VS Code:**

```json
{
  "[typescript]": {
    "editor.codeActionsOnSave": {
      "source.organizeImports": "explicit",
      "source.fixAll.eslint": "explicit"
    }
  },
  "eslint.validate": ["typescript"],
  "cdk.autoSuggest": true
}
```

**EditorConfig:**

```ini
[*.{ts,tsx}]
indent_size = 2
max_line_length = 100
```

### Kubernetes/Helm

**VS Code:**

```json
{
  "vs-kubernetes": {
    "vs-kubernetes.helm-path": "helm",
    "vs-kubernetes.kubectl-path": "kubectl"
  },
  "yaml.schemas": {
    "kubernetes": ["k8s/**/*.yaml", "manifests/**/*.yaml"],
    "https://json.schemastore.org/helmfile": "helmfile.yaml",
    "https://json.schemastore.org/kustomization": "kustomization.yaml"
  },
  "files.associations": {
    "**/k8s/**/*.yaml": "yaml",
    "**/manifests/**/*.yaml": "yaml",
    "**/charts/**/*.yaml": "helm"
  }
}
```

**EditorConfig:**

```ini
[{k8s,manifests}/**/*.{yaml,yml}]
indent_size = 2
max_line_length = 120
```

### Terragrunt

**VS Code:**

```json
{
  "files.associations": {
    "terragrunt.hcl": "terraform",
    "**/terragrunt.hcl": "terraform"
  },
  "[terraform]": {
    "editor.defaultFormatter": "hashicorp.terraform",
    "editor.formatOnSave": true,
    "editor.rulers": [120]
  }
}
```

**EditorConfig:**

```ini
[terragrunt.hcl]
indent_size = 2
max_line_length = 120
```

### GitHub Actions

**VS Code:**

```json
{
  "yaml.schemas": {
    "https://json.schemastore.org/github-workflow": ".github/workflows/*.{yml,yaml}",
    "https://json.schemastore.org/github-action": "action.{yml,yaml}"
  },
  "github.actions.languageServer": {
    "enable": true
  }
}
```

**EditorConfig:**

```ini
[.github/workflows/*.{yml,yaml}]
indent_size = 2
```

### Diagram as Code

Diagram-as-code tools enable version-controlled, text-based diagrams. Configure your IDE
for Mermaid, PlantUML, D2, Graphviz, and Structurizr support.

**VS Code Extensions:**

```json
{
  "recommendations": [
    "bierner.markdown-mermaid",
    "jebbs.plantuml",
    "terrastruct.d2",
    "joaompinto.vscode-graphviz",
    "tintinweb.graphviz-interactive-preview",
    "systemticks.c4-dsl-extension"
  ]
}
```

**VS Code Settings:**

```json
{
  "[mermaid]": {
    "editor.formatOnSave": true,
    "editor.tabSize": 2,
    "editor.insertSpaces": true
  },
  "[plantuml]": {
    "editor.formatOnSave": false,
    "editor.tabSize": 2,
    "editor.insertSpaces": true
  },
  "[d2]": {
    "editor.formatOnSave": true,
    "editor.tabSize": 2,
    "editor.insertSpaces": true
  },
  "[dot]": {
    "editor.formatOnSave": false,
    "editor.tabSize": 2,
    "editor.insertSpaces": true
  },
  "plantuml.server": "https://www.plantuml.com/plantuml",
  "plantuml.render": "PlantUMLServer",
  "plantuml.exportFormat": "svg",
  "files.associations": {
    "*.mmd": "mermaid",
    "*.puml": "plantuml",
    "*.plantuml": "plantuml",
    "*.d2": "d2",
    "*.dot": "dot",
    "*.gv": "dot",
    "*.dsl": "structurizr"
  }
}
```

**EditorConfig:**

```ini
[*.{mmd,puml,plantuml,d2,dot,gv,dsl}]
indent_size = 2
indent_style = space
```

**Supported Tools:**

| Tool | Extension | File Types | Use Case |
|------|-----------|------------|----------|
| Mermaid | `bierner.markdown-mermaid` | `.mmd`, inline in `.md` | Flowcharts, sequences, ER diagrams |
| PlantUML | `jebbs.plantuml` | `.puml`, `.plantuml` | UML, deployment, component diagrams |
| D2 | `terrastruct.d2` | `.d2` | Modern architecture diagrams |
| Graphviz | `joaompinto.vscode-graphviz` | `.dot`, `.gv` | Dependency graphs, state machines |
| Structurizr | `systemticks.c4-dsl-extension` | `.dsl` | C4 model architecture |

See the [Diagram as Code Style Guide](../02_language_guides/diagram_as_code.md) for comprehensive standards.

### GitLab CI

**VS Code:**

```json
{
  "yaml.schemas": {
    "https://json.schemastore.org/gitlab-ci": ".gitlab-ci.yml"
  }
}
```

**EditorConfig:**

```ini
[.gitlab-ci.yml]
indent_size = 2
```

### Docker Compose

**VS Code:**

```json
{
  "yaml.schemas": {
    "https://raw.githubusercontent.com/compose-spec/compose-spec/master/schema/compose-spec.json": [
      "docker-compose*.{yml,yaml}",
      "compose*.{yml,yaml}"
    ]
  },
  "files.associations": {
    "docker-compose*.yml": "yaml",
    "compose*.yml": "yaml"
  }
}
```

**EditorConfig:**

```ini
[docker-compose*.{yml,yaml}]
indent_size = 2
```

### HCL

**VS Code:**

```json
{
  "files.associations": {
    ".terraformrc": "hcl",
    "terraform.rc": "hcl"
  },
  "[hcl]": {
    "editor.defaultFormatter": "hashicorp.hcl",
    "editor.formatOnSave": true,
    "editor.rulers": [120],
    "editor.tabSize": 2
  }
}
```

**EditorConfig:**

```ini
[{.terraformrc,terraform.rc}]
indent_size = 2
max_line_length = 120
```

## Verification & Testing

### Verify VS Code Settings

```bash
# Check if settings are applied
code --list-extensions | grep -E "(python|yaml|markdown|terraform|shellcheck)"

# Test Python formatting
echo "x=1" > test.py
code test.py  # Should auto-format to "x = 1"
```

### Verify IntelliJ Settings

1. Open IntelliJ IDEA
2. Navigate to **Settings → Editor → Code Style**
3. Confirm **Scheme** is set to "Project"
4. Check **Python** tab shows 4-space indent, 100 char margin
5. Check **YAML** tab shows 2-space indent, 120 char margin

### Verify EditorConfig

```bash
# Check EditorConfig support
editorconfig --version

# Test with sample file
cat > test.py << EOF
x=1
EOF

# Open in editor - should auto-indent with 4 spaces
```

### Integration with Pre-commit Hooks

Ensure IDE settings match `.pre-commit-config.yaml`:

```bash
# Run pre-commit on all files
pre-commit run --all-files

# Should pass without changes if IDE formatted correctly
git status
```

## Troubleshooting

### VS Code Extensions Not Installing

```bash
# Install extensions manually
code --install-extension ms-python.black-formatter
code --install-extension hashicorp.terraform
code --install-extension redhat.vscode-yaml
```

### IntelliJ Not Using Project Settings

1. **Settings → Editor → Code Style**
2. Ensure "Enable EditorConfig support" is checked
3. Verify **Scheme** dropdown shows "Project"
4. Restart IDE

### EditorConfig Not Working

Check file is named exactly `.editorconfig` (lowercase, with leading dot):

```bash
ls -la .editorconfig
```

Ensure `root = true` is at the top of the file.

### Format on Save Not Working

**VS Code:**

```json
{
  "editor.formatOnSave": true,
  "[python]": {
    "editor.formatOnSave": true
  }
}
```

**IntelliJ:**

1. **Settings → Tools → Actions on Save**
2. Enable "Reformat code"
3. Enable "Optimize imports"

### Conflicting Formatter Settings

Priority order:

1. Language-specific settings (`[python]`)
2. General editor settings
3. EditorConfig settings
4. User global settings

Ensure language-specific settings override general settings.

## Maintenance

### Updating Settings

When the style guide updates:

```bash
# Pull latest changes
cd coding-style-guide
git pull origin main

# Copy updated settings
cp -r .vscode/* your-project/.vscode/
cp -r .idea/* your-project/.idea/
cp .editorconfig your-project/
```

### Syncing with Pre-commit Hooks

After updating `.pre-commit-config.yaml`, synchronize IDE settings:

```bash
# Update Flake8 args in VS Code settings.json
# Update Black line length
# Update yamllint rules
```

### Version Control

**Add to version control:**

```bash
git add .vscode/settings.json
git add .vscode/extensions.json
git add .idea/codeStyles/
git add .idea/inspectionProfiles/
git add .editorconfig
git commit -m "feat: add IDE settings for automatic style compliance"
```

**Exclude from version control** (optional):

```gitignore
# .gitignore
.idea/workspace.xml
.idea/tasks.xml
.idea/usage.statistics.xml
.idea/shelf/
.vscode/*.code-workspace
```

## Team Onboarding

### New Developer Setup

1. Clone repository
2. Open in IDE (VS Code or IntelliJ)
3. Install recommended extensions (prompted automatically in VS Code)
4. Verify auto-formatting works by editing a Python file
5. Run pre-commit hooks: `pre-commit run --all-files`

### Documentation for Teams

```markdown
## IDE Setup

This project uses automated formatting and linting. Your IDE will automatically
format code on save.

**VS Code:**
1. Install recommended extensions when prompted
2. Settings are pre-configured in `.vscode/settings.json`

**IntelliJ/PyCharm:**
1. Open project
2. IDE will use settings from `.idea/codeStyles/`
3. Enable "Actions on Save → Reformat code"

**Other Editors:**
1. Install EditorConfig plugin
2. Settings will be applied from `.editorconfig`
```

## Reference

### Complete File Listings

See the actual configuration files in this repository on GitHub:

- [.vscode/settings.json](https://github.com/tydukes/coding-style-guide/blob/main/.vscode/settings.json)
- [.vscode/extensions.json](https://github.com/tydukes/coding-style-guide/blob/main/.vscode/extensions.json)
- [.idea/codeStyles/Project.xml](https://github.com/tydukes/coding-style-guide/blob/main/.idea/codeStyles/Project.xml)
- [.idea/inspectionProfiles/Project.xml](https://github.com/tydukes/coding-style-guide/blob/main/.idea/inspectionProfiles/Project.xml)
- [.editorconfig](https://github.com/tydukes/coding-style-guide/blob/main/.editorconfig)

### Related Documentation

- [Python Style Guide](../02_language_guides/python.md)
- [Terraform Style Guide](../02_language_guides/terraform.md)
- [YAML Style Guide](../02_language_guides/yaml.md)
- [Bash Style Guide](../02_language_guides/bash.md)
- [Pre-commit Hooks Documentation](../05_ci_cd/precommit_hooks_guide.md)

### External Resources

- [EditorConfig Documentation](https://editorconfig.org/)
- [VS Code Settings Reference](https://code.visualstudio.com/docs/getstarted/settings)
- [IntelliJ Code Style Settings](https://www.jetbrains.com/help/idea/code-style.html)
- [Black Formatter](https://black.readthedocs.io/)
- [Flake8 Documentation](https://flake8.pycqa.org/)
- [yamllint Configuration](https://yamllint.readthedocs.io/)

---
