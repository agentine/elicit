# @agentine/elicit

Lightweight interactive CLI prompts for Node.js. Zero dependencies.

Drop-in replacement for [`prompts`](https://www.npmjs.com/package/prompts) and [`enquirer`](https://www.npmjs.com/package/enquirer).

## Install

```bash
npm install @agentine/elicit
```

## Quick Start

```typescript
import elicit from '@agentine/elicit';

const response = await elicit([
  {
    type: 'text',
    name: 'name',
    message: 'What is your name?'
  },
  {
    type: 'confirm',
    name: 'agree',
    message: 'Do you agree to the terms?'
  }
]);

console.log(response); // { name: 'Alice', agree: true }
```

## Prompt Types

| Type | Description |
|------|-------------|
| `text` | Single-line text input |
| `password` | Masked text input (shows `*`) |
| `invisible` | Hidden text input |
| `number` | Numeric input with min/max/float/increment |
| `confirm` | Yes/no boolean |
| `list` | Comma-separated list → array |
| `toggle` | Toggle between two values |
| `select` | Single selection from choices |
| `multiselect` | Multiple selection from choices |
| `autocomplete` | Text input with suggestion filtering |
| `date` | Date/time input with segment navigation |

## API

### `elicit(questions, options?)`

- **questions** — `Question | Question[]`
- **options.onSubmit** — `(question, answer, answers) => void`
- **options.onCancel** — `(question, answers) => void | boolean`
- Returns `Promise<Record<string, unknown>>`

### Question Options

```typescript
{
  type: 'text',          // Prompt type (or function returning type/false)
  name: 'field',         // Key in response object
  message: 'Prompt?',    // Display message (or function)
  initial: 'default',    // Default value (or function)
  validate: (v) => true, // Return true or error string
  format: (v) => v,      // Transform displayed value
  onState: (state) => {} // { state, value, aborted }
}
```

All properties except `name` can be dynamic functions receiving `(prev, answers)`.

### Type-Specific Options

**number**: `min`, `max`, `float`, `round`, `increment`

**list**: `separator` (default: `,`)

**toggle**: `active` (default: `on`), `inactive` (default: `off`)

**select/multiselect**: `choices`, `hint`, `warn`

**multiselect**: `min`, `max`

**autocomplete**: `choices`, `suggest`, `limit`

**date**: `mask`

### Choices

```typescript
{
  type: 'select',
  name: 'color',
  message: 'Pick a color',
  choices: [
    { title: 'Red', value: 'red', description: 'Like fire' },
    { title: 'Blue', value: 'blue' },
    { title: 'Green', value: 'green', disabled: true }
  ]
}
```

### Programmatic Injection (Testing)

```typescript
import elicit from '@agentine/elicit';

elicit.inject(['Alice', true, 42]);

const answers = await elicit([
  { type: 'text', name: 'name', message: 'Name?' },
  { type: 'confirm', name: 'ok', message: 'OK?' },
  { type: 'number', name: 'age', message: 'Age?' }
]);
// answers = { name: 'Alice', ok: true, age: 42 }
```

## Migration from prompts

Replace your import:

```diff
- const prompts = require('prompts');
+ const prompts = require('@agentine/elicit/compat/prompts').default;
```

Or use ESM:

```diff
- import prompts from 'prompts';
+ import prompts from '@agentine/elicit/compat/prompts';
```

The API is identical — same function signature, option shapes, callbacks, and `prompts.inject()`.

## Migration from enquirer

Replace your import:

```diff
- const { prompt } = require('enquirer');
+ const { prompt } = require('@agentine/elicit/compat/enquirer');
```

Or use ESM:

```diff
- import { prompt, Prompt } from 'enquirer';
+ import { prompt, Prompt } from '@agentine/elicit/compat/enquirer';
```

Type names are automatically mapped: `input` → `text`, `numeral` → `number`, `boolean` → `confirm`.

The compat layer supports enquirer-style choices (`name`/`message`/`value`/`hint`), `skip`, and `result` transformers.

## Exports

```typescript
// Main API
import elicit from '@agentine/elicit';

// prompts compatibility
import prompts from '@agentine/elicit/compat/prompts';

// enquirer compatibility
import { prompt, Prompt } from '@agentine/elicit/compat/enquirer';

// Utilities
import { Terminal, ansi, parseKey, style, PromptEngine } from '@agentine/elicit';
```

## License

MIT
