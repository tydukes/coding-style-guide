/**
 * @module commands/init
 * @description Init command implementation
 * @version 1.0.0
 * @author Tyler Dukes
 */

import { writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import ora from "ora";
import chalk from "chalk";
import { stringify } from "yaml";
import { detectProjectType, getDefaultConfig } from "../config/loader.js";
import { formatInitSuccess } from "../output/formatter.js";
import type { InitOptions, StyleGuideConfig } from "../types.js";

/**
 * Configuration templates
 */
const TEMPLATES: Record<string, Partial<StyleGuideConfig>> = {
  minimal: {
    languages: {
      python: {
        enabled: true,
        extensions: [".py"],
        linters: {
          black: { enabled: true },
        },
      },
      typescript: {
        enabled: true,
        extensions: [".ts", ".tsx", ".js", ".jsx"],
        linters: {
          eslint: { enabled: true },
        },
      },
    },
    ignore: ["**/node_modules/**", "**/.git/**", "**/dist/**"],
  },
  standard: getDefaultConfig(),
  strict: {
    ...getDefaultConfig(),
    languages: {
      ...getDefaultConfig().languages,
      python: {
        enabled: true,
        extensions: [".py", ".pyi"],
        linters: {
          black: { enabled: true },
          flake8: { enabled: true },
        },
      },
      typescript: {
        enabled: true,
        extensions: [".ts", ".tsx", ".js", ".jsx"],
        linters: {
          eslint: { enabled: true },
          prettier: { enabled: true },
        },
      },
      terraform: {
        enabled: true,
        extensions: [".tf", ".tfvars"],
        linters: {
          "terraform-fmt": { enabled: true },
        },
      },
    },
  },
};

/**
 * Init command - creates configuration file
 */
export async function initCommand(options: InitOptions): Promise<void> {
  const spinner = ora("Detecting project type...").start();

  try {
    const parentOpts = options as unknown as { parent?: { color?: boolean } };
    const noColor = parentOpts.parent?.color === false;
    const configPath = join(process.cwd(), ".devops-style.yaml");

    // Check if config already exists
    if (existsSync(configPath) && !options.force) {
      spinner.fail(
        `Configuration file already exists: ${configPath}\nUse --force to overwrite`
      );
      process.exit(1);
    }

    // Detect project type
    const projectType = await detectProjectType();
    spinner.text = "Generating configuration...";

    // Get base template
    let config = TEMPLATES[options.template] || TEMPLATES.standard;

    // Customize based on detected project type
    if (!projectType.hasPython && config.languages?.python) {
      config = {
        ...config,
        languages: {
          ...config.languages,
          python: { ...config.languages.python, enabled: false },
        },
      };
    }

    if (!projectType.hasNode && config.languages?.typescript) {
      config = {
        ...config,
        languages: {
          ...config.languages,
          typescript: { ...config.languages.typescript, enabled: false },
        },
      };
    }

    if (!projectType.hasTerraform && config.languages?.terraform) {
      config = {
        ...config,
        languages: {
          ...config.languages,
          terraform: { ...config.languages.terraform, enabled: false },
        },
      };
    }

    if (!projectType.hasDocker && config.languages?.dockerfile) {
      config = {
        ...config,
        languages: {
          ...config.languages,
          dockerfile: { ...config.languages.dockerfile, enabled: false },
        },
      };
    }

    // Write configuration file
    const yamlContent = generateYamlConfig(config);
    await writeFile(configPath, yamlContent, "utf-8");

    spinner.stop();
    console.log(formatInitSuccess(configPath, options.template, { noColor }));
  } catch (error) {
    spinner.fail(
      `Init failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    process.exit(1);
  }
}

/**
 * Generate YAML configuration with comments
 */
function generateYamlConfig(config: Partial<StyleGuideConfig>): string {
  const header = `# DevOps Engineering Style Guide Configuration
# https://tydukes.github.io/coding-style-guide/
#
# Run 'devops-style check' to validate your code
# Run 'devops-style fix' to auto-fix issues
# Run 'devops-style list' to see available linters

`;

  const yamlBody = stringify(config, {
    indent: 2,
    lineWidth: 100,
  });

  return header + yamlBody;
}
