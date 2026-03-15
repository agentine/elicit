import type { PromptHandler } from "../engine.js";
import type { KeyPress } from "../terminal.js";
import type { Choice } from "../types.js";
import { green, dim, cyan } from "../style.js";

export type SuggestFunction = (
  input: string,
  choices: Choice[]
) => Promise<Choice[]> | Choice[];

export interface AutocompleteOptions {
  message: string;
  choices: Choice[];
  suggest?: SuggestFunction;
  limit?: number;
  initial?: string;
}

function defaultSuggest(input: string, choices: Choice[]): Choice[] {
  const lower = input.toLowerCase();
  return choices.filter((c) => c.title.toLowerCase().includes(lower));
}

export class AutocompleteHandler implements PromptHandler {
  private message: string;
  private allChoices: Choice[];
  private filtered: Choice[];
  private suggest: SuggestFunction;
  private limit: number;
  private input: string;
  private cursor: number;

  constructor(options: AutocompleteOptions) {
    this.message = options.message;
    this.allChoices = options.choices;
    this.suggest = options.suggest ?? defaultSuggest;
    this.limit = options.limit ?? 10;
    this.input = options.initial ?? "";
    this.filtered = this.allChoices;
    this.cursor = 0;
    this.updateFiltered();
  }

  render(): string {
    const prefix = green("? ");
    const sep = dim(" › ");
    const inputDisplay = this.input || dim("Type to search...");
    let output = `${prefix}${this.message}${sep}${inputDisplay}`;

    const visible = this.filtered.slice(0, this.limit);
    for (let i = 0; i < visible.length; i++) {
      const choice = visible[i];
      const isActive = i === this.cursor;
      const pointer = isActive ? green("❯ ") : "  ";
      const label = isActive ? choice.title : dim(choice.title);
      output += `\n${pointer}${label}`;
    }

    if (this.filtered.length === 0) {
      output += `\n  ${dim("No matches")}`;
    }

    return output;
  }

  handleKey(key: KeyPress): boolean {
    if (key.name === "return") {
      if (this.filtered.length > 0) return true;
      return false;
    }

    if (key.name === "up") {
      const max = Math.min(this.filtered.length, this.limit);
      this.cursor = (this.cursor - 1 + max) % max;
    } else if (key.name === "down") {
      const max = Math.min(this.filtered.length, this.limit);
      this.cursor = (this.cursor + 1) % max;
    } else if (key.name === "backspace") {
      this.input = this.input.slice(0, -1);
      this.updateFiltered();
    } else if (key.char && !key.ctrl && !key.meta) {
      this.input += key.char;
      this.updateFiltered();
    }

    return false;
  }

  getValue(): unknown {
    if (this.filtered.length === 0) return this.input;
    const choice = this.filtered[this.cursor];
    return choice.value !== undefined ? choice.value : choice.title;
  }

  getDisplayValue(): string {
    if (this.filtered.length === 0) return cyan(this.input);
    return cyan(this.filtered[this.cursor].title);
  }

  private updateFiltered(): void {
    const result = this.suggest(this.input, this.allChoices);
    if (result instanceof Promise) {
      // For sync suggest functions (default), this is fine
      // Async suggest would need engine-level support
      this.filtered = this.allChoices;
    } else {
      this.filtered = result;
    }
    this.cursor = 0;
  }
}
