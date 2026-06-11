import * as vscode from 'vscode';
import { getConfig } from './config';
import { getEligibleSymbols, EligibleSymbol } from './symbols';
import { applyFilters } from './filters';
import { isExcluded } from './pathMatcher';
import { isDocumentOverSizeLimit, isInitPy } from './pythonFiles';

class SymbolCodeLens extends vscode.CodeLens {
    constructor(
        range: vscode.Range,
        public readonly documentUri: vscode.Uri,
        public readonly symbol: EligibleSymbol
    ) {
        super(range);
    }
}

export class PythonCodeLensProvider implements vscode.CodeLensProvider {
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    public refresh() {
        this._onDidChangeCodeLenses.fire();
    }

    public dispose() {
        this._onDidChangeCodeLenses.dispose();
    }

    public async provideCodeLenses(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): Promise<vscode.CodeLens[]> {
        const config = getConfig(document.uri);

        if (!config.enable) {
            return [];
        }

        if (!config.files.includeInitPy && isInitPy(document.uri)) {
            return [];
        }

        if (await isDocumentOverSizeLimit(document, config.performance.maxFileSizeKB)) {
            return [];
        }

        if (isExcluded(document.uri, config.exclude)) {
            return [];
        }

        const eligibleSymbols = await getEligibleSymbols(document, config);
        if (token.isCancellationRequested) { return []; }

        const lenses: vscode.CodeLens[] = [];

        for (const sym of eligibleSymbols) {
            lenses.push(new SymbolCodeLens(sym.range, document.uri, sym));

            if (config.lenses.showImplementations && sym.kind === 'class') {
                lenses.push(new SymbolCodeLens(
                    sym.range,
                    document.uri,
                    { ...sym, kind: 'class-impl' }
                ));
            }
        }

        return lenses;
    }

    public async resolveCodeLens(
        codeLens: vscode.CodeLens,
        token: vscode.CancellationToken
    ): Promise<vscode.CodeLens | null> {
        if (!(codeLens instanceof SymbolCodeLens)) {
            return null;
        }

        const { documentUri, symbol: sym } = codeLens;
        const config = getConfig(documentUri);
        if (!config.enable || (!config.files.includeInitPy && isInitPy(documentUri))) {
            return null;
        }

        const document = vscode.workspace.textDocuments.find(
            doc => doc.uri.toString() === documentUri.toString()
        ) ?? await vscode.workspace.openTextDocument(documentUri);

        let locations: vscode.Location[] = [];
        const docCache = new Map<string, vscode.TextDocument>();
        docCache.set(document.uri.toString(), document);

        try {
            if (sym.kind === 'class-impl') {
                const allRefs = await vscode.commands.executeCommand<vscode.Location[]>(
                    'vscode.executeReferenceProvider',
                    documentUri,
                    sym.selectionRange.start
                ) || [];
                for (const loc of allRefs) {
                    if (!config.files.includeInitPy && isInitPy(loc.uri)) {
                        continue;
                    }

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
                    documentUri,
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
            arguments: count > 0 ? [documentUri, sym.selectionRange.start, filteredLocations] : []
        };

        if (config.clickAction === 'peek' && count > 0) {
            codeLens.command.arguments?.push('peek');
        }

        return codeLens;
    }
}
