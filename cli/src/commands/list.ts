/**
 * @module commands/list
 * @description List command implementation
 * @version 1.0.0
 * @author Tyler Dukes
 */

import ora from "ora";
import { checkLinterAvailability, getAllLinters } from "../linters/registry.js";
import { formatLinterList } from "../output/formatter.js";
import type { ListOptions, Language } from "../types.js";

/**
 * List command - shows available linters
 */
export async function listCommand(options: ListOptions): Promise<void> {
  const spinner = ora("Checking linter availability...").start();

  try {
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
    const formatted = formatLinterList(linterInfo, options.format);
    console.log(formatted);
  } catch (error) {
    spinner.fail(
      `List failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    process.exit(1);
  }
}
