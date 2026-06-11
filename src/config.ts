import * as vscode from 'vscode';
import type { Category } from './classifier';

export interface ResolvedConfig {
    enable: boolean;
    files: {
        includeInitPy: boolean;
    };
    targets: {
        classes: boolean;
        methods: boolean;
        functions: boolean;
        moduleVariables: boolean;
        imports: {
            project: boolean;
            venv: boolean;
            stdlib: boolean;
            global: boolean;
        };
    };
    references: {
        filterImports: boolean;
        filterDefinitions: boolean;
        filterSelf: boolean;
        minCount: number;
        showZero: boolean;
    };
    lenses: {
        showImplementations: boolean;
    };
    clickAction: 'peek' | 'reveal';
    performance: {
        debounceMs: number;
        maxFileSizeKB: number;
    };
    exclude: string[];
}

const configCache = new Map<string, ResolvedConfig>();

export function getConfig(uri?: vscode.Uri): ResolvedConfig {
    const key = uri ? uri.toString() : 'global';
    if (configCache.has(key)) {
        return configCache.get(key)!;
    }

    const config = vscode.workspace.getConfiguration('pythonCodeLensLite', uri);
    const resolved: ResolvedConfig = {
        enable: config.get<boolean>('enable', true),
        files: {
            includeInitPy: config.get<boolean>('files.includeInitPy', true),
        },
        targets: {
            classes: config.get<boolean>('targets.classes', true),
            methods: config.get<boolean>('targets.methods', true),
            functions: config.get<boolean>('targets.functions', true),
            moduleVariables: config.get<boolean>('targets.moduleVariables', false),
            imports: {
                project: config.get<boolean>('targets.imports.project', false),
                venv: config.get<boolean>('targets.imports.venv', false),
                stdlib: config.get<boolean>('targets.imports.stdlib', false),
                global: config.get<boolean>('targets.imports.global', false),
            }
        },
        references: {
            filterImports: config.get<boolean>('references.filterImports', true),
            filterDefinitions: config.get<boolean>('references.filterDefinitions', true),
            filterSelf: config.get<boolean>('references.filterSelf', false),
            minCount: Math.max(0, config.get<number>('references.minCount', 0)),
            showZero: config.get<boolean>('references.showZero', true),
        },
        lenses: {
            showImplementations: config.get<boolean>('lenses.showImplementations', true),
        },
        clickAction: config.get<'peek' | 'reveal'>('clickAction', 'peek'),
        performance: {
            debounceMs: Math.max(0, config.get<number>('performance.debounceMs', 250)),
            maxFileSizeKB: Math.max(0, config.get<number>('performance.maxFileSizeKB', 512)),
        },
        exclude: config.get<string[]>('exclude', [
            '**/.venv/**',
            '**/venv/**',
            '**/site-packages/**',
            '**/__pycache__/**'
        ])
    };

    configCache.set(key, resolved);
    return resolved;
}

export function invalidateConfigCache(uri?: vscode.Uri) {
    if (uri) {
        configCache.delete(uri.toString());
        return;
    }

    configCache.clear();
}

export function isImportCategoryEnabled(category: Category, config: ResolvedConfig): boolean {
    switch (category) {
        case 'project':
            return config.targets.imports.project;
        case 'venv':
            return config.targets.imports.venv;
        case 'stdlib':
            return config.targets.imports.stdlib;
        case 'global':
            return config.targets.imports.global;
    }
}
