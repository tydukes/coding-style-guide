/**
 * @module version
 * @description Version constant for the CLI — read from package.json at runtime
 * @version 1.0.0
 * @author Tyler Dukes
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pkg = require("../package.json") as { version: string };
export const VERSION: string = pkg.version;
