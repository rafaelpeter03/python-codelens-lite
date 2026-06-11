import type * as vscode from 'vscode';

const importStartPattern = /^\s*(import|from)\s/;

export function isLineAnImport(document: vscode.TextDocument, lineIdx: number): boolean {
    if (lineIdx < 0 || lineIdx >= document.lineCount) {
        return false;
    }

    const startLine = Math.max(0, lineIdx - 100);
    const lines: string[] = [];
    for (let idx = startLine; idx <= lineIdx; idx++) {
        lines.push(document.lineAt(idx).text);
    }

    return isLineTextAnImport(lines, lineIdx - startLine);
}

export function isLineTextAnImport(lines: readonly string[], lineIdx: number): boolean {
    if (lineIdx < 0 || lineIdx >= lines.length) {
        return false;
    }

    if (importStartPattern.test(lines[lineIdx])) {
        return true;
    }

    for (let startIdx = lineIdx - 1; startIdx >= 0; startIdx--) {
        if (importStartPattern.test(lines[startIdx]) &&
            importStatementSpansLine(lines, startIdx, lineIdx)) {
            return true;
        }
    }

    return false;
}

function importStatementSpansLine(lines: readonly string[], startIdx: number, targetIdx: number): boolean {
    let parenDepth = 0;

    for (let idx = startIdx; idx <= targetIdx; idx++) {
        const line = stripComment(lines[idx]);
        parenDepth += getParenDelta(line);

        if (idx < targetIdx && parenDepth <= 0 && !hasLineContinuation(line)) {
            return false;
        }
    }

    return true;
}

function stripComment(line: string): string {
    const commentIdx = line.indexOf('#');
    return commentIdx === -1 ? line : line.slice(0, commentIdx);
}

function getParenDelta(line: string): number {
    let delta = 0;
    for (const char of line) {
        if (char === '(') {
            delta++;
        } else if (char === ')') {
            delta--;
        }
    }
    return delta;
}

function hasLineContinuation(line: string): boolean {
    return line.trimEnd().endsWith('\\');
}
