import * as vscode from 'vscode';
import { PythonCodeLensProvider } from './provider';
import { invalidateConfigCache, getConfig } from './config';
import { invalidateClassificationCache } from './classifier';

let debouncer: NodeJS.Timeout | undefined;

export function activate(context: vscode.ExtensionContext) {
    const provider = new PythonCodeLensProvider();

    // Register CodeLens standard provider for python text files
    const codeLensProvider = vscode.languages.registerCodeLensProvider(
        { language: 'python', scheme: 'file' },
        provider
    );
    context.subscriptions.push(codeLensProvider);

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
            
            const config = getConfig(e.document.uri);
            if (debouncer) {
                clearTimeout(debouncer);
            }
            debouncer = setTimeout(() => {
                provider.refresh();
            }, config.performance.debounceMs);
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
    if (debouncer) {
        clearTimeout(debouncer);
    }
}
