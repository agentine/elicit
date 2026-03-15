import type { PromptHandler } from "../engine.js";
import type { KeyPress } from "../terminal.js";
import type { Choice } from "../types.js";
import { green, dim, cyan } from "../style.js";

export interface SelectOptions {
  message: string;
  choices: Choice[];
  hint?: string;
  warn?: string;
  initial?: number;
}

export class SelectHandler implements PromptHandler {
  private message: string;
  private choices: Choice[];
  private hint: string;
  private warn: string;
  private cursor: number;

  constructor(options: SelectOptions) {
    this.message = options.message;
    this.choices = options.choices;
    this.hint = options.hint ?? "Use arrow keys to navigate";
    this.warn = options.warn ?? "This option is disabled";
    this.cursor = options.initial ?? 0;
  }

  render(): string {
    const prefix = green("? ");
    const hintStr = dim(` (${this.hint})`);
    let output = `${prefix}${this.message}${hintStr}`;

    for (let i = 0; i < this.choices.length; i++) {
      const choice = this.choices[i];
      const isActive = i === this.cursor;
      const pointer = isActive ? green("❯ ") : "  ";
      if (choice.disabled) {
        const label = dim(choice.title + ` (${this.warn})`);
        output += `\n${pointer}${label}`;
        continue;
      }
      const label = isActive ? choice.title : dim(choice.title);
      const desc =
        choice.description && isActive ? dim(` - ${choice.description}`) : "";
      output += `\n${pointer}${label}${desc}`;
    }

    return output;
  }

  handleKey(key: KeyPress): boolean {
    if (key.name === "return") {
      const choice = this.choices[this.cursor];
      if (choice.disabled) return false;
      return true;
    }

    if (key.name === "up") {
      this.cursor = (this.cursor - 1 + this.choices.length) % this.choices.length;
    } else if (key.name === "down") {
      this.cursor = (this.cursor + 1) % this.choices.length;
    } else if (key.name === "home") {
      this.cursor = 0;
    } else if (key.name === "end") {
      this.cursor = this.choices.length - 1;
    }

    return false;
  }

  getValue(): unknown {
    const choice = this.choices[this.cursor];
    return choice.value !== undefined ? choice.value : choice.title;
  }

  getDisplayValue(): string {
    const choice = this.choices[this.cursor];
    return cyan(choice.title);
  }
}
