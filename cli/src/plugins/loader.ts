/**
 * @module plugins/loader
 * @description Plugin loading and management
 * @version 1.0.0
 * @author Tyler Dukes
 */

import { existsSync } from "fs";
import { resolve, join } from "path";
import type { Plugin, PluginConfig, LinterDefinition, RuleDefinition } from "../types.js";
import { registerLinter, type LinterRunner } from "../linters/registry.js";

const loadedPlugins: Map<string, Plugin> = new Map();

/**
 * Load a plugin from a path or package name
 */
export async function loadPlugin(config: PluginConfig): Promise<Plugin> {
  const { name, path: pluginPath, options } = config;

  // Check if already loaded
  if (loadedPlugins.has(name)) {
    return loadedPlugins.get(name)!;
  }

  let resolvedPath: string;

  // Resolve plugin path
  if (pluginPath.startsWith(".") || pluginPath.startsWith("/")) {
    // Local path
    resolvedPath = resolve(process.cwd(), pluginPath);
  } else {
    // Try to resolve as npm package
    try {
      resolvedPath = require.resolve(pluginPath, { paths: [process.cwd()] });
    } catch {
      // Try common plugin locations
      const possiblePaths = [
        join(process.cwd(), "node_modules", pluginPath),
        join(process.cwd(), ".dukestyle", "plugins", pluginPath),
      ];

      const foundPath = possiblePaths.find((p) => existsSync(p));
      if (!foundPath) {
        throw new Error(`Plugin not found: ${pluginPath}`);
      }
      resolvedPath = foundPath;
    }
  }

  // Load plugin module
  const module = await import(resolvedPath);
  const plugin: Plugin = module.default || module;

  // Validate plugin structure
  if (!plugin.name || !plugin.version) {
    throw new Error(`Invalid plugin: ${name} - missing name or version`);
  }

  // Register plugin linters
  if (plugin.linters) {
    for (const linter of plugin.linters) {
      registerPluginLinter(linter, options);
    }
  }

  // Store loaded plugin
  loadedPlugins.set(name, plugin);

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
