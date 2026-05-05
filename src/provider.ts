import * as vscode from 'vscode';
import { ResolvedConfig, getConfig } from './config';
import { getEligibleSymbols, EligibleSymbol } from './symbols';
import { applyFilters } from './filters';

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

        // Apply exclusionary glob rules
        for (const pattern of config.exclude) {
            const relPattern = new vscode.RelativePattern(vscode.workspace.getWorkspaceFolder(document.uri) || document.uri, pattern);
            const matches = await vscode.workspace.findFiles(relPattern, null, 1);
            if (matches.some(m => m.toString() === document.uri.toString())) {
                return [];
            }
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
                this.symbolCache.set(implLens, { ...sym, kind: 'class-impl' as any });
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

        try {
            if ((sym.kind as any) === 'class-impl') {
                locations = await vscode.commands.executeCommand<vscode.Location[]>(
                    'vscode.executeImplementationProvider',
                    uri,
                    sym.selectionRange.start
                ) || [];
            } else {
                locations = await vscode.commands.executeCommand<vscode.Location[]>(
                    'vscode.executeReferenceProvider',
                    uri,
                    sym.selectionRange.start
                ) || [];
            }
        } catch (e) {
            // Usually happens if python provider is not fully booted yet
            locations = [];
        }

        if (token.isCancellationRequested) { return null; }

        const filteredLocations = await applyFilters(locations, sym, config, document);
        const count = filteredLocations.length;

        if (count < config.references.minCount || (count === 0 && !config.references.showZero)) {
            // Hide the lens
            codeLens.command = { title: "", command: "" };
            return codeLens;
        }

        const title = (sym.kind as any) === 'class-impl'
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
