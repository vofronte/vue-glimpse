import type { Disposable, ExtensionContext, OutputChannel, StatusBarItem } from 'vscode'
import { commands, StatusBarAlignment, window, workspace } from 'vscode'
import { logError } from '../utils/logger.js'

export type AnalysisState = 'ok' | 'analyzing' | 'error'

interface UpdateStatusPayload {
  state: AnalysisState
  error?: unknown
  documentUri?: string
}

/**
 * Manages the VueGlimpse status bar item and its associated output channel.
 * Encapsulates all UI logic related to providing analysis status feedback.
 */
export class StatusBarManager implements Disposable {
  private statusBarItem: StatusBarItem
  private outputChannel: OutputChannel
  private lastError: string | undefined

  private static readonly EXTENSION_NAME = 'VueGlimpse'
  private static readonly STATUS_BAR_ITEM_NAME = `${StatusBarManager.EXTENSION_NAME} Status`
  private static readonly COMMAND_ID = 'vueGlimpse.showErrorLog'

  // Status bar icons
  private static readonly ICON_OK = '$(check)'
  private static readonly ICON_ANALYZING = '$(sync~spin)'
  private static readonly ICON_ERROR = '$(warning)'

  // Tooltips
  private static readonly TOOLTIP_OK = `${StatusBarManager.EXTENSION_NAME}: Analysis successful.`
  private static readonly TOOLTIP_ANALYZING = `${StatusBarManager.EXTENSION_NAME}: Analyzing...`
  private static readonly TOOLTIP_ERROR = `${StatusBarManager.EXTENSION_NAME}: Analysis failed. Click for details.`

  constructor(context: ExtensionContext) {
    // Create and configure the output channel
    this.outputChannel = window.createOutputChannel(StatusBarManager.EXTENSION_NAME)

    // Register the command to show the error log
    const commandDisposable = commands.registerCommand(StatusBarManager.COMMAND_ID, () => this.showErrorLog())
    context.subscriptions.push(commandDisposable)

    // Create and configure the status bar item
    this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 100)
    this.statusBarItem.name = StatusBarManager.STATUS_BAR_ITEM_NAME

    context.subscriptions.push(this)
  }

  /**
   * Checks if the status bar feature is enabled in the user's settings.
   */
  private isEnabled(): boolean {
    return workspace.getConfiguration('vueGlimpse').get<boolean>('statusBar.enabled') ?? true
  }

  /**
   * Updates the status bar item based on the current analysis state.
   *
   * @param payload An object containing the analysis state and optional error info.
   */
  public updateStatus({ state, error, documentUri }: UpdateStatusPayload): void {
    if (!this.isEnabled()) {
      this.statusBarItem.hide()
      return
    }
    switch (state) {
      case 'ok':
        this.statusBarItem.text = `${StatusBarManager.ICON_OK} ${StatusBarManager.EXTENSION_NAME}`
        this.statusBarItem.tooltip = StatusBarManager.TOOLTIP_OK
        this.statusBarItem.command = undefined // No command on success
        this.lastError = undefined
        break

      case 'analyzing':
        this.statusBarItem.text = `${StatusBarManager.ICON_ANALYZING} ${StatusBarManager.EXTENSION_NAME}`
        this.statusBarItem.tooltip = StatusBarManager.TOOLTIP_ANALYZING
        this.statusBarItem.command = undefined
        break

      case 'error':
        this.statusBarItem.text = `${StatusBarManager.ICON_ERROR} ${StatusBarManager.EXTENSION_NAME}`
        this.statusBarItem.tooltip = StatusBarManager.TOOLTIP_ERROR
        this.statusBarItem.command = StatusBarManager.COMMAND_ID
        this.formatAndSetLastError(error, documentUri)
        break
    }
  }

  /**
   * Formats a raw error into a user-friendly string and stores it.
   */
  private formatAndSetLastError(error: unknown, documentUri?: string): void {
    const timestamp = new Date().toLocaleString()
    let errorMessage: string

    if (error instanceof Error) {
      errorMessage = `${error.name}: ${error.message}`
    }
    else {
      errorMessage = String(error)
    }

    const fileInfo = documentUri ? `File: ${documentUri}\n` : ''
    this.lastError = `[${timestamp}] ${StatusBarManager.EXTENSION_NAME} analysis failed.\n${fileInfo}--------------------------------------------------\n${errorMessage}`

    // Also log it to our debug console for internal diagnostics
    logError(`${StatusBarManager.EXTENSION_NAME} analysis failed:`, error)
  }

  /**
   * Clears the output channel, appends the last recorded error, and shows it.
   */
  private showErrorLog(): void {
    if (this.lastError) {
      this.outputChannel.clear()
      this.outputChannel.appendLine(this.lastError)
      this.outputChannel.show()
    }
  }

  /**
   * Shows the status bar item. Should be called when a Vue file is active.
   */
  public show(): void {
    if (this.isEnabled())
      this.statusBarItem.show()
  }

  /**
   * Hides the status bar item. Should be called when a non-Vue file is active.
   */
  public hide(): void {
    this.statusBarItem.hide()
  }

  /**
   * Disposes of the resources used by the manager.
   */
  public dispose(): void {
    this.statusBarItem.dispose()
    this.outputChannel.dispose()
  }
}
