import * as vscode from 'vscode';

export function isInitPy(uri: vscode.Uri): boolean {
    return uri.scheme === 'file' && uri.fsPath.replace(/\\/g, '/').endsWith('/__init__.py');
}

export async function isDocumentOverSizeLimit(
    document: vscode.TextDocument,
    maxFileSizeKB: number
): Promise<boolean> {
    if (maxFileSizeKB <= 0) {
        return false;
    }

    const maxBytes = maxFileSizeKB * 1024;

    if (document.uri.scheme === 'file' && !document.isDirty) {
        try {
            const stat = await vscode.workspace.fs.stat(document.uri);
            return stat.size > maxBytes;
        } catch {
            // Fall back to the in-memory document below.
        }
    }

    const lastLine = document.lineAt(document.lineCount - 1);
    return document.offsetAt(lastLine.rangeIncludingLineBreak.end) > maxBytes;
}
