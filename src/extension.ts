import * as vscode from 'vscode';
import { propDecorationType, localStateDecorationType, computedDecorationType, methodDecorationType, storeDecorationType } from './decorators';
import { analyzeVueFile } from './parser/';
import { log } from './utils/logger';

// Переменная для хранения активного редактора.
let activeEditor = vscode.window.activeTextEditor;
// Переменная для таймера debounce.
let timeout: NodeJS.Timeout | undefined = undefined;

/**
 * Главная функция активации расширения. Вызывается при первом открытии .vue файла.
 */
export function activate(context: vscode.ExtensionContext) {
    log('Vue Origin Lens is now active!');

    // --- Настройка подписчиков на события ---

    // 1. Когда пользователь меняет активную вкладку (редактор)
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            activeEditor = editor;
            if (editor) {
                // Запускаем обновление с задержкой, чтобы не было "мелькания"
                triggerUpdateDecorations();
            }
        })
    );

    // 2. Когда пользователь печатает в документе
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            // Обновляем только если изменения произошли в активном редакторе
            if (activeEditor && event.document === activeEditor.document) {
                triggerUpdateDecorations();
            }
        })
    );

    // --- Логика обновления декораций ---

    /**
     * "Debouncer": запускает `updateDecorations` не на каждое нажатие клавиши,
     * а только после небольшой паузы, чтобы не нагружать систему.
     */
    function triggerUpdateDecorations() {
        if (timeout) {
            clearTimeout(timeout);
            timeout = undefined;
        }
        // Задержка в 300ms — хороший баланс между отзывчивостью и производительностью.
        timeout = setTimeout(updateDecorations, 300);
    }
    
    /**
     * Основная "рабочая" функция: анализирует код и применяет стили.
     */
    function updateDecorations() {
    if (!activeEditor) {
        return;
    }

    if (activeEditor.document.languageId !== 'vue') {
        // Очищаем ВСЕ типы декораций
        activeEditor.setDecorations(propDecorationType, []);
        activeEditor.setDecorations(localStateDecorationType, []);
        activeEditor.setDecorations(computedDecorationType, []);
        activeEditor.setDecorations(methodDecorationType, []);
        activeEditor.setDecorations(storeDecorationType, []);
        return;
    }
    
    log(`Analyzing ${activeEditor.document.fileName}...`); // <--- ИСПОЛЬЗУЕМ log
    const code = activeEditor.document.getText();
    
    // Получаем расширенный результат от парсера
    const { propRanges, localStateRanges, computedRanges, methodRanges, storeRanges } = analyzeVueFile(code, activeEditor.document);

    log(` > Found ${propRanges.length} props, ${localStateRanges.length} locals, ${computedRanges.length} computed, ${methodRanges.length} methods, ${storeRanges.length} from store.`); // <--- ИСПОЛЬЗУЕМ log
    
    // Применяем ВСЕ типы декораторов
    activeEditor.setDecorations(propDecorationType, propRanges);
    activeEditor.setDecorations(localStateDecorationType, localStateRanges);
    activeEditor.setDecorations(computedDecorationType, computedRanges);
    activeEditor.setDecorations(methodDecorationType, methodRanges);
    activeEditor.setDecorations(storeDecorationType, storeRanges); 
}

    // --- Первичный запуск ---
    // Если при активации расширения уже открыт какой-то редактор, запускаем анализ.
    if (activeEditor) {
        triggerUpdateDecorations();
    }
}

/**
 * Функция деактивации. Вызывается при выключении VS Code или расширения.
 */
export function deactivate() {}