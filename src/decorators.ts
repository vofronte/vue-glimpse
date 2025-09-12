import * as vscode from 'vscode';

/**
 * Декоратор для Props.
 * Символ '℗' (P inside a circle) - стандартный символ для 'Prescription', но хорошо подходит для Props.
 * Цвет взят от измененных файлов в git — он заметный, но не раздражающий.
 */
export const propDecorationType = vscode.window.createTextEditorDecorationType({
    after: {
        contentText: '℗',
        margin: '0 0 0 1.5px', // Небольшой отступ для читаемости
        // Цвет, который используют для измененных файлов, хорошо виден в большинстве тем
        color: new vscode.ThemeColor('gitDecoration.modifiedResourceForeground')
    }
});

/**
 * Декоратор для Локального состояния.
 * Символ '•' (bullet point) - простой и минималистичный.
 * Цвет взят от инлайновых подсказок редактора — он не отвлекает и адаптируется под тему.
 */
export const localStateDecorationType = vscode.window.createTextEditorDecorationType({
    after: {
        contentText: '•',
        margin: '0 0 0 1.5px',
        // Цвет, который используется для инлайновых подсказок, идеально подходит
        color: new vscode.ThemeColor('editorHint.foreground')
    }
});

/**
 * Декоратор для Computed properties (`⚡`).
 * Используем символ молнии. Цвет взят от "переименованных" файлов в git,
 * обычно это синий или фиолетовый, что хорошо ассоциируется с "производными" данными.
 */
export const computedDecorationType = vscode.window.createTextEditorDecorationType({
    after: {
        contentText: '⚡',
        margin: '0 0 0 1.5px',
        color: new vscode.ThemeColor('gitDecoration.renamedResourceForeground')
    }
});

/**
 * Декоратор для Methods/Functions (`ƒ`).
 * Используем символ "ƒ". Цвет взят от "новых" файлов в git,
 * обычно это зеленый, что хорошо ассоциируется с "действиями".
 */
export const methodDecorationType = vscode.window.createTextEditorDecorationType({
    after: {
        contentText: 'ƒ',
        margin: '0 0 0 1.5px',
        color: new vscode.ThemeColor('gitDecoration.untrackedResourceForeground')
    }
});

/**
 * Декоратор для Store (`📦`).
 * Используем символ коробки. Цвет взят от "конфликтующих" файлов в git,
 * обычно это оранжевый/желтый, что хорошо выделяет важные глобальные данные.
 */
export const storeDecorationType = vscode.window.createTextEditorDecorationType({
    after: {
        contentText: '📦',
        margin: '0 0 0 1.5px',
        color: new vscode.ThemeColor('gitDecoration.conflictingResourceForeground')
    }
});