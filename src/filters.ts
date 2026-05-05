import * as vscode from 'vscode';
import { EligibleSymbol } from './symbols';
import { ResolvedConfig } from './config';
import { classifyLocation } from './classifier';

export async function applyFilters(
    locations: vscode.Location[],
    symbol: EligibleSymbol,
    config: ResolvedConfig,
    document: vscode.TextDocument
): Promise<vscode.Location[]> {
    const validLocations: vscode.Location[] = [];

    for (const loc of locations) {
        // Filter definitions
        if (config.references.filterDefinitions) {
            // Assume definition if it's the exact same document and within the target's declaration space
            if (loc.uri.toString() === document.uri.toString() &&
                loc.range.intersection(symbol.selectionRange)) {
                continue;
            }
        }

        // Filter self (references inside the symbols' own body block)
        if (config.references.filterSelf) {
            if (loc.uri.toString() === document.uri.toString() &&
                symbol.range.contains(loc.range.start)) {
                continue;
            }
        }

        let isLocImport = false;
        
        // Filter occurrences inside import lines
        if (config.references.filterImports || symbol.kind === 'import') {
            // Check if loc is an import by reading its line
            try {
                // If it's the same document, we can read directly
                let lineText = '';
                if (loc.uri.toString() === document.uri.toString()) {
                    lineText = document.lineAt(loc.range.start.line).text;
                } else {
                    const locDoc = await vscode.workspace.openTextDocument(loc.uri);
                    lineText = locDoc.lineAt(loc.range.start.line).text;
                }
                isLocImport = /^\s*(import|from)\s/.test(lineText);
            } catch (err) {
                // Ignore if we can't open
            }
        }

        if (config.references.filterImports && isLocImport && symbol.kind !== 'import') {
            continue; // Skip because it's an import reference when we don't want them tracked
        }

        // If the symbol itself is an import, check if the resolved location category is permitted
        if (symbol.kind === 'import') {
            const category = classifyLocation(loc);
            if (
                (category === 'project' && !config.targets.imports.project) ||
                (category === 'venv' && !config.targets.imports.venv) ||
                (category === 'stdlib' && !config.targets.imports.stdlib) ||
                (category === 'global' && !config.targets.imports.global)
            ) {
                continue;
            }
        }

        validLocations.push(loc);
    }

    return validLocations;
}
