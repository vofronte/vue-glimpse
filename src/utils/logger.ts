/**
 * Global flag for enabling/disabling debug logs.
 * The only place where this value needs to be changed.
 */
export const IS_DEBUG_MODE = true

/**
 * Centralized logging function.
 * Uses prefix for easy search of our logs in console.
 * @param args Arguments for console output.
 */
export function log(...args: any[]) {
  if (IS_DEBUG_MODE) {
    console.log('[VUE_GLIMPSE]', ...args)
  }
}

/**
 * Centralized function for error logging.
 * @param args Arguments for error console output.
 */
export function logError(...args: any[]) {
  console.error('[VUE_GLIMPSE ERROR]', ...args)
}
