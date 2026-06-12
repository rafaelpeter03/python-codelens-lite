# Change Log

## [0.1.4]
- Improved: CodeLens resolution now caches document symbols, raw references, and filtered reference results per document version.
- Improved: class reference and implementation lenses share the same raw reference-provider result instead of asking Pylance twice for the same position.
- Improved: document edits now invalidate only the edited Python document's symbol cache while clearing reference caches globally, preserving cross-file count consistency after the debounce delay.

## [0.1.3]
- Fixed: `pythonCodeLensLite.clickAction` set to `reveal` now navigates to a matching reference instead of opening the same peek-style references UI.
- Fixed: `pythonCodeLensLite.references.filterImports` now also filters import-target CodeLens results and recognizes multiline Python import statements.

## [0.1.2]
- Added: `pythonCodeLensLite.files.includeInitPy` controls whether `__init__.py` files show CodeLens and contribute to reference counts.
- Improved: CodeLens resolution now uses the lens document instead of the active editor, which is safer with multiple open Python files.
- Improved: large-file checks avoid copying the full document text when file metadata is available.
- Removed: unused Mocha/test-electron scaffold and test bundle output.

## [0.1.1]
- Fixed: methods declared inside classes were not displaying their reference CodeLens. The Python symbol provider reports class methods as `SymbolKind.Method` (not `SymbolKind.Function`), and the detector has been updated to accept both kinds when traversing class bodies.

## [0.1.0]
- Initial release. Added configurable options for classes, methods, functions, module level declarations, and targeted imports scopes. Fully decoupled dependencies.
