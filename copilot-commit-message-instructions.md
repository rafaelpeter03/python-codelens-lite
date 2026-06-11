# Commit Message Instructions

Generate messages following the Conventional Commits standard:

`<type>(<optional scope>): <description>`

## Rules
- Always write the commit message in English.
- Always use one of the types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- The type must be lowercase, followed by `:` and a space before the description.
- Scope is optional, in parentheses, lowercase, e.g.: `feat(parser):`.
- The description must be short (ideally ≤ 50 characters), in the imperative mood, and start with a lowercase letter.
- Do not end the description with a period.
- Use `feat` for new features and `fix` for bug fixes.
- For breaking changes, add `!` before the `:` (e.g.: `feat!:`) and/or a `BREAKING CHANGE: <description>` footer (in uppercase).
- Optional body: separate it from the description with a blank line and explain the "what" and the "why".
- Optional footers: separate them with a blank line; tokens use `-` instead of spaces (e.g.: `Reviewed-by:`, `Refs: #123`).

## Examples
- `feat(api): add authentication endpoint`
- `fix: correct cart total calculation`
- `docs: update installation instructions`
- `refactor(auth)!: remove legacy token support`
