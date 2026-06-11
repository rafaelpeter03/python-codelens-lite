import * as vscode from 'vscode';
import { isImportCategoryEnabled, ResolvedConfig } from './config';
import { Category, classifyUri } from './classifier';
import { isLineAnImport } from './importDetector';

export interface EligibleSymbol {
    kind: 'class' | 'method' | 'function' | 'moduleVar' | 'import' | 'class-impl';
    name: string;
    range: vscode.Range;
    selectionRange: vscode.Range;
    symbol: vscode.DocumentSymbol;
    importCategory?: Category;
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
    const importsEnabled = config.targets.imports.global ||
        config.targets.imports.project ||
        config.targets.imports.stdlib ||
        config.targets.imports.venv;

    async function traverse(syms: vscode.DocumentSymbol[], isTopLevel: boolean, inClass: boolean): Promise<void> {
        for (const sym of syms) {
            if (isTopLevel && isLineAnImport(document, sym.range.start.line)) {
                if (importsEnabled) {
                    const importCategory = await resolveImportCategory(document.uri, sym.selectionRange.start);
                    if (isImportCategoryEnabled(importCategory, config)) {
                        eligibleSymbols.push({
                            kind: 'import',
                            name: sym.name,
                            range: sym.range,
                            selectionRange: sym.selectionRange,
                            symbol: sym,
                            importCategory
                        });
                    }
                }
                continue;
            }

            if (sym.kind === vscode.SymbolKind.Class && config.targets.classes) {
                eligibleSymbols.push({
                    kind: 'class',
                    name: sym.name,
                    range: sym.range,
                    selectionRange: sym.selectionRange,
                    symbol: sym
                });
            }

            if ((sym.kind === vscode.SymbolKind.Method || sym.kind === vscode.SymbolKind.Function) &&
                inClass && config.targets.methods) {
                eligibleSymbols.push({
                    kind: 'method',
                    name: sym.name,
                    range: sym.range,
                    selectionRange: sym.selectionRange,
                    symbol: sym
                });
            }

            if (sym.kind === vscode.SymbolKind.Function && !inClass && isTopLevel && config.targets.functions) {
                eligibleSymbols.push({
                    kind: 'function',
                    name: sym.name,
                    range: sym.range,
                    selectionRange: sym.selectionRange,
                    symbol: sym
                });
            }

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
                await traverse(sym.children, false, sym.kind === vscode.SymbolKind.Class || inClass);
            }
        }
    }

    await traverse(symbols, true, false);

    return eligibleSymbols;
}

async function resolveImportCategory(uri: vscode.Uri, position: vscode.Position): Promise<Category> {
    try {
        const definitions = await vscode.commands.executeCommand<Array<vscode.Location | vscode.LocationLink>>(
            'vscode.executeDefinitionProvider',
            uri,
            position
        ) || [];

        const definition = definitions[0];
        if (!definition) {
            return 'global';
        }

        return classifyUri('targetUri' in definition ? definition.targetUri : definition.uri);
    } catch {
        return 'global';
    }
}
