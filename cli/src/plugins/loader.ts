/**
 * @module plugins/loader
 * @description Plugin loading and management
 * @version 1.0.0
 * @author Tyler Dukes
 */

import { existsSync, realpathSync } from "fs";
import { resolve, join, normalize, isAbsolute } from "path";
import type { Plugin, PluginConfig, LinterDefinition } from "../types.js";
import { registerLinter, type LinterRunner } from "../linters/registry.js";

const loadedPlugins: Map<string, Plugin> = new Map();

/**
 * Validate that a resolved path is within allowed directories.
 * Security: Prevents path traversal attacks by ensuring plugins
 * are loaded only from trusted locations.
 */
function validatePluginPath(resolvedPath: string): void {
  const cwd = process.cwd();
  const allowedRoots = [
    join(cwd, "node_modules"),
    join(cwd, ".dukestyle", "plugins"),
    join(cwd, "plugins"),
  ];

  // Normalize and resolve to real path to prevent symlink attacks
  let realPath: string;
  try {
    realPath = realpathSync(resolvedPath);
  } catch {
    // File doesn't exist yet, use normalized path
    realPath = normalize(resolvedPath);
  }

  // Check if path is within allowed directories or is a direct child of cwd
  const isAllowed = allowedRoots.some((root) => realPath.startsWith(root)) ||
    (realPath.startsWith(cwd) && !realPath.includes(".."));

  if (!isAllowed) {
    throw new Error(
      `Plugin path not allowed: ${resolvedPath}. ` +
      `Plugins must be in node_modules, .dukestyle/plugins, or plugins directory.`
    );
  }
}

/**
 * Sanitize plugin name to prevent injection attacks.
 * Only allows alphanumeric characters, hyphens, underscores, and scoped packages.
 */
function sanitizePluginName(name: string): string {
  // Allow scoped packages (@org/package) and standard names
  const sanitized = name.replace(/[^a-zA-Z0-9@/_-]/g, "");
  if (sanitized !== name) {
    throw new Error(`Invalid plugin name: ${name}. Contains disallowed characters.`);
  }
  return sanitized;
}

/**
 * Load a plugin from a path or package name.
 * Security: Validates paths and names to prevent code injection.
 */
export async function loadPlugin(config: PluginConfig): Promise<Plugin> {
  const { name, path: pluginPath, options } = config;

  // Sanitize plugin name
  const safeName = sanitizePluginName(name);

  // Check if already loaded
  if (loadedPlugins.has(safeName)) {
    return loadedPlugins.get(safeName)!;
  }

  let resolvedPath: string;
  const cwd = process.cwd();

  // Resolve plugin path with security checks
  if (pluginPath.startsWith("./") || pluginPath.startsWith("../")) {
    // Relative path - resolve from cwd
    resolvedPath = resolve(cwd, pluginPath);
  } else if (isAbsolute(pluginPath)) {
    // Absolute paths are not allowed for security
    throw new Error(
      `Absolute plugin paths not allowed: ${pluginPath}. ` +
      `Use relative paths or package names.`
    );
  } else {
    // Package name - look in standard locations only
    const possiblePaths = [
      join(cwd, "node_modules", pluginPath),
      join(cwd, ".dukestyle", "plugins", pluginPath),
    ];

    const foundPath = possiblePaths.find((p) => existsSync(p));
    if (!foundPath) {
      throw new Error(`Plugin not found: ${pluginPath}`);
    }
    resolvedPath = foundPath;
  }

  // Validate the resolved path is in an allowed location
  validatePluginPath(resolvedPath);

  // Load plugin module (path has been validated)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const module = await import(resolvedPath);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const plugin: Plugin = module.default || module;

  // Validate plugin structure
  if (!plugin.name || !plugin.version) {
    throw new Error(`Invalid plugin: ${safeName} - missing name or version`);
  }

  // Register plugin linters
  if (plugin.linters) {
    for (const linter of plugin.linters) {
      registerPluginLinter(linter, options);
    }
  }

  // Store loaded plugin
  loadedPlugins.set(safeName, plugin);

  return plugin;
}

/**
 * Load all plugins from configuration
 */
export async function loadPlugins(configs: PluginConfig[]): Promise<Plugin[]> {
  const plugins: Plugin[] = [];

  for (const config of configs) {
    try {
      const plugin = await loadPlugin(config);
      plugins.push(plugin);
    } catch (error) {
      console.warn(
        `Failed to load plugin ${config.name}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  return plugins;
}

/**
 * Register a plugin linter with the linter registry
 */
function registerPluginLinter(
  linter: LinterDefinition,
  options?: Record<string, unknown>
): void {
  const runner: LinterRunner = {
    info: {
      name: linter.name,
      language: linter.language,
      description: `Plugin linter: ${linter.name}`,
      installed: true,
      command: "plugin",
      configFiles: [],
      canFix: !!linter.fix,
    },
    async check(files, config) {
      return linter.check(files, { ...config, ...options });
    },
    fix: linter.fix
      ? async (files, config) => {
          return linter.fix!(files, { ...config, ...options });
        }
      : undefined,
  };

  registerLinter(linter.name, runner);
}

/**
 * Get all loaded plugins
 */
export function getLoadedPlugins(): Map<string, Plugin> {
  return loadedPlugins;
}

/**
 * Create a plugin template
 */
export function createPluginTemplate(name: string): string {
  return `/**
 * @module ${name}
 * @description Custom style guide plugin
 * @version 1.0.0
 */

/**
 * Plugin definition
 * @type {import('@dukes/style-guide-cli').Plugin}
 */
export default {
  name: '${name}',
  version: '1.0.0',

  /**
   * Custom linters provided by this plugin
   */
  linters: [
    {
      name: '${name}-linter',
      language: 'python', // Change to your target language

      /**
       * Check files for issues
       * @param {string[]} files - Files to check
       * @param {object} config - Linter configuration
       * @returns {Promise<import('@dukes/style-guide-cli').LintResult[]>}
       */
      async check(files, config) {
        const results = [];

        for (const file of files) {
          // Implement your custom check logic here
          results.push({
            file,
            language: 'python',
            issues: [],
            fixable: 0,
          });
        }

        return results;
      },

      /**
       * Fix issues in files (optional)
       * @param {string[]} files - Files to fix
       * @param {object} config - Linter configuration
       * @returns {Promise<import('@dukes/style-guide-cli').LintResult[]>}
       */
      async fix(files, config) {
        const results = [];

        for (const file of files) {
          // Implement your custom fix logic here
          results.push({
            file,
            language: 'python',
            issues: [],
            fixable: 0,
            fixed: 0,
          });
        }

        return results;
      },
    },
  ],

  /**
   * Custom rules provided by this plugin (optional)
   */
  rules: [
    {
      name: '${name}/custom-rule',
      description: 'Example custom rule',
      language: 'python',

      /**
       * Check content for rule violations
       * @param {string} content - File content
       * @param {string} file - File path
       * @returns {import('@dukes/style-guide-cli').LintIssue[]}
       */
      check(content, file) {
        const issues = [];

        // Implement your custom rule logic here
        // Example: Check for TODO comments
        const lines = content.split('\\n');
        lines.forEach((line, index) => {
          if (line.includes('TODO')) {
            issues.push({
              line: index + 1,
              column: line.indexOf('TODO') + 1,
              message: 'TODO comment found',
              rule: '${name}/custom-rule',
              severity: 'info',
              fixable: false,
            });
          }
        });

        return issues;
      },
    },
  ],
};
`;
}
