/**
 * @module types
 * @description TypeScript type definitions for the CLI
 * @version 1.0.0
 * @author Tyler Dukes
 */

export type Language =
  | "python"
  | "typescript"
  | "javascript"
  | "bash"
  | "powershell"
  | "terraform"
  | "hcl"
  | "yaml"
  | "json"
  | "markdown"
  | "dockerfile"
  | "sql"
  | "ansible"
  | "kubernetes"
  | "makefile"
  | "groovy";

export type OutputFormat = "text" | "json" | "sarif";

export type Severity = "error" | "warning" | "info";

export interface LintResult {
  file: string;
  language: Language;
  issues: LintIssue[];
  fixable: number;
  fixed?: number;
}

export interface LintIssue {
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  message: string;
  rule: string;
  severity: Severity;
  fixable: boolean;
  source?: string;
}

export interface LintSummary {
  files: number;
  errors: number;
  warnings: number;
  fixable: number;
  fixed?: number;
  duration: number;
}

export interface LintOutput {
  results: LintResult[];
  summary: LintSummary;
}

export interface LinterConfig {
  enabled: boolean;
  command?: string;
  args?: string[];
  configFile?: string;
  extensions?: string[];
}

export interface LanguageConfig {
  enabled: boolean;
  linters: Record<string, LinterConfig>;
  extensions: string[];
  formatters?: string[];
}

export interface PluginConfig {
  name: string;
  path: string;
  options?: Record<string, unknown>;
}

export interface StyleGuideConfig {
  extends?: string[];
  languages: Partial<Record<Language, LanguageConfig>>;
  plugins?: PluginConfig[];
  ignore?: string[];
  cache?: boolean;
  cacheLocation?: string;
  rules?: Record<string, unknown>;
}

export interface CheckOptions {
  format: OutputFormat;
  language?: string;
  strict?: boolean;
  fix?: boolean;
  cache?: boolean;
  quiet?: boolean;
}

export interface FixOptions {
  language?: string;
  dryRun?: boolean;
  format: OutputFormat;
}

export interface InitOptions {
  force?: boolean;
  template: "minimal" | "standard" | "strict";
}

export interface ListOptions {
  language?: string;
  format: OutputFormat;
}

export interface LinterInfo {
  name: string;
  language: Language;
  description: string;
  installed: boolean;
  version?: string;
  command: string;
  configFiles: string[];
  canFix: boolean;
}

export interface Plugin {
  name: string;
  version: string;
  linters?: LinterDefinition[];
  rules?: RuleDefinition[];
}

export interface LinterDefinition {
  name: string;
  language: Language;
  check: (files: string[], config: LinterConfig) => Promise<LintResult[]>;
  fix?: (files: string[], config: LinterConfig) => Promise<LintResult[]>;
}

export interface RuleDefinition {
  name: string;
  description: string;
  language: Language;
  check: (content: string, file: string) => LintIssue[];
}
