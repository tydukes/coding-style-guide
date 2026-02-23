/**
 * @module config/validate
 * @description Config schema validation — returns warnings, never throws
 * @version 1.0.0
 * @author Tyler Dukes
 */

import type { StyleGuideConfig } from "../types.js";

const VALID_LANGUAGES = new Set<string>([
  "python",
  "typescript",
  "javascript",
  "bash",
  "powershell",
  "terraform",
  "hcl",
  "yaml",
  "json",
  "markdown",
  "dockerfile",
  "sql",
  "ansible",
  "kubernetes",
  "makefile",
  "groovy",
]);

function validateLanguageKeys(config: StyleGuideConfig): string[] {
  const warnings: string[] = [];
  for (const lang of Object.keys(config.languages)) {
    if (!VALID_LANGUAGES.has(lang)) {
      warnings.push(
        `Unknown language in config: '${lang}'. Valid languages are: ${[...VALID_LANGUAGES].join(", ")}.`
      );
    }
  }
  return warnings;
}

function validateLinterEntries(config: StyleGuideConfig): string[] {
  const warnings: string[] = [];
  for (const [lang, langConfig] of Object.entries(config.languages)) {
    if (!langConfig) continue;
    for (const [linterName, linterConfig] of Object.entries(langConfig.linters)) {
      if (typeof linterName !== "string" || linterName.trim() === "") {
        warnings.push(`Invalid linter name in language '${lang}': must be a non-empty string.`);
      }
      if (linterConfig === null || typeof linterConfig !== "object") {
        warnings.push(
          `Invalid linter config for '${linterName}' in language '${lang}': expected an object.`
        );
      }
    }
  }
  return warnings;
}

function validateIgnoreField(config: StyleGuideConfig): string[] {
  if (config.ignore === undefined) return [];
  if (Array.isArray(config.ignore)) {
    return config.ignore
      .filter((entry) => typeof entry !== "string")
      .map((entry) => `Each entry in 'ignore' must be a string; found: ${JSON.stringify(entry)}.`);
  }
  return [`'ignore' must be an array of strings.`];
}

function validatePluginsField(config: StyleGuideConfig): string[] {
  if (config.plugins !== undefined && !Array.isArray(config.plugins)) {
    return [`'plugins' must be an array.`];
  }
  return [];
}

function validateCacheField(config: StyleGuideConfig): string[] {
  if (config.cache !== undefined && typeof config.cache !== "boolean") {
    return [`'cache' must be a boolean; found: ${JSON.stringify(config.cache)}.`];
  }
  return [];
}

/**
 * Validate a loaded config and return an array of warning strings.
 * Never throws — unknown linter names are allowed (plugins may register them later).
 */
export function validateConfig(config: StyleGuideConfig): string[] {
  return [
    ...validateLanguageKeys(config),
    ...validateLinterEntries(config),
    ...validateIgnoreField(config),
    ...validateCacheField(config),
    ...validatePluginsField(config),
  ];
}
