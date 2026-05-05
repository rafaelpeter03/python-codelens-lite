# Python CodeLens Lite

Lightweight, configurable CodeLens for Python (references, implementations, scoped imports).

## Features

- Uses VS Code's native `DocumentSymbolProvider` and `ReferenceProvider`, leveraging robust backend data natively passed by extensions like Pylance.
- Fully configurable filtering for CodeLenses across classes, methods, functions, and top scope.
- Supports granular classification for top-level variables and scoped imports.
- Ultra lightweight: no runtime dependencies. Uses `esbuild` for an optimized bundle.

## Settings

| Setting | Default | Description |
|---|---|---|
| `pythonCodeLensLite.enable` | `true` | Enable or disable the complete feature. |
| `pythonCodeLensLite.targets.classes` | `true` | Show CodeLens for `class` definitions. |
| `pythonCodeLensLite.targets.methods` | `true` | Show CodeLens for methods (functions inside classes). |
| `pythonCodeLensLite.targets.functions` | `true` | Show CodeLens for top-level functions. |
| `pythonCodeLensLite.targets.moduleVariables` | `false` | Show CodeLens for top-level variables/constants. |
| `(...)` | (...) | View VS Code Settings for full configurations. |

## How to Install
Run `npm run package` returning a `.vsix` file to be installed natively on VS Code. Or search for it in Visual Studio Code Marketplace!

## License
MIT
