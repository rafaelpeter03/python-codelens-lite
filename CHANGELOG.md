# Change Log

## [0.1.1]
- Fixed: methods declared inside classes were not displaying their reference CodeLens. The Python symbol provider reports class methods as `SymbolKind.Method` (not `SymbolKind.Function`), and the detector has been updated to accept both kinds when traversing class bodies.

## [0.1.0]
- Initial release. Added configurable options for classes, methods, functions, module level declarations, and targeted imports scopes. Fully decoupled dependencies.
