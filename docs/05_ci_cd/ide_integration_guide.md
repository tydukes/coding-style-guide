---
title: "IDE Integration Guide"
description: "Comprehensive guide to integrating linters, formatters, and validation tools into VS Code, JetBrains IDEs, Vim/Neovim, and other popular editors"
author: "Tyler Dukes"
tags: [ide, editor, integration, vscode, jetbrains, vim, neovim, development-tools]
category: "CI/CD"
status: "active"
---

## Introduction

This guide provides detailed instructions for integrating all validation tools, linters, formatters, and testing
frameworks into popular IDEs and editors. Proper IDE integration enables real-time feedback, automated formatting,
and a seamless development experience.

---

## Table of Contents

1. [VS Code](#vs-code)
2. [JetBrains IDEs](#jetbrains-ides)
3. [Vim/Neovim](#vimneovim)
4. [Sublime Text](#sublime-text)
5. [Emacs](#emacs)
6. [Remote Development](#remote-development)
7. [Performance Optimization](#performance-optimization)

---

## VS Code

### Initial Setup

**Install VS Code**:

```bash
## macOS
brew install --cask visual-studio-code

## Ubuntu/Debian
sudo snap install code --classic

## Manual download
## https://code.visualstudio.com/download
```

**Enable command line access**:

1. Open VS Code
2. Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
3. Type "Shell Command: Install 'code' command in PATH"
4. Select and execute

### Essential Extensions

**Install core extensions**:

```bash
## Python
code --install-extension ms-python.python
code --install-extension ms-python.black-formatter
code --install-extension ms-python.isort
code --install-extension ms-python.flake8
code --install-extension ms-python.mypy-type-checker
code --install-extension ms-python.pylint

## JavaScript/TypeScript
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension yoavbls.pretty-ts-errors

## Terraform
code --install-extension hashicorp.terraform
code --install-extension hashicorp.hcl

## Ansible
code --install-extension redhat.ansible

## Docker
code --install-extension ms-azuretools.vscode-docker

## Shell
code --install-extension timonwong.shellcheck
code --install-extension foxundermoon.shell-format

## YAML
code --install-extension redhat.vscode-yaml

## Markdown
code --install-extension yzhang.markdown-all-in-one
code --install-extension davidanson.vscode-markdownlint

## Git
code --install-extension eamodio.gitlens
code --install-extension mhutchie.git-graph

## General
code --install-extension editorconfig.editorconfig
code --install-extension streetsidesoftware.code-spell-checker
code --install-extension ryanluker.vscode-coverage-gutters
code --install-extension gruntfuggly.todo-tree
```

### Python Configuration

**.vscode/settings.json**:

```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/.venv/bin/python",

  // Formatting
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.organizeImports": "explicit"
    }
  },

  // Black formatter
  "black-formatter.args": [
    "--line-length=120"
  ],

  // isort
  "isort.args": [
    "--profile=black",
    "--line-length=120"
  ],

  // Flake8
  "flake8.args": [
    "--max-line-length=120",
    "--extend-ignore=E203,W503"
  ],

  // mypy
  "mypy-type-checker.args": [
    "--ignore-missing-imports",
    "--strict"
  ],

  // Pylint
  "pylint.args": [
    "--max-line-length=120"
  ],

  // Python testing
  "python.testing.pytestEnabled": true,
  "python.testing.unittestEnabled": false,
  "python.testing.pytestArgs": [
    "tests"
  ],

  // Python analysis
  "python.analysis.typeCheckingMode": "basic",
  "python.analysis.autoImportCompletions": true,
  "python.analysis.inlayHints.functionReturnTypes": true,
  "python.analysis.inlayHints.variableTypes": true
}
```

### JavaScript/TypeScript Configuration

**.vscode/settings.json**:

```json
{
  // TypeScript/JavaScript formatting
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": "explicit",
      "source.organizeImports": "explicit"
    }
  },

  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": "explicit"
    }
  },

  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },

  "[javascriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },

  // ESLint
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "eslint.format.enable": true,
  "eslint.codeActionsOnSave.mode": "all",

  // Prettier
  "prettier.requireConfig": true,

  // TypeScript
  "typescript.updateImportsOnFileMove.enabled": "always",
  "typescript.inlayHints.parameterNames.enabled": "all",
  "typescript.inlayHints.functionLikeReturnTypes.enabled": true,
  "typescript.suggest.autoImports": true
}
```

### Terraform Configuration

**.vscode/settings.json**:

```json
{
  "[terraform]": {
    "editor.defaultFormatter": "hashicorp.terraform",
    "editor.formatOnSave": true
  },

  "[terraform-vars]": {
    "editor.defaultFormatter": "hashicorp.terraform"
  },

  "terraform.languageServer.enable": true,
  "terraform.experimentalFeatures.validateOnSave": true,
  "terraform.experimentalFeatures.prefillRequiredFields": true
}
```

### Complete VS Code Settings

**.vscode/settings.json** (complete):

```json
{
  // Editor settings
  "editor.formatOnSave": true,
  "editor.formatOnPaste": false,
  "editor.codeActionsOnSave": {
    "source.fixAll": "explicit",
    "source.organizeImports": "explicit"
  },
  "editor.rulers": [120],
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "editor.detectIndentation": true,
  "editor.bracketPairColorization.enabled": true,
  "editor.guides.bracketPairs": true,
  "editor.minimap.enabled": true,
  "editor.renderWhitespace": "boundary",

  // Files
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,
  "files.trimFinalNewlines": true,
  "files.eol": "\n",
  "files.exclude": {
    "**/__pycache__": true,
    "**/.pytest_cache": true,
    "**/.mypy_cache": true,
    "**/node_modules": true,
    "**/.terraform": true,
    "**/dist": true,
    "**/build": true
  },
  "files.watcherExclude": {
    "**/.git/objects/**": true,
    "**/node_modules/**": true,
    "**/.venv/**": true,
    "**/__pycache__/**": true
  },

  // Search
  "search.exclude": {
    "**/node_modules": true,
    "**/bower_components": true,
    "**/*.code-search": true,
    "**/.venv": true,
    "**/dist": true,
    "**/build": true
  },

  // Python
  "python.defaultInterpreterPath": "${workspaceFolder}/.venv/bin/python",
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.organizeImports": "explicit"
    },
    "editor.tabSize": 4
  },
  "black-formatter.args": ["--line-length=120"],
  "isort.args": ["--profile=black", "--line-length=120"],
  "flake8.args": ["--max-line-length=120", "--extend-ignore=E203,W503"],
  "mypy-type-checker.args": ["--ignore-missing-imports", "--strict"],
  "python.testing.pytestEnabled": true,
  "python.testing.unittestEnabled": false,
  "python.analysis.typeCheckingMode": "basic",

  // JavaScript/TypeScript
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": "explicit",
      "source.organizeImports": "explicit"
    }
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": "explicit"
    }
  },
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"],
  "typescript.updateImportsOnFileMove.enabled": "always",

  // Terraform
  "[terraform]": {
    "editor.defaultFormatter": "hashicorp.terraform",
    "editor.formatOnSave": true
  },
  "terraform.languageServer.enable": true,

  // Shell
  "[shellscript]": {
    "editor.defaultFormatter": "foxundermoon.shell-format"
  },
  "shellformat.flag": "-i 2 -ci",

  // YAML
  "[yaml]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.insertSpaces": true,
    "editor.tabSize": 2
  },
  "yaml.schemas": {
    "https://json.schemastore.org/github-workflow.json": ".github/workflows/*.yml",
    "https://json.schemastore.org/gitlab-ci.json": ".gitlab-ci.yml"
  },

  // Markdown
  "[markdown]": {
    "editor.defaultFormatter": "yzhang.markdown-all-in-one",
    "editor.wordWrap": "on",
    "editor.quickSuggestions": {
      "comments": "off",
      "strings": "off",
      "other": "off"
    }
  },
  "markdownlint.config": {
    "MD013": { "line_length": 120 }
  },

  // JSON
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[jsonc]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },

  // Git
  "git.autofetch": true,
  "git.confirmSync": false,
  "git.enableSmartCommit": true,
  "gitlens.hovers.currentLine.over": "line",

  // Terminal
  "terminal.integrated.defaultProfile.osx": "zsh",
  "terminal.integrated.fontSize": 12,

  // Workbench
  "workbench.colorTheme": "Default Dark+",
  "workbench.iconTheme": "vs-seti",
  "workbench.editor.enablePreview": false,

  // Extensions
  "extensions.ignoreRecommendations": false,

  // Spell checker
  "cSpell.words": [
    "autofix",
    "autoupdate",
    "mypy",
    "flake8",
    "pylint",
    "pytest",
    "terraform",
    "terragrunt",
    "kubectl",
    "ansible"
  ]
}
```

### VS Code Tasks

**.vscode/tasks.json**:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Run All Python Checks",
      "type": "shell",
      "command": "black src/ && isort src/ && flake8 src/ && mypy src/ && pytest",
      "group": {
        "kind": "test",
        "isDefault": true
      },
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "Format Python Code",
      "type": "shell",
      "command": "black src/ && isort src/",
      "group": "build",
      "presentation": {
        "reveal": "silent"
      }
    },
    {
      "label": "Run TypeScript Checks",
      "type": "shell",
      "command": "npm run lint && npm run type-check && npm test",
      "group": "test",
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "Terraform Format",
      "type": "shell",
      "command": "terraform fmt -recursive",
      "group": "build"
    },
    {
      "label": "Terraform Validate",
      "type": "shell",
      "command": "terraform validate",
      "group": "test"
    }
  ]
}
```

### VS Code Launch Configuration

**.vscode/launch.json**:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: Current File",
      "type": "python",
      "request": "launch",
      "program": "${file}",
      "console": "integratedTerminal",
      "justMyCode": true
    },
    {
      "name": "Python: pytest",
      "type": "python",
      "request": "launch",
      "module": "pytest",
      "args": ["tests/", "-v"],
      "console": "integratedTerminal",
      "justMyCode": false
    },
    {
      "name": "Node: Current File",
      "type": "node",
      "request": "launch",
      "program": "${file}",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Jest: Current File",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["${fileBasenameNoExtension}", "--config", "jest.config.js"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

---

## JetBrains IDEs

### PyCharm

**Initial Setup**:

1. Install PyCharm (Professional or Community)
2. Open project
3. Configure Python interpreter: Settings > Project > Python Interpreter
4. Select or create virtual environment

**Configure Black**:

1. Settings > Tools > Black
2. Enable: ✓
3. Arguments: `--line-length 120`
4. On code reformat: ✓
5. On save: ✓ (optional)

**Configure isort**:

1. Settings > Tools > File Watchers
2. Click + > Custom
3. Name: isort
4. File type: Python
5. Program: `$PyInterpreterDirectory$/isort`
6. Arguments: `$FilePath$ --profile black`
7. Working directory: `$ProjectFileDir$`

**Configure flake8**:

1. Settings > Tools > External Tools
2. Click +
3. Name: flake8
4. Program: `$PyInterpreterDirectory$/flake8`
5. Arguments: `$FilePath$ --max-line-length=120`
6. Working directory: `$ProjectFileDir$`

**Configure mypy**:

1. Settings > Tools > External Tools
2. Click +
3. Name: mypy
4. Program: `$PyInterpreterDirectory$/mypy`
5. Arguments: `$FilePath$ --ignore-missing-imports`
6. Working directory: `$ProjectFileDir$`

**Enable Pylint plugin**:

1. Settings > Plugins
2. Search "Pylint"
3. Install and restart
4. Settings > Pylint > Path to executable: Select `pylint` from venv

**Testing configuration**:

1. Settings > Tools > Python Integrated Tools
2. Default test runner: pytest
3. pytest arguments: `-v --cov=src`

### WebStorm/IntelliJ IDEA

**Configure Prettier**:

1. Settings > Languages & Frameworks > JavaScript > Prettier
2. Prettier package: `./node_modules/prettier`
3. Run on save: ✓
4. Files pattern: `{**/*,*}.{js,ts,jsx,tsx,json,css,scss,md}`

**Configure ESLint**:

1. Settings > Languages & Frameworks > JavaScript > Code Quality Tools > ESLint
2. Automatic ESLint configuration: ✓
3. Run eslint --fix on save: ✓

**Configure TypeScript**:

1. Settings > Languages & Frameworks > TypeScript
2. TypeScript language service: ✓
3. Recompile on changes: ✓
4. Service directory: `./node_modules/typescript`

**File Watchers for Auto-formatting**:

1. Settings > Tools > File Watchers
2. Add Prettier watcher:
   - File type: JavaScript / TypeScript
   - Program: `$ProjectFileDir$/node_modules/.bin/prettier`
   - Arguments: `--write $FilePath$`
   - Output paths: `$FilePath$`

### IntelliJ IDEA (Terraform)**

1. Install HashiCorp Terraform plugin
2. Settings > Languages & Frameworks > Terraform
3. Enable Terraform tools: ✓
4. Terraform executable: `/usr/local/bin/terraform`
5. Format on save: ✓

### Common JetBrains Settings

**EditorConfig Support**:

1. Settings > Editor > Code Style
2. Enable EditorConfig support: ✓

**File encoding**:

1. Settings > Editor > File Encodings
2. Global Encoding: UTF-8
3. Project Encoding: UTF-8
4. Default encoding for properties files: UTF-8

**Line separators**:

1. Settings > Editor > Code Style
2. Line separator: Unix and macOS (\n)

**Inspections**:

1. Settings > Editor > Inspections
2. Enable relevant language inspections
3. Set severity levels

---

## Vim/Neovim

### Neovim Setup with LSP

**Install Neovim**:

```bash
## macOS
brew install neovim

## Ubuntu/Debian
sudo apt install neovim

## Verify
nvim --version
```

**Install plugin manager (lazy.nvim)**:

```lua
-- ~/.config/nvim/init.lua
local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not vim.loop.fs_stat(lazypath) then
  vim.fn.system({
    "git",
    "clone",
    "--filter=blob:none",
    "https://github.com/folke/lazy.nvim.git",
    "--branch=stable",
    lazypath,
  })
end
vim.opt.rtp:prepend(lazypath)

require("lazy").setup({
  -- LSP
  "neovim/nvim-lspconfig",
  "williamboman/mason.nvim",
  "williamboman/mason-lspconfig.nvim",

  -- Autocompletion
  "hrsh7th/nvim-cmp",
  "hrsh7th/cmp-nvim-lsp",
  "hrsh7th/cmp-buffer",
  "hrsh7th/cmp-path",
  "L3MON4D3/LuaSnip",

  -- Formatting
  "jose-elias-alvarez/null-ls.nvim",

  -- Syntax highlighting
  { "nvim-treesitter/nvim-treesitter", build = ":TSUpdate" },

  -- File explorer
  "nvim-tree/nvim-tree.lua",
  "nvim-tree/nvim-web-devicons",

  -- Fuzzy finder
  {
    "nvim-telescope/telescope.nvim",
    dependencies = { "nvim-lua/plenary.nvim" }
  },

  -- Git
  "lewis6991/gitsigns.nvim",

  -- Status line
  "nvim-lualine/lualine.nvim",

  -- Color scheme
  "folke/tokyonight.nvim",
})
```

**LSP Configuration**:

```lua
-- ~/.config/nvim/lua/lsp.lua
local lspconfig = require("lspconfig")
local capabilities = require("cmp_nvim_lsp").default_capabilities()

-- Python
lspconfig.pyright.setup({
  capabilities = capabilities,
  settings = {
    python = {
      analysis = {
        typeCheckingMode = "basic",
        autoSearchPaths = true,
        useLibraryCodeForTypes = true,
      }
    }
  }
})

-- TypeScript
lspconfig.tsserver.setup({
  capabilities = capabilities,
})

-- Terraform
lspconfig.terraformls.setup({
  capabilities = capabilities,
})

-- Lua
lspconfig.lua_ls.setup({
  capabilities = capabilities,
  settings = {
    Lua = {
      diagnostics = {
        globals = { "vim" }
      }
    }
  }
})

-- Bash
lspconfig.bashls.setup({
  capabilities = capabilities,
})

-- YAML
lspconfig.yamlls.setup({
  capabilities = capabilities,
  settings = {
    yaml = {
      schemas = {
        ["https://json.schemastore.org/github-workflow.json"] = "/.github/workflows/*"
      }
    }
  }
})
```

**Null-ls for Formatting and Linting**:

```lua
-- ~/.config/nvim/lua/null-ls-config.lua
local null_ls = require("null-ls")

null_ls.setup({
  sources = {
    -- Python
    null_ls.builtins.formatting.black.with({
      extra_args = { "--line-length=120" }
    }),
    null_ls.builtins.formatting.isort.with({
      extra_args = { "--profile=black" }
    }),
    null_ls.builtins.diagnostics.flake8.with({
      extra_args = { "--max-line-length=120" }
    }),
    null_ls.builtins.diagnostics.mypy,

    -- JavaScript/TypeScript
    null_ls.builtins.formatting.prettier,
    null_ls.builtins.diagnostics.eslint,

    -- Terraform
    null_ls.builtins.formatting.terraform_fmt,

    -- Shell
    null_ls.builtins.formatting.shfmt.with({
      extra_args = { "-i", "2", "-ci" }
    }),
    null_ls.builtins.diagnostics.shellcheck,

    -- YAML
    null_ls.builtins.diagnostics.yamllint,

    -- Markdown
    null_ls.builtins.diagnostics.markdownlint,
  },
  on_attach = function(client, bufnr)
    if client.supports_method("textDocument/formatting") then
      vim.api.nvim_create_autocmd("BufWritePre", {
        buffer = bufnr,
        callback = function()
          vim.lsp.buf.format({ bufnr = bufnr })
        end,
      })
    end
  end,
})
```

**Key Mappings**:

```lua
-- ~/.config/nvim/lua/keymaps.lua
local opts = { noremap = true, silent = true }

-- LSP keymaps
vim.keymap.set('n', 'gd', vim.lsp.buf.definition, opts)
vim.keymap.set('n', 'K', vim.lsp.buf.hover, opts)
vim.keymap.set('n', 'gi', vim.lsp.buf.implementation, opts)
vim.keymap.set('n', '<leader>rn', vim.lsp.buf.rename, opts)
vim.keymap.set('n', '<leader>ca', vim.lsp.buf.code_action, opts)
vim.keymap.set('n', 'gr', vim.lsp.buf.references, opts)

-- Format
vim.keymap.set('n', '<leader>f', vim.lsp.buf.format, opts)

-- Diagnostics
vim.keymap.set('n', '<leader>e', vim.diagnostic.open_float, opts)
vim.keymap.set('n', '[d', vim.diagnostic.goto_prev, opts)
vim.keymap.set('n', ']d', vim.diagnostic.goto_next, opts)
```

### Vim (Classic) with ALE

**Install Vim-Plug**:

```bash
curl -fLo ~/.vim/autoload/plug.vim --create-dirs \
    https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim
```

**.vimrc**:

```vim
call plug#begin('~/.vim/plugged')

" Linting and fixing
Plug 'dense-analysis/ale'

" Autocompletion
Plug 'ycm-core/YouCompleteMe', { 'do': './install.py' }

" File explorer
Plug 'preservim/nerdtree'

" Fuzzy finder
Plug 'junegunn/fzf', { 'do': { -> fzf#install() } }
Plug 'junegunn/fzf.vim'

" Git
Plug 'tpope/vim-fugitive'

" Status line
Plug 'vim-airline/vim-airline'

" Color scheme
Plug 'morhetz/gruvbox'

call plug#end()

" ALE configuration
let g:ale_linters = {
\   'python': ['flake8', 'mypy', 'pylint'],
\   'javascript': ['eslint'],
\   'typescript': ['eslint', 'tsserver'],
\   'terraform': ['tflint'],
\   'sh': ['shellcheck'],
\   'yaml': ['yamllint'],
\}

let g:ale_fixers = {
\   'python': ['black', 'isort'],
\   'javascript': ['prettier', 'eslint'],
\   'typescript': ['prettier', 'eslint'],
\   'terraform': ['terraform'],
\   'sh': ['shfmt'],
\   'yaml': ['prettier'],
\   '*': ['remove_trailing_lines', 'trim_whitespace'],
\}

let g:ale_fix_on_save = 1
let g:ale_python_black_options = '--line-length 120'
let g:ale_python_isort_options = '--profile black'
let g:ale_python_flake8_options = '--max-line-length=120'

" Color scheme
colorscheme gruvbox
set background=dark

" General settings
set number
set relativenumber
set tabstop=2
set shiftwidth=2
set expandtab
set autoindent
set smartindent
```

---

## Sublime Text

**Install Package Control**:

1. Open Sublime Text
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS)
3. Type "Install Package Control"
4. Select and execute

**Install Packages**:

1. `Ctrl+Shift+P` > "Package Control: Install Package"
2. Install the following:
   - LSP
   - LSP-pyright
   - LSP-typescript
   - LSP-terraform
   - SublimeLinter
   - SublimeLinter-flake8
   - SublimeLinter-eslint
   - JsPrettier
   - Terraform

**LSP Settings**:

Preferences > Package Settings > LSP > Settings:

```json
{
  "clients": {
    "pyright": {
      "enabled": true,
      "command": ["pyright-langserver", "--stdio"],
      "selector": "source.python"
    },
    "typescript": {
      "enabled": true,
      "command": ["typescript-language-server", "--stdio"],
      "selector": "source.ts | source.tsx | source.js | source.jsx"
    }
  }
}
```

**User Settings**:

Preferences > Settings:

```json
{
  "translate_tabs_to_spaces": true,
  "tab_size": 2,
  "rulers": [120],
  "trim_trailing_white_space_on_save": true,
  "ensure_newline_at_eof_on_save": true,
  "default_line_ending": "unix"
}
```

---

## Emacs

**Install Emacs**:

```bash
## macOS
brew install --cask emacs

## Ubuntu/Debian
sudo apt install emacs
```

**Install use-package**:

Add to `~/.emacs.d/init.el`:

```elisp
;; Initialize package sources
(require 'package)
(setq package-archives '(("melpa" . "https://melpa.org/packages/")
                         ("org" . "https://orgmode.org/elpa/")
                         ("elpa" . "https://elpa.gnu.org/packages/")))
(package-initialize)
(unless package-archive-contents
  (package-refresh-contents))

;; Install use-package
(unless (package-installed-p 'use-package)
  (package-install 'use-package))
(require 'use-package)
(setq use-package-always-ensure t)
```

**LSP Mode**:

```elisp
;; LSP Mode
(use-package lsp-mode
  :init
  (setq lsp-keymap-prefix "C-c l")
  :hook ((python-mode . lsp)
         (typescript-mode . lsp)
         (terraform-mode . lsp)
         (sh-mode . lsp))
  :commands lsp)

(use-package lsp-ui :commands lsp-ui-mode)
(use-package company :config (global-company-mode))
(use-package flycheck :config (global-flycheck-mode))

;; Python
(use-package python-mode)
(use-package py-autopep8
  :hook (python-mode . py-autopep8-mode))

;; TypeScript
(use-package typescript-mode)

;; Terraform
(use-package terraform-mode)

;; YAML
(use-package yaml-mode)

;; Markdown
(use-package markdown-mode)

;; Git
(use-package magit)

;; Project management
(use-package projectile
  :config
  (projectile-mode +1)
  (define-key projectile-mode-map (kbd "C-c p") 'projectile-command-map))
```

---

## Remote Development

### VS Code Remote SSH

**Install extension**:

```bash
code --install-extension ms-vscode-remote.remote-ssh
```

**Configure SSH**:

`~/.ssh/config`:

```text
Host dev-server
    HostName dev.example.com
    User yourusername
    IdentityFile ~/.ssh/id_rsa
    ForwardAgent yes
```

**Connect**:

1. Press `Cmd+Shift+P` / `Ctrl+Shift+P`
2. Type "Remote-SSH: Connect to Host"
3. Select your configured host
4. Open folder on remote server
5. Extensions are installed on remote automatically

### JetBrains Gateway

1. Download JetBrains Gateway
2. New Connection > SSH
3. Enter host details
4. Select IDE (PyCharm, WebStorm, etc.)
5. Gateway handles remote development

### Docker Development

**VS Code Dev Containers**:

```bash
code --install-extension ms-vscode-remote.remote-containers
```

**.devcontainer/devcontainer.json**:

```json
{
  "name": "Python Dev Container",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-python.python",
        "ms-python.black-formatter",
        "ms-python.flake8",
        "ms-python.mypy-type-checker"
      ],
      "settings": {
        "python.defaultInterpreterPath": "/usr/local/bin/python",
        "python.formatting.provider": "black"
      }
    }
  },
  "postCreateCommand": "pip install -e .[dev]",
  "remoteUser": "vscode"
}
```

---

## Performance Optimization

### VS Code Performance

**Disable unused extensions**:

```bash
## List installed extensions
code --list-extensions

## Disable specific extension
code --disable-extension <extension-id>
```

**settings.json optimizations**:

```json
{
  "files.watcherExclude": {
    "**/.git/objects/**": true,
    "**/node_modules/**": true,
    "**/.venv/**": true,
    "**/__pycache__/**": true,
    "**/dist/**": true,
    "**/build/**": true
  },
  "search.followSymlinks": false,
  "search.useIgnoreFiles": true,
  "typescript.disableAutomaticTypeAcquisition": false,
  "extensions.autoUpdate": false
}
```

### JetBrains Performance

1. Settings > Appearance & Behavior > System Settings
2. Increase memory heap: `-Xmx4096m`
3. Disable unused plugins
4. Exclude directories from indexing:
   - Settings > Project > Directories
   - Mark `node_modules`, `.venv`, `dist` as Excluded

### Neovim Performance

```lua
-- Disable unused providers
vim.g.loaded_perl_provider = 0
vim.g.loaded_ruby_provider = 0
vim.g.loaded_node_provider = 0

-- Faster update time
vim.opt.updatetime = 300

-- Limit syntax highlighting
vim.opt.synmaxcol = 200
```

---

## Resources

- [VS Code Documentation](https://code.visualstudio.com/docs)
- [JetBrains IDEs](https://www.jetbrains.com/help/)
- [Neovim Documentation](https://neovim.io/doc/)
- [LSP Specification](https://microsoft.github.io/language-server-protocol/)

---

**Next Steps:**

- Review the [Local Validation Setup](local_validation_setup.md) for tool installation
- See [Pre-commit Hooks Guide](precommit_hooks_guide.md) for automated validation
- Check [AI Validation Pipeline](ai_validation_pipeline.md) for CI/CD integration
