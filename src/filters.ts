import * as vscode from 'vscode';
import { EligibleSymbol } from './symbols';
import { isImportCategoryEnabled, ResolvedConfig } from './config';
import { classifyLocation } from './classifier';
import { isInitPy } from './pythonFiles';

export async function applyFilters(
    locations: vscode.Location[],
    symbol: EligibleSymbol,
    config: ResolvedConfig,
    document: vscode.TextDocument,
    docCache: Map<string, vscode.TextDocument> = new Map()
): Promise<vscode.Location[]> {
    const validLocations: vscode.Location[] = [];

    if (!docCache.has(document.uri.toString())) {
        docCache.set(document.uri.toString(), document);
    }

    for (const loc of locations) {
        if (!config.files.includeInitPy && isInitPy(loc.uri)) {
            continue;
        }

        if (config.references.filterDefinitions &&
            loc.uri.toString() === document.uri.toString() &&
            loc.range.intersection(symbol.selectionRange)) {
            continue;
        }

        if (config.references.filterSelf &&
            loc.uri.toString() === document.uri.toString() &&
            symbol.range.contains(loc.range.start)) {
            continue;
        }

        let isLocImport = false;

        if (config.references.filterImports || symbol.kind === 'import') {
            try {
                const key = loc.uri.toString();
                let locDoc = docCache.get(key);
                if (!locDoc) {
                    locDoc = await vscode.workspace.openTextDocument(loc.uri);
                    docCache.set(key, locDoc);
                }
                const lineText = locDoc.lineAt(loc.range.start.line).text;
                isLocImport = /^\s*(import|from)\s/.test(lineText);
            } catch {
                // Ignore locations that cannot be opened.
            }
        }

        if (config.references.filterImports && isLocImport && symbol.kind !== 'import') {
            continue;
        }

        if (symbol.kind === 'import') {
            const category = symbol.importCategory ?? classifyLocation(loc);
            if (!isImportCategoryEnabled(category, config)) {
                continue;
            }
        }

        validLocations.push(loc);
    }

    return validLocations;
}
