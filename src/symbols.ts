import * as vscode from 'vscode';
import { ResolvedConfig } from './config';
import { isLineAnImport } from './importDetector';

export interface EligibleSymbol {
    kind: 'class' | 'method' | 'function' | 'moduleVar' | 'import' | 'class-impl';
    name: string;
    range: vscode.Range;
    selectionRange: vscode.Range;
    symbol: vscode.DocumentSymbol;
}

export async function getEligibleSymbols(
    document: vscode.TextDocument,
    config: ResolvedConfig
): Promise<EligibleSymbol[]> {
    const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
        'vscode.executeDocumentSymbolProvider',
        document.uri
    );

    if (!symbols) {
        return [];
    }

    const eligibleSymbols: EligibleSymbol[] = [];

    function traverse(syms: vscode.DocumentSymbol[], isTopLevel: boolean, inClass: boolean) {
        for (const sym of syms) {
            // Imports (detected via line text) — catches all symbol kinds on import lines
            if (isTopLevel && isLineAnImport(document, sym.range.start.line)) {
                if (config.targets.imports.global || config.targets.imports.project || config.targets.imports.stdlib || config.targets.imports.venv) {
                    eligibleSymbols.push({
                        kind: 'import',
                        name: sym.name,
                        range: sym.range,
                        selectionRange: sym.selectionRange,
                        symbol: sym
                    });
                }
                continue; // Do not traverse children of imports
            }

            // Classes
            if (sym.kind === vscode.SymbolKind.Class && config.targets.classes) {
                eligibleSymbols.push({
                    kind: 'class',
                    name: sym.name,
                    range: sym.range,
                    selectionRange: sym.selectionRange,
                    symbol: sym
                });
            }

            // Methods (Functions in Class)
            if (sym.kind === vscode.SymbolKind.Function && inClass && config.targets.methods) {
                eligibleSymbols.push({
                    kind: 'method',
                    name: sym.name,
                    range: sym.range,
                    selectionRange: sym.selectionRange,
                    symbol: sym
                });
            }

            // Top-level Functions
            if (sym.kind === vscode.SymbolKind.Function && !inClass && isTopLevel && config.targets.functions) {
                eligibleSymbols.push({
                    kind: 'function',
                    name: sym.name,
                    range: sym.range,
                    selectionRange: sym.selectionRange,
                    symbol: sym
                });
            }

            // Top-level variables
            if ((sym.kind === vscode.SymbolKind.Variable || sym.kind === vscode.SymbolKind.Constant) &&
                isTopLevel && config.targets.moduleVariables) {
                eligibleSymbols.push({
                    kind: 'moduleVar',
                    name: sym.name,
                    range: sym.range,
                    selectionRange: sym.selectionRange,
                    symbol: sym
                });
            }

            if (sym.children && sym.children.length > 0) {
                traverse(sym.children, false, sym.kind === vscode.SymbolKind.Class || inClass);
            }
        }
    }

    traverse(symbols, true, false);

    return eligibleSymbols;
}
