# Changelog

## 0.1.0 — 2026-03-16

Initial release.

- 11 prompt types: text, password, invisible, number, confirm, select, multiselect, autocomplete, date, toggle, list
- Drop-in compatibility layer for `terkelg/prompts`
- Drop-in compatibility layer for `enquirer`
- TypeScript-first with full type definitions
- Zero dependencies
- ESM + CJS dual package
- ANSI styling and terminal I/O with key parsing
- Prompt engine with state machine, validation, and abort handling
- Programmatic injection (`elicit.inject()`) for testing
- Dynamic properties (type, message, initial, choices can be functions)
- 163 tests across 9 test files
