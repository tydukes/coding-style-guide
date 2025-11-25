---
title: ".gitignore Templates"
description: "Comprehensive .gitignore templates for all languages and frameworks"
author: "Tyler Dukes"
date: "2025-10-28"
tags: [gitignore, git, templates, version-control]
category: "Templates"
status: "active"
version: "1.0.0"
---

## Overview

This document provides comprehensive `.gitignore` templates for all languages and frameworks covered in this style guide.
Use these templates to exclude build artifacts, dependencies, IDE files, and sensitive data from version control.

---

## Python

```gitignore
# Byte-compiled / optimized / DLL files
__pycache__/
*.py[cod]
*$py.class

# C extensions
*.so

# Distribution / packaging
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
pip-wheel-metadata/
share/python-wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# PyInstaller
*.manifest
*.spec

# Installer logs
pip-log.txt
pip-delete-this-directory.txt

# Unit test / coverage reports
htmlcov/
.tox/
.nox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
*.py,cover
.hypothesis/
.pytest_cache/
.ruff_cache/

# Translations
*.mo
*.pot

# Django
*.log
local_settings.py
db.sqlite3
db.sqlite3-journal

# Flask
instance/
.webassets-cache

# Scrapy
.scrapy

# Sphinx documentation
docs/_build/

# PyBuilder
target/

# Jupyter Notebook
.ipynb_checkpoints

# IPython
profile_default/
ipython_config.py

# pyenv
.python-version

# pipenv
Pipfile.lock

# poetry
poetry.lock

# PEP 582
__pypackages__/

# Celery
celerybeat-schedule
celerybeat.pid

# SageMath
*.sage.py

# Environments
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/

# Spyder
.spyderproject
.spyproject

# Rope
.ropeproject

# mkdocs
/site

# mypy
.mypy_cache/
.dmypy.json
dmypy.json

# Pyre
.pyre/

# pytype
.pytype/

# Cython
cython_debug/
```

---

## TypeScript / JavaScript / Node.js

```gitignore
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
pnpm-debug.log*

# Diagnostic reports
report.[0-9]*.[0-9]*.[0-9]*.[0-9]*.json

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Directory for instrumented libs
lib-cov

# Coverage directory
coverage
*.lcov
.nyc_output

# Grunt intermediate storage
.grunt

# Bower dependency directory
bower_components

# node-waf configuration
.lock-wscript

# Compiled binary addons
build/Release

# Dependency directories
node_modules/
jspm_packages/

# Snowpack dependency directory
web_modules/

# TypeScript cache
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional stylelint cache
.stylelintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn
.yarn-integrity
.yarn/cache
.yarn/unplugged
.yarn/build-state.yml
.yarn/install-state.gz
.pnp.*

# parcel-bundler cache
.cache
.parcel-cache

# Next.js
.next/
out/

# Nuxt.js
.nuxt
dist

# Gatsby
.cache/
public

# vuepress
.vuepress/dist

# Serverless
.serverless/

# FuseBox
.fusebox/

# DynamoDB Local
.dynamodb/

# TernJS
.tern-port

# Stores VSCode versions
.vscode-test

# yarn v2
.yarn/cache
.yarn/unplugged
.yarn/build-state.yml
.yarn/install-state.gz
.pnp.*

# Turborepo
.turbo

# Vercel
.vercel

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

---

## Terraform

```gitignore
# Local .terraform directories
**/.terraform/*

# .tfstate files
*.tfstate
*.tfstate.*

# Crash log files
crash.log
crash.*.log

# Exclude all .tfvars files (may contain sensitive data)
*.tfvars
*.tfvars.json

# Ignore override files
override.tf
override.tf.json
*_override.tf
*_override.tf.json

# Include override files you do wish to add to version control
# !example_override.tf

# Include tfplan files to ignore the plan output of command: terraform plan -out=tfplan
# *tfplan*

# Ignore CLI configuration files
.terraformrc
terraform.rc

# Terraform lock file (uncomment to ignore)
# .terraform.lock.hcl

# Terragrunt cache
.terragrunt-cache/

# Terraform provider cache
.terraform.d/

# Sentinel runtime directory
.sentinel
```

---

## Ansible

```gitignore
# Ansible retry files
*.retry

# Ansible vault password files
.vault_pass
vault_pass.txt
.vault-password

# Ansible temporary files
.ansible/

# Inventory files with sensitive data
inventory/production/hosts
inventory/production/*.yml

# Ansible roles downloaded by ansible-galaxy
roles/*/
!roles/.gitkeep

# Molecule
.molecule/
molecule/.cache/

# Python virtualenv
venv/
.venv/

# Logs
*.log

# Test results
test-results/

# Collections
collections/

