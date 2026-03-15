# elicit — Lightweight Interactive CLI Prompts for Node.js

**Package:** `@agentine/elicit`
**Language:** Node.js (TypeScript)
**Replaces:** `prompts` (terkelg) + `enquirer` (jonschlinkert)

## Target Libraries

| Library | Weekly Downloads | Stars | Last Release | Dependents |
|---------|-----------------|-------|-------------|------------|
| prompts | 36M | 9.3k | Oct 2021 | 11,876 |
| enquirer | 22M | 7.9k | Jul 2023 | — |

Combined: ~58M weekly downloads, both unmaintained with 150-200+ open issues each.

The only actively maintained alternative is `@inquirer/prompts` (16.5M/week), which has a fundamentally different, heavier API that is not a drop-in replacement for either library.

## Architecture

### Core Design

- Pure TypeScript with full type definitions
- Zero production dependencies
- Built-in ANSI styling (no chalk/kleur dependency)
- Promise/async-await native
- Supports both ESM and CJS (dual package)
- Node.js 18+

### Prompt Types

Matching `prompts` feature set:

| Type | Description |
|------|------------|
| `text` | Single-line text input |
| `password` | Masked text input |
| `invisible` | Hidden text input |
| `number` | Numeric input with min/max/float |
| `confirm` | Yes/no boolean |
| `list` | Comma-separated list → array |
| `toggle` | Toggle between two values |
| `select` | Single selection from choices |
| `multiselect` | Multiple selection from choices |
| `autocomplete` | Text input with suggestions |
| `date` | Date input |

### API Design

Primary API mirrors `prompts`:

```typescript
import elicit from '@agentine/elicit';

// Single prompt
const response = await elicit({
  type: 'text',
  name: 'username',
  message: 'What is your username?'
});

// Multiple prompts (sequential)
const answers = await elicit([
  { type: 'text', name: 'name', message: 'Your name?' },
  { type: 'confirm', name: 'agree', message: 'Do you agree?' }
]);
```

Features:
- `validate(value)` — return true or error message string
- `format(value)` — transform displayed value
- `onRender(kleur)` — custom render function
- `onState(state)` — state change callback
- `initial` — default value
- `choices` — for select/multiselect/autocomplete
- Dynamic properties (functions that receive prev answers)
- Ctrl+C abort handling (returns undefined for that prompt)

### Compatibility Layers

#### `@agentine/elicit/compat/prompts`
Drop-in replacement for `terkelg/prompts`:
- Same function signature and return types
- Same prompt type names and option shapes
- Same `onSubmit`/`onCancel` callbacks
- Programmatic injection for testing

#### `@agentine/elicit/compat/enquirer`
Compatibility adapter for `enquirer`:
- Class-based `Prompt` interface
- `prompt()` function with enquirer option shapes
- Type name mapping (enquirer uses `input` instead of `text`, etc.)

### Terminal I/O Layer

- Raw mode stdin handling
- ANSI escape sequence rendering
- Cursor management
- Line clearing/rewriting
- Windows Console API support
- Configurable stdin/stdout streams (for testing)
- Screen reader friendly output

## Major Components

1. **Terminal I/O** — Raw input handling, ANSI rendering, cursor control
2. **Prompt Engine** — State machine driving prompt lifecycle (init → render → input → validate → submit)
3. **Prompt Types** — Individual prompt implementations (text, select, etc.)
4. **Style Layer** — Built-in ANSI color/style utilities (no external dep)
5. **Compat: prompts** — Drop-in wrapper matching terkelg/prompts API
6. **Compat: enquirer** — Adapter matching enquirer API

## Deliverables

- `@agentine/elicit` npm package
- Full TypeScript type definitions
- ESM + CJS dual package
- Compatibility layers for prompts and enquirer
- Comprehensive test suite
- README with migration guides

## Improvements Over Targets

- TypeScript-first with proper generics and type inference
- Zero dependencies (prompts has `kleur` + `sisteransi`; enquirer has `ansi-colors`)
- Fixed known bugs (number prompt -Infinity issue, validate vs validator naming)
- Modern Node.js (18+, no legacy polyfills)
- Better accessibility (screen reader hints)
- Programmatic testing API (inject answers without TTY)
