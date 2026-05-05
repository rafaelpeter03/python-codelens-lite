import * as vscode from 'vscode';

export type Category = 'project' | 'venv' | 'stdlib' | 'global';

const classificationCache = new Map<string, Category>();

export function classifyLocation(loc: vscode.Location): Category {
    if (loc.uri.scheme !== 'file') {
        return 'global';
    }

    const fsPath = loc.uri.fsPath;
    if (classificationCache.has(fsPath)) {
        return classificationCache.get(fsPath)!;
    }

    const category = computeClassification(fsPath);
    classificationCache.set(fsPath, category);
    return category;
}

function computeClassification(fsPath: string): Category {
    const normalizedPath = fsPath.replace(/\\/g, '/').toLowerCase();

    // 1. Check virtual environments
    if (normalizedPath.includes('/site-packages/') || normalizedPath.includes('/dist-packages/')) {
        return 'venv';
    }

    // 2. Check project bounds
    if (vscode.workspace.workspaceFolders) {
        for (const folder of vscode.workspace.workspaceFolders) {
            // Check if path starts with the folder URI
            if (fsPath.startsWith(folder.uri.fsPath)) {
                return 'project';
            }
        }
    }

    // 3. Check STDLIB
    if (/[\\/]lib[\\/]python\d+(\.\d+)?[\\/]/.test(fsPath) || 
        normalizedPath.includes('/usr/lib/python') || 
        normalizedPath.includes('/library/frameworks/python.framework') || 
        normalizedPath.includes('/python3/lib/')) {
        return 'stdlib';
    }

    // Default
    return 'global';
}

export function invalidateClassificationCache() {
    classificationCache.clear();
}
