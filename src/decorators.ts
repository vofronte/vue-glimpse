import * as vscode from 'vscode'

export const propDecorationType = vscode.window.createTextEditorDecorationType({
  after: { contentText: '℗', margin: '0 0 0 1.5px', color: new vscode.ThemeColor('gitDecoration.modifiedResourceForeground') },
})

export const localStateDecorationType = vscode.window.createTextEditorDecorationType({
  after: { contentText: '•', margin: '0 0 0 1.5px', color: new vscode.ThemeColor('editorHint.foreground') },
})

export const refDecorationType = vscode.window.createTextEditorDecorationType({
  after: { contentText: '🔹', margin: '0 0 0 1.5px', color: new vscode.ThemeColor('gitDecoration.renamedResourceForeground') },
})

export const reactiveDecorationType = vscode.window.createTextEditorDecorationType({
  after: { contentText: '🔷', margin: '0 0 0 1.5px', color: new vscode.ThemeColor('gitDecoration.renamedResourceForeground') },
})

export const computedDecorationType = vscode.window.createTextEditorDecorationType({
  after: { contentText: '⚡', margin: '0 0 0 1.5px', color: new vscode.ThemeColor('gitDecoration.renamedResourceForeground') },
})

export const methodDecorationType = vscode.window.createTextEditorDecorationType({
  after: { contentText: 'ƒ', margin: '0 0 0 1.5px', color: new vscode.ThemeColor('gitDecoration.untrackedResourceForeground') },
})

export const storeDecorationType = vscode.window.createTextEditorDecorationType({
  after: { contentText: '📦', margin: '0 0 0 1.5px', color: new vscode.ThemeColor('gitDecoration.conflictingResourceForeground') },
})
