import * as vscode from 'vscode';

export type Category = 'project' | 'venv' | 'stdlib' | 'global';

const classificationCache = new Map<string, Category>();

export function classifyLocation(loc: vscode.Location): Category {
    return classifyUri(loc.uri);
}

export function classifyUri(uri: vscode.Uri): Category {
    if (uri.scheme !== 'file') {
        return 'global';
    }

    const fsPath = uri.fsPath;
    const cached = classificationCache.get(fsPath);
    if (cached) {
        return cached;
    }

    const category = computeClassification(fsPath);
    classificationCache.set(fsPath, category);
    return category;
}

function computeClassification(fsPath: string): Category {
    const normalizedPath = fsPath.replace(/\\/g, '/').toLowerCase();

    if (normalizedPath.includes('/site-packages/') || normalizedPath.includes('/dist-packages/')) {
        return 'venv';
    }

    if (vscode.workspace.workspaceFolders) {
        for (const folder of vscode.workspace.workspaceFolders) {
            const folderPath = folder.uri.fsPath.replace(/\\/g, '/').replace(/\/$/, '').toLowerCase();
            if (normalizedPath === folderPath || normalizedPath.startsWith(`${folderPath}/`)) {
                return 'project';
            }
        }
    }

    if (/[\\/]lib[\\/]python\d+(\.\d+)?[\\/]/.test(fsPath) ||
        normalizedPath.includes('/usr/lib/python') ||
        normalizedPath.includes('/library/frameworks/python.framework') ||
        normalizedPath.includes('/python3/lib/') ||
        normalizedPath.includes('/typeshed-fallback/stdlib/') ||
        normalizedPath.includes('/typeshed/stdlib/')) {
        return 'stdlib';
    }

    return 'global';
}

export function invalidateClassificationCache() {
    classificationCache.clear();
}
