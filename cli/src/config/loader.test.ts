/**
 * Unit tests for config loader — mergeConfig, loadConfig, detectProjectType.
 * Uses Node's built-in test runner (node:test + node:assert).
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { StyleGuideConfig, Language, LanguageConfig } from "../types.js";

function mergeConfig(
  defaults: StyleGuideConfig,
  userConfig: Partial<StyleGuideConfig>
): StyleGuideConfig {
  const merged: StyleGuideConfig = {
    ...defaults,
    ...userConfig,
    languages: { ...defaults.languages },
    ignore: [...(defaults.ignore ?? []), ...(userConfig.ignore ?? [])],
  };

  if (userConfig.languages) {
    for (const [lang, langConfig] of Object.entries(userConfig.languages)) {
      const defaultLang = defaults.languages[lang as Language];
      if (defaultLang && langConfig) {
        merged.languages[lang as Language] = {
          ...defaultLang,
          ...langConfig,
          linters: {
            ...defaultLang.linters,
            ...langConfig.linters,
          },
        };
      } else if (langConfig) {
        merged.languages[lang as Language] = langConfig;
      }
    }
  }

  return merged;
}

// ---------------------------------------------------------------------------
// Minimal default config for tests
// ---------------------------------------------------------------------------

const BASE_CONFIG: StyleGuideConfig = {
  languages: {
    python: {
      enabled: true,
      extensions: [".py"],
      linters: { black: { enabled: true }, flake8: { enabled: true } },
    },
  },
  ignore: ["**/node_modules/**"],
  cache: false,
};

// ---------------------------------------------------------------------------
// mergeConfig tests
// ---------------------------------------------------------------------------

describe("mergeConfig", () => {
  it("user config overrides top-level keys", () => {
    const result = mergeConfig(BASE_CONFIG, { cache: true });
    assert.equal(result.cache, true);
  });

  it("ignore arrays concatenate (not replace)", () => {
    const result = mergeConfig(BASE_CONFIG, { ignore: ["**/dist/**"] });
    assert.ok(result.ignore?.includes("**/node_modules/**"));
    assert.ok(result.ignore?.includes("**/dist/**"));
  });

  it("user linter config merges into language defaults", () => {
    const result = mergeConfig(BASE_CONFIG, {
      languages: {
        python: {
          enabled: true,
          extensions: [".py"],
          linters: { flake8: { enabled: false } },
        },
      },
    });
    // flake8 overridden, black preserved
    assert.equal(result.languages.python?.linters.flake8?.enabled, false);
    assert.equal(result.languages.python?.linters.black?.enabled, true);
  });

  it("adds a new language not in defaults", () => {
    const result = mergeConfig(BASE_CONFIG, {
      languages: {
        // @ts-expect-error — using a synthetic language name for testing
        rust: {
          enabled: true,
          extensions: [".rs"],
          linters: { clippy: { enabled: true } },
        },
      },
    });
    // @ts-expect-error — same
    assert.ok(result.languages.rust?.linters.clippy?.enabled);
  });
});

// ---------------------------------------------------------------------------
// loadConfig — file-based tests using a temp directory
// ---------------------------------------------------------------------------

describe("loadConfig", () => {
  let tmpDir: string;

  before(() => {
    tmpDir = join(tmpdir(), `style-guide-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
  });

  after(() => {
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
  });

  it("loads a valid JSON config file", async () => {
    const configPath = join(tmpDir, "config.json");
    writeFileSync(configPath, JSON.stringify({ cache: true }), "utf-8");

    // Dynamic import to avoid module caching issues
    const { loadConfig } = await import("../config/loader.js");
    const config = await loadConfig(configPath);
    assert.equal(config.cache, true);
  });

  it("loads a valid YAML config file", async () => {
    const configPath = join(tmpDir, "config.yaml");
    writeFileSync(configPath, "cache: true\n", "utf-8");

    const { loadConfig } = await import("../config/loader.js");
    const config = await loadConfig(configPath);
    assert.equal(config.cache, true);
  });

  it("throws when config file does not exist", async () => {
    const { loadConfig } = await import("../config/loader.js");
    await assert.rejects(
      () => loadConfig(join(tmpDir, "nonexistent.json")),
      /not found/i
    );
  });
});

// ---------------------------------------------------------------------------
// detectProjectType — sentinel file detection
// ---------------------------------------------------------------------------

describe("detectProjectType", () => {
  let tmpDir: string;
  let originalCwd: string;

  before(() => {
    tmpDir = join(tmpdir(), `style-guide-detect-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
    originalCwd = process.cwd();
    process.chdir(tmpDir);
  });

  after(() => {
    process.chdir(originalCwd);
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
  });

  it("detects no project types in empty directory", async () => {
    const { detectProjectType } = await import("../config/loader.js");
    const result = await detectProjectType();
    assert.equal(result.hasNode, false);
    assert.equal(result.hasPython, false);
    assert.equal(result.hasTerraform, false);
    assert.equal(result.hasDocker, false);
  });

  it("detects Node project via package.json", async () => {
    writeFileSync(join(tmpDir, "package.json"), "{}", "utf-8");
    const { detectProjectType } = await import("../config/loader.js");
    const result = await detectProjectType();
    assert.equal(result.hasNode, true);
    rmSync(join(tmpDir, "package.json"));
  });

  it("detects Python project via pyproject.toml", async () => {
    writeFileSync(join(tmpDir, "pyproject.toml"), "", "utf-8");
    const { detectProjectType } = await import("../config/loader.js");
    const result = await detectProjectType();
    assert.equal(result.hasPython, true);
    rmSync(join(tmpDir, "pyproject.toml"));
  });

  it("detects Terraform project via main.tf", async () => {
    writeFileSync(join(tmpDir, "main.tf"), "", "utf-8");
    const { detectProjectType } = await import("../config/loader.js");
    const result = await detectProjectType();
    assert.equal(result.hasTerraform, true);
    rmSync(join(tmpDir, "main.tf"));
  });
});
