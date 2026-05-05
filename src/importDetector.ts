import * as vscode from 'vscode';

export interface ImportInfo {
    moduleName: string;
    range: vscode.Range;
    names: string[];
}

// Regex to capture imports. E.g., `import os`, `from module import a, b`
const importRegex = /^\s*(?:from\s+([\w.]+)\s+import\s+(.+)|import\s+([\w., ]+))/;

export function findImportRanges(document: vscode.TextDocument): ImportInfo[] {
    const imports: ImportInfo[] = [];
    const maxLinesToScan = Math.min(document.lineCount, 500); // Only scan early lines to be safe

    for (let i = 0; i < maxLinesToScan; i++) {
        const line = document.lineAt(i);
        const match = importRegex.exec(line.text);
        if (match) {
            const moduleName = match[1] || match[3] || 'unknown';
            const namesStr = match[2] || '';
            const names = namesStr.split(',').map(n => n.trim().split(/\s+as\s+/)[0]);
            imports.push({
                moduleName,
                range: line.range,
                names
            });
        }
    }
    return imports;
}

export function isLineAnImport(document: vscode.TextDocument, lineIdx: number): boolean {
    if (lineIdx < 0 || lineIdx >= document.lineCount) {
        return false;
    }
    const lineText = document.lineAt(lineIdx).text;
    return /^\s*(import|from)\s/.test(lineText);
}
