import * as vscode from 'vscode';
import { getConfig } from './config';
import { getEligibleSymbols, EligibleSymbol } from './symbols';
import { applyFilters } from './filters';
import { isExcluded } from './pathMatcher';

export class PythonCodeLensProvider implements vscode.CodeLensProvider {
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;
    private symbolCache = new Map<vscode.CodeLens, EligibleSymbol>();

    constructor() { }

    public refresh() {
        this._onDidChangeCodeLenses.fire();
    }

    public async provideCodeLenses(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): Promise<vscode.CodeLens[]> {
        const config = getConfig(document.uri);

        if (!config.enable) {
            return [];
        }

        // Limit checking for extremely large files
        const fileSizeInKB = document.getText().length / 1024;
        if (fileSizeInKB > config.performance.maxFileSizeKB) {
            return [];
        }

        // Apply exclusionary glob rules (local matching — no workspace I/O)
        if (isExcluded(document.uri, config.exclude)) {
            return [];
        }

        const eligibleSymbols = await getEligibleSymbols(document, config);
        if (token.isCancellationRequested) { return []; }

        const lenses: vscode.CodeLens[] = [];
        this.symbolCache.clear();

        for (const sym of eligibleSymbols) {
            // Main reference lens
            const refLens = new vscode.CodeLens(sym.range);
            this.symbolCache.set(refLens, { ...sym, kind: sym.kind }); // Kind preserved for references
            lenses.push(refLens);

            // Implementations lens (only for classes)
            if (config.lenses.showImplementations && sym.kind === 'class') {
                const implLens = new vscode.CodeLens(sym.range);
                this.symbolCache.set(implLens, { ...sym, kind: 'class-impl' });
                lenses.push(implLens);
            }
        }

        return lenses;
    }

    public async resolveCodeLens(
        codeLens: vscode.CodeLens,
        token: vscode.CancellationToken
    ): Promise<vscode.CodeLens | null> {
        const sym = this.symbolCache.get(codeLens);
        if (!sym) {
            return null;
        }

        const uri = vscode.window.activeTextEditor?.document.uri;
        if (!uri) { return null; }

        const config = getConfig(uri);
        const document = vscode.window.activeTextEditor?.document;
        if (!document) { return null; }

        let locations: vscode.Location[] = [];
        const docCache = new Map<string, vscode.TextDocument>();
        docCache.set(document.uri.toString(), document);

        try {
            if (sym.kind === 'class-impl') {
                const allRefs = await vscode.commands.executeCommand<vscode.Location[]>(
                    'vscode.executeReferenceProvider',
                    uri,
                    sym.selectionRange.start
                ) || [];
                for (const loc of allRefs) {
                    try {
                        const key = loc.uri.toString();
                        let locDoc = docCache.get(key);
                        if (!locDoc) {
                            locDoc = await vscode.workspace.openTextDocument(loc.uri);
                            docCache.set(key, locDoc);
                        }
                        const lineText = locDoc.lineAt(loc.range.start.line).text;
                        if (/^\s*class\s+\w+\s*\(/.test(lineText)) {
                            locations.push(loc);
                        }
                    } catch {
                        // ignore unreadable files
                    }
                }
            } else {
                locations = await vscode.commands.executeCommand<vscode.Location[]>(
                    'vscode.executeReferenceProvider',
                    uri,
                    sym.selectionRange.start
                ) || [];
            }
        } catch {
            // Usually happens if python provider is not fully booted yet
            locations = [];
        }

        if (token.isCancellationRequested) { return null; }

        const filteredLocations = await applyFilters(locations, sym, config, document, docCache);
        const count = filteredLocations.length;

        if (count < config.references.minCount || (count === 0 && !config.references.showZero)) {
            // Hide the lens
            codeLens.command = { title: "", command: "" };
            return codeLens;
        }

        const title = sym.kind === 'class-impl'
            ? `${count} ${count === 1 ? 'implementation' : 'implementations'}`
            : `${count} ${count === 1 ? 'reference' : 'references'}`;

        const clickCommand = config.clickAction === 'reveal' ? 'editor.action.showReferences' : 'editor.action.peekLocations';

        codeLens.command = {
            title: title,
            command: count > 0 ? clickCommand : "",
            arguments: count > 0 ? [uri, sym.selectionRange.start, filteredLocations] : []
        };

        if (config.clickAction === 'peek' && count > 0) {
            codeLens.command.arguments?.push('peek');
        }

        return codeLens;
    }
}
