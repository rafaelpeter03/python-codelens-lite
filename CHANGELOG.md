# Change Log

## [0.1.2]
- Added: `pythonCodeLensLite.files.includeInitPy` controls whether `__init__.py` files show CodeLens and contribute to reference counts.
- Improved: CodeLens resolution now uses the lens document instead of the active editor, which is safer with multiple open Python files.
- Improved: large-file checks avoid copying the full document text when file metadata is available.
- Removed: unused Mocha/test-electron scaffold and test bundle output.

## [0.1.1]
- Fixed: methods declared inside classes were not displaying their reference CodeLens. The Python symbol provider reports class methods as `SymbolKind.Method` (not `SymbolKind.Function`), and the detector has been updated to accept both kinds when traversing class bodies.

## [0.1.0]
- Initial release. Added configurable options for classes, methods, functions, module level declarations, and targeted imports scopes. Fully decoupled dependencies.
