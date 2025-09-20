import type { WorkspaceConfiguration } from 'vscode'
import type { IdentifierCategoryKey } from './parser/types.js'
import { workspace } from 'vscode'
import { DEFAULT_CATEGORY_COLORS, DEFAULT_CATEGORY_ICONS, generateColorMap, generateIconMap } from './categoryConfig.js'

/**
 * Retrieves the icon override configuration from the VS Code workspace settings.
 *
 * @returns An object containing user-defined icon overrides.
 */
function getIconOverrides(): Record<string, string> {
  const config: WorkspaceConfiguration = workspace.getConfiguration('vueGlimpse')
  return config.get<Record<string, string>>('icons.override') || {}
}

/**
 * Retrieves the color override configuration from the VS Code workspace settings.
 *
 * @returns An object containing user-defined color overrides.
 */
function getColorOverrides(): Record<string, string> {
  const config: WorkspaceConfiguration = workspace.getConfiguration('vueGlimpse')
  return config.get<Record<string, string>>('colors.override') || {}
}

/**
 * Generates the final, active icon map by merging the default icons
 * with any user-defined overrides from the workspace configuration.
 * This is the function that the rest of the extension should call.
 *
 * @returns A complete mapping of category keys to their icon strings.
 */
export function getIconMap(): Record<IdentifierCategoryKey, string> {
  const overrides = getIconOverrides()
  return generateIconMap(DEFAULT_CATEGORY_ICONS, overrides)
}

/**
 * Generates the final, active color map by merging the default colors
 * with any user-defined overrides from the workspace configuration.
 *
 * @returns A complete mapping of category keys to their color strings.
 */
export function getColorMap(): Record<IdentifierCategoryKey, string> {
  const overrides = getColorOverrides()
  return generateColorMap(DEFAULT_CATEGORY_COLORS, overrides)
}
