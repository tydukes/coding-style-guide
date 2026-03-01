/**
 * @module config/loader
 * @description Configuration discovery and loading
 * @version 1.0.0
 * @author Tyler Dukes
 */

import { cosmiconfig } from "cosmiconfig";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import type { StyleGuideConfig, LanguageConfig, Language } from "../types.js";
import { validateConfig } from "./validate.js";
import { debug } from "../utils/debug.js";

const MODULE_NAME = "devops-style";

const DEFAULT_CONFIG: StyleGuideConfig = {
  languages: {
    python: {
      enabled: true,
      extensions: [".py", ".pyi"],
      linters: {
        black: { enabled: true },
        flake8: { enabled: true },
      },
      formatters: ["black"],
    },
    typescript: {
      enabled: true,
      extensions: [".ts", ".tsx", ".js", ".jsx"],
      linters: {
        eslint: { enabled: true },
        prettier: { enabled: true },
      },
      formatters: ["prettier"],
    },
    bash: {
      enabled: true,
      extensions: [".sh", ".bash"],
      linters: {
        shellcheck: { enabled: true },
      },
    },
    yaml: {
      enabled: true,
      extensions: [".yml", ".yaml"],
      linters: {
        yamllint: { enabled: true },
      },
    },
    json: {
      enabled: true,
      extensions: [".json"],
      linters: {
        prettier: { enabled: true },
      },
      formatters: ["prettier"],
    },
    markdown: {
      enabled: true,
      extensions: [".md", ".mdx"],
      linters: {
        markdownlint: { enabled: true },
      },
    },
    terraform: {
      enabled: true,
      extensions: [".tf", ".tfvars"],
      linters: {
        "terraform-fmt": { enabled: true },
      },
      formatters: ["terraform-fmt"],
    },
    dockerfile: {
      enabled: true,
      extensions: ["Dockerfile"],
      linters: {
        hadolint: { enabled: true },
      },
    },
  },
  ignore: [
    "**/node_modules/**",
    "**/.git/**",
    "**/dist/**",
    "**/build/**",
    "**/__pycache__/**",
    "**/.venv/**",
    "**/venv/**",
    "**/.terraform/**",
  ],
  cache: true,
  cacheLocation: ".devops-style-cache",
};

/**
 * Load configuration from various sources
 */
export async function loadConfig(
  configPath?: string
): Promise<StyleGuideConfig> {
  // If explicit config path provided, load it directly
  if (configPath) {
    return loadConfigFile(configPath);
  }

  // Use cosmiconfig for automatic discovery
  const explorer = cosmiconfig(MODULE_NAME, {
    searchPlaces: [
      "package.json",
      `.${MODULE_NAME}rc`,
      `.${MODULE_NAME}rc.json`,
      `.${MODULE_NAME}rc.yaml`,
      `.${MODULE_NAME}rc.yml`,
      `.${MODULE_NAME}rc.js`,
      `.${MODULE_NAME}rc.cjs`,
      `.${MODULE_NAME}rc.mjs`,
      `${MODULE_NAME}.config.js`,
      `${MODULE_NAME}.config.cjs`,
      `${MODULE_NAME}.config.mjs`,
      ".devops-style.json",
      ".devops-style.yaml",
      ".devops-style.yml",
      "devops-style.config.js",
    ],
  });

  try {
    const result = await explorer.search();
    if (result && !result.isEmpty) {
      debug("Config found: %s", result.filepath);
      const merged = mergeConfig(DEFAULT_CONFIG, result.config);
      const warnings = validateConfig(merged);
      for (const w of warnings) console.warn(`[config] Warning: ${w}`);
      return merged;
    }
  } catch {
    // Config not found, use defaults
  }

  debug("No config file found; using defaults");
  return DEFAULT_CONFIG;
}

/**
 * Load configuration from a specific file
 */
async function loadConfigFile(configPath: string): Promise<StyleGuideConfig> {
  if (!existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }
  debug("Loading config from explicit path: %s", configPath);

  const content = await readFile(configPath, "utf-8");
  const ext = configPath.split(".").pop()?.toLowerCase();

  let config: Partial<StyleGuideConfig>;

  if (ext === "json") {
    config = JSON.parse(content);
  } else if (ext === "yaml" || ext === "yml") {
    const yaml = await import("yaml");
    config = yaml.parse(content);
  } else if (ext === "js" || ext === "cjs" || ext === "mjs") {
    const imported = await import(configPath);
    config = imported.default || imported;
  } else {
    throw new Error(`Unsupported configuration file format: ${ext}`);
  }

  const merged = mergeConfig(DEFAULT_CONFIG, config);
  const warnings = validateConfig(merged);
  for (const w of warnings) console.warn(`[config] Warning: ${w}`);
  return merged;
}

/**
 * Merge user config with defaults
 */
function mergeConfig(
  defaults: StyleGuideConfig,
  userConfig: Partial<StyleGuideConfig>
): StyleGuideConfig {
  const merged: StyleGuideConfig = {
    ...defaults,
    ...userConfig,
    languages: { ...defaults.languages },
    ignore: [...(defaults.ignore || []), ...(userConfig.ignore || [])],
  };

  // Merge language configs
  if (userConfig.languages) {
    for (const [lang, langConfig] of Object.entries(userConfig.languages)) {
      const defaultLang = defaults.languages[lang as Language];
      if (defaultLang && langConfig) {
        merged.languages[lang as Language] = {
          ...defaultLang,
          ...langConfig,
          linters: {
            ...defaultLang.linters,
            ...(langConfig as LanguageConfig).linters,
          },
        };
      } else if (langConfig) {
        merged.languages[lang as Language] = langConfig as LanguageConfig;
      }
    }
  }

  return merged;
}

/**
 * Get the default configuration
 */
export function getDefaultConfig(): StyleGuideConfig {
  return { ...DEFAULT_CONFIG };
}

/**
 * Detect project type from package.json, pyproject.toml, etc.
 */
export async function detectProjectType(): Promise<{
  hasNode: boolean;
  hasPython: boolean;
  hasTerraform: boolean;
  hasDocker: boolean;
  hasAnsible: boolean;
}> {
  const cwd = process.cwd();

  return {
    hasNode:
      existsSync(join(cwd, "package.json")) ||
      existsSync(join(cwd, "tsconfig.json")),
    hasPython:
      existsSync(join(cwd, "pyproject.toml")) ||
      existsSync(join(cwd, "setup.py")) ||
      existsSync(join(cwd, "requirements.txt")),
    hasTerraform:
      existsSync(join(cwd, "main.tf")) ||
      existsSync(join(cwd, "terraform.tf")),
    hasDocker:
      existsSync(join(cwd, "Dockerfile")) ||
      existsSync(join(cwd, "docker-compose.yml")),
    hasAnsible:
      existsSync(join(cwd, "ansible.cfg")) ||
      existsSync(join(cwd, "playbook.yml")),
  };
}
