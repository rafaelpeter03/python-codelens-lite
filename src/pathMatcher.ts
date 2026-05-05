import * as vscode from 'vscode';

const globRegexCache = new Map<string, RegExp>();

function globToRegex(glob: string): RegExp {
    const cached = globRegexCache.get(glob);
    if (cached) {
        return cached;
    }

    let re = '';
    let i = 0;
    while (i < glob.length) {
        const c = glob[i];
        if (c === '*') {
            if (glob[i + 1] === '*') {
                if (glob[i + 2] === '/') {
                    re += '(?:.*/)?';
                    i += 3;
                } else {
                    re += '.*';
                    i += 2;
                }
            } else {
                re += '[^/]*';
                i += 1;
            }
        } else if (c === '?') {
            re += '[^/]';
            i += 1;
        } else if ('.+^${}()|[]\\'.includes(c)) {
            re += '\\' + c;
            i += 1;
        } else {
            re += c;
            i += 1;
        }
    }

    const regex = new RegExp(`^${re}$`);
    globRegexCache.set(glob, regex);
    return regex;
}

export function isExcluded(uri: vscode.Uri, patterns: string[]): boolean {
    if (patterns.length === 0) {
        return false;
    }

    const fsPath = uri.fsPath.replace(/\\/g, '/');
    const folder = vscode.workspace.getWorkspaceFolder(uri);
    const relative = folder
        ? fsPath.slice(folder.uri.fsPath.replace(/\\/g, '/').length).replace(/^\//, '')
        : '';

    for (const pattern of patterns) {
        const regex = globToRegex(pattern);
        if (regex.test(fsPath) || (relative && regex.test(relative))) {
            return true;
        }
    }
    return false;
}
