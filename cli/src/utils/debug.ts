/**
 * @module utils/debug
 * @description Conditional debug logger — writes to stderr when debug mode is enabled
 * @version 1.0.0
 * @author Tyler Dukes
 */

let _debugEnabled = false;

export function setDebug(enabled: boolean): void {
  _debugEnabled = enabled;
}

export function debug(msg: string, ...args: unknown[]): void {
  if (_debugEnabled) {
    console.error(`[debug] ${msg}`, ...args);
  }
}