# Variables with secrets
group_vars/*/vault.yml
host_vars/*/vault.yml
```

---

## Bash

```gitignore
# Logs
*.log

# Backup files
*~
*.bak
*.swp
*.swo
*.tmp

# Shell history
.bash_history
.zsh_history

# Environment files
.env
.env.local

# Scripts output
output/
logs/

# Lock files
*.lock
```

---

## PowerShell

```gitignore
# Logs
*.log
*.txt

# Module directories
PSScriptAnalyzerSettings/

# Test results
TestResults/
*.trx

# Package files
*.nupkg
*.zip

# Environment files
.env
.env.local

# PowerShell profile backups
profile.ps1.bak
```

---

## Go

```gitignore
# Binaries for programs and plugins
*.exe
*.exe~
*.dll
*.so
*.dylib

# Test binary, built with `go test -c`
*.test

# Output of the go coverage tool
*.out

# Dependency directories
vendor/

# Go workspace file
go.work

# Build output
bin/
dist/
build/

# IDEs
.idea/
*.swp
*.swo
*~

# Air (live reload for Go)
tmp/
```

---

## SQL

```gitignore
# Database files
*.db
*.sqlite
*.sqlite3
*.db-shm
*.db-wal

# Backup files
*.bak
*.backup
*.sql.bak

# Query logs
*.log

# Migration generated files
migrations/tmp/
```

---

## Docker

```gitignore
# Docker build context
.dockerignore

# Docker volumes
volumes/

# Docker secrets
secrets/
*.secret

# Build artifacts
.docker/

# Environment files
.env
.env.local
docker-compose.override.yml
```

---

## Jenkins / Groovy

```gitignore
# Jenkins
.jenkins
jobs/
workspace/
builds/
logs/

# Groovy compiled classes
*.class

# Logs
*.log

# Temporary files
*.tmp
```

---

## Kubernetes / Helm

```gitignore
# Helm
charts/*/charts/
*.tgz

# Kubernetes secrets
secrets.yml
secrets.yaml
*-secrets.yml
*-secrets.yaml

# Kustomize
kustomization.yaml.bak

# Temporary manifests
tmp/
temp/

# Rendered templates
rendered/
```

---

## General IDE / Editor Files

```gitignore
# VSCode
.vscode/
*.code-workspace

# IntelliJ IDEA
.idea/
*.iml
*.ipr
*.iws
out/

# Eclipse
.project
.classpath
.settings/
bin/

# Sublime Text
*.sublime-project
*.sublime-workspace

# Vim
*.swp
*.swo
*~
.netrwhist

# Emacs
*~
\#*\#
/.emacs.desktop
/.emacs.desktop.lock
*.elc
auto-save-list
tramp
.\#*

# JetBrains
.idea/
*.iml
*.ipr
*.iws
.idea_modules/

# Atom
.atom/
```

---

## General OS Files

```gitignore
# macOS
.DS_Store
.AppleDouble
.LSOverride
Icon
._*
.DocumentRevisions-V100
.fseventsd
.Spotlight-V100
.TemporaryItems
.Trashes
.VolumeIcon.icns
.com.apple.timemachine.donotpresent
.AppleDB
.AppleDesktop
Network Trash Folder
Temporary Items
.apdisk

# Windows
Thumbs.db
Thumbs.db:encryptable
ehthumbs.db
ehthumbs_vista.db
*.stackdump
[Dd]esktop.ini
$RECYCLE.BIN/
*.cab
*.msi
*.msix
*.msm
*.msp
*.lnk

# Linux
*~
.fuse_hidden*
.directory
.Trash-*
.nfs*
```

---

## Combined DevOps .gitignore

```gitignore
# ============================================
# Combined DevOps .gitignore Template
# ============================================

# ----------------
# Python
# ----------------
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
dist/
*.egg-info/
.pytest_cache/
.coverage
htmlcov/
venv/
.venv/
.env

# ----------------
# Node.js / TypeScript
# ----------------
node_modules/
npm-debug.log*
yarn-error.log*
.next/
.nuxt/
dist/
*.tsbuildinfo
.eslintcache

# ----------------
# Terraform
# ----------------
.terraform/
*.tfstate
*.tfstate.*
*.tfvars
.terraform.lock.hcl
.terragrunt-cache/

# ----------------
# Ansible
# ----------------
*.retry
.ansible/
roles/*/
.molecule/

# ----------------
# Docker
# ----------------
.dockerignore
docker-compose.override.yml

