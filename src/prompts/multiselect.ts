import type { PromptHandler } from "../engine.js";
import type { KeyPress } from "../terminal.js";
import type { Choice } from "../types.js";
import { green, dim, cyan } from "../style.js";

export interface MultiSelectOptions {
  message: string;
  choices: Choice[];
  hint?: string;
  warn?: string;
  min?: number;
  max?: number;
  instructions?: string | boolean;
}

export class MultiSelectHandler implements PromptHandler {
  private message: string;
  private choices: Choice[];
  private selected: boolean[];
  private hint: string;
  private warn: string;
  private cursor: number;
  private min: number;
  private max: number;

  constructor(options: MultiSelectOptions) {
    this.message = options.message;
    this.choices = options.choices;
    this.selected = options.choices.map((c) => c.selected ?? false);
    this.hint = options.hint ?? "Space to select, Enter to confirm";
    this.warn = options.warn ?? "This option is disabled";
    this.cursor = 0;
    this.min = options.min ?? 0;
    this.max = options.max ?? Infinity;
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
        const check = "◯ ";
        const label = dim(choice.title + ` (${this.warn})`);
        output += `\n${pointer}${check}${label}`;
        continue;
      }
      const check = this.selected[i] ? green("◉ ") : "◯ ";
      const label = isActive ? choice.title : dim(choice.title);
      const desc =
        choice.description && isActive ? dim(` - ${choice.description}`) : "";
      output += `\n${pointer}${check}${label}${desc}`;
    }

    return output;
  }

  handleKey(key: KeyPress): boolean {
    if (key.name === "return") {
      const count = this.selected.filter(Boolean).length;
      if (count < this.min) return false;
      return true;
    }

    if (key.name === "up") {
      this.cursor = (this.cursor - 1 + this.choices.length) % this.choices.length;
    } else if (key.name === "down") {
      this.cursor = (this.cursor + 1) % this.choices.length;
    } else if (key.name === "space") {
      const choice = this.choices[this.cursor];
      if (!choice.disabled) {
        const currentlySelected = this.selected[this.cursor];
        if (currentlySelected) {
          this.selected[this.cursor] = false;
        } else {
          const count = this.selected.filter(Boolean).length;
          if (count < this.max) {
            this.selected[this.cursor] = true;
          }
        }
      }
    } else if (key.name === "home") {
      this.cursor = 0;
    } else if (key.name === "end") {
      this.cursor = this.choices.length - 1;
    } else if (key.char === "a" || key.char === "A") {
      // Toggle all
      const allSelected = this.selected.every(Boolean);
      this.selected = this.selected.map(() => !allSelected);
    }

    return false;
  }

  getValue(): unknown[] {
    return this.choices
      .filter((_, i) => this.selected[i])
      .map((c) => (c.value !== undefined ? c.value : c.title));
  }

  getDisplayValue(): string {
    const labels = this.choices
      .filter((_, i) => this.selected[i])
      .map((c) => c.title);
    return cyan(labels.join(", ") || "none");
  }
}
