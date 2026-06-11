import * as vscode from 'vscode';
import { PythonCodeLensProvider } from './provider';
import { invalidateConfigCache, getConfig } from './config';
import { invalidateClassificationCache } from './classifier';

const debouncers = new Map<string, NodeJS.Timeout>();

export function activate(context: vscode.ExtensionContext) {
    const provider = new PythonCodeLensProvider();

    // Register CodeLens standard provider for python text files
    const codeLensProvider = vscode.languages.registerCodeLensProvider(
        { language: 'python', scheme: 'file' },
        provider
    );
    context.subscriptions.push(codeLensProvider, provider);

    // Register Commands
    context.subscriptions.push(
        vscode.commands.registerCommand('pythonCodeLensLite.toggle', async () => {
            const config = vscode.workspace.getConfiguration('pythonCodeLensLite');
            const current = config.get<boolean>('enable');
            await config.update('enable', !current, vscode.ConfigurationTarget.Global);
            provider.refresh();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('pythonCodeLensLite.refresh', () => {
            provider.refresh();
        })
    );

    // Watch Configurations
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('pythonCodeLensLite')) {
                invalidateConfigCache();
                provider.refresh();
            }
        })
    );

    // Watch Documents
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument((e) => {
            if (e.document.languageId !== 'python') {
                return;
            }

            const key = e.document.uri.toString();
            const config = getConfig(e.document.uri);
            const existing = debouncers.get(key);
            if (existing) {
                clearTimeout(existing);
            }
            const timer = setTimeout(() => {
                debouncers.delete(key);
                provider.refresh();
            }, config.performance.debounceMs);
            debouncers.set(key, timer);
        })
    );

    // Clean up debouncers when documents close
    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument((doc) => {
            const key = doc.uri.toString();
            const timer = debouncers.get(key);
            if (timer) {
                clearTimeout(timer);
                debouncers.delete(key);
            }
            invalidateConfigCache(doc.uri);
        })
    );

    // Watch Folders
    context.subscriptions.push(
        vscode.workspace.onDidChangeWorkspaceFolders(() => {
            invalidateClassificationCache();
            provider.refresh();
        })
    );
}

export function deactivate() {
    for (const timer of debouncers.values()) {
        clearTimeout(timer);
    }
    debouncers.clear();
}
