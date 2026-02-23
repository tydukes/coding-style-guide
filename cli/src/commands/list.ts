/**
 * @module commands/list
 * @description List command implementation
 * @version 1.0.0
 * @author Tyler Dukes
 */

import ora from "ora";
import { checkLinterAvailability, getAllLinters } from "../linters/registry.js";
import { formatLinterList } from "../output/formatter.js";
import { loadPlugins } from "../plugins/loader.js";
import { loadConfig } from "../config/loader.js";
import type { ListOptions, Language } from "../types.js";

/**
 * List command - shows available linters
 */
export async function listCommand(options: ListOptions): Promise<void> {
  const spinner = ora("Checking linter availability...").start();

  try {
    // Load config to get plugin list
    const parentOpts = options as unknown as { parent?: { config?: string; color?: boolean } };
    const noColor = parentOpts.parent?.color === false;
    const config = await loadConfig(parentOpts.parent?.config);

    // Load plugins so plugin linters appear in the list
    if (config.plugins?.length) {
      await loadPlugins(config.plugins);
    }

    // Check availability of all linters
    const linterInfo = await checkLinterAvailability();

    // Filter by language if specified
    if (options.language) {
      const lang = options.language as Language;
      for (const [name, info] of linterInfo) {
        if (info.language !== lang) {
          linterInfo.delete(name);
        }
      }
    }

    spinner.stop();

    // Format and output
    const formatted = formatLinterList(linterInfo, options.format, { noColor });
    console.log(formatted);
  } catch (error) {
    spinner.fail(
      `List failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    process.exit(1);
  }
}
