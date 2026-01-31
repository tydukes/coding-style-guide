#!/usr/bin/env node

/**
 * @module dukes-style-cli
 * @description CLI entry point for The Dukes Engineering Style Guide
 * @version 1.0.0
 * @author Tyler Dukes
 */

import('../dist/index.js').catch((err) => {
  console.error('Failed to load CLI:', err.message);
  process.exit(1);
});
