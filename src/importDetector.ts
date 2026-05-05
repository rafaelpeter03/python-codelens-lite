import * as vscode from 'vscode';

export function isLineAnImport(document: vscode.TextDocument, lineIdx: number): boolean {
    if (lineIdx < 0 || lineIdx >= document.lineCount) {
        return false;
    }
    const lineText = document.lineAt(lineIdx).text;
    return /^\s*(import|from)\s/.test(lineText);
}