# ----------------
# Kubernetes / Helm
# ----------------
charts/*/charts/
*.tgz
secrets.yml
secrets.yaml

# ----------------
# CI/CD
# ----------------
.jenkins/
.github/workflows/*.log

# ----------------
# IDE / Editors
# ----------------
.vscode/
.idea/
*.swp
*.swo
*.iml

# ----------------
# OS
# ----------------
.DS_Store
Thumbs.db
*~

# ----------------
# Logs & Temporary Files
# ----------------
*.log
*.tmp
*.bak
logs/
tmp/

# ----------------
# Secrets & Credentials
# ----------------
*.pem
*.key
*.crt
*credentials*
*secret*
.env
.env.*
```

---

## Multi-Language Project .gitignore

```gitignore
# ============================================
# Multi-Language Project .gitignore
# ============================================

# ----------------
# Dependencies
# ----------------
node_modules/
vendor/
venv/
.venv/

# ----------------
# Build Artifacts
# ----------------
build/
dist/
out/
target/
bin/
*.exe
*.dll
*.so
*.dylib

# ----------------
# Test & Coverage
# ----------------
coverage/
.coverage
htmlcov/
.pytest_cache/
.nyc_output/
test-results/
*.test

# ----------------
# Package Files
# ----------------
*.egg-info/
*.nupkg
*.tgz
*.tar.gz
*.zip

# ----------------
# Infrastructure
# ----------------
.terraform/
*.tfstate
*.tfstate.*
.terragrunt-cache/
.ansible/

# ----------------
# Environment & Config
# ----------------
.env
.env.local
.env.*.local
*.tfvars
secrets/
credentials/

# ----------------
# IDE & Editors
# ----------------
.vscode/
.idea/
*.swp
*.swo
*~
.project
.classpath

# ----------------
# OS Files
# ----------------
.DS_Store
Thumbs.db
Desktop.ini

# ----------------
# Logs
# ----------------
*.log
logs/
npm-debug.log*
yarn-debug.log*

# ----------------
# Cache
# ----------------
.cache/
.eslintcache
.ruff_cache/
.mypy_cache/
*.tsbuildinfo

# ----------------
# CI/CD
# ----------------
.github/workflows/*.log
.jenkins/
```

---

## Language-Specific Additions

### Go Projects

```gitignore
# Go
vendor/
*.test
*.out
go.work
bin/
```

### Ruby Projects

```gitignore
# Ruby
*.gem
*.rbc
/.config
/coverage/
/InstalledFiles
/pkg/
/spec/reports/
/spec/examples.txt
/test/tmp/
/test/version_tmp/
/tmp/
.bundle
.byebug_history
.rspec_status
```

### Java Projects

```gitignore
# Java
*.class
*.jar
*.war
*.ear
*.nar
target/
pom.xml.tag
pom.xml.releaseBackup
pom.xml.versionsBackup
dependency-reduced-pom.xml
.classpath
.project
.settings/
```

### Rust Projects

```gitignore
# Rust
target/
Cargo.lock
**/*.rs.bk
*.pdb
```

### C/C++ Projects

```gitignore
# C/C++
*.o
*.obj
*.exe
*.out
*.app
*.i*86
*.x86_64
*.hex
*.dSYM/
*.su
*.idb
*.pdb
*.ilk
*.map
```

---

## Best Practices

### General Rules

1. **Version Control Sensitive Data**: Never commit:
   - API keys, passwords, tokens
   - Private keys, certificates
   - Database credentials
   - Environment variables with secrets

2. **Exclude Build Artifacts**:
   - Compiled code
   - Distribution packages
   - Dependency directories

3. **Ignore IDE Files**:
   - Personal workspace settings
   - Project-specific IDE configurations

4. **Keep It Updated**:
   - Review and update `.gitignore` regularly
   - Add new patterns as project evolves

### Using .gitignore

```bash
# Check if a file would be ignored
git check-ignore -v path/to/file

# Remove already tracked files from git
git rm --cached <file>
git rm -r --cached <directory>

# Force add an ignored file (use carefully)
git add -f <file>
```

### Global .gitignore

```bash
# Set global .gitignore for all repositories
git config --global core.excludesfile ~/.gitignore_global

# Create global .gitignore
cat > ~/.gitignore_global <<EOF
.DS_Store
.vscode/
.idea/
*.swp
EOF
```

---

## References

### Official Documentation

- [Git Documentation - gitignore](https://git-scm.com/docs/gitignore)
- [GitHub .gitignore Templates](https://github.com/github/gitignore)
- [Gitignore.io](https://www.toptal.com/developers/gitignore)

### Tools

- [gitignore.io](https://www.toptal.com/developers/gitignore) - Generate .gitignore files
- [git check-ignore](https://git-scm.com/docs/git-check-ignore) - Debug .gitignore rules

---

**Version**: 1.0.0
**Last Updated**: 2025-10-28
**Status**: Active
