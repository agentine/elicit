import type { PromptHandler } from "../engine.js";
import type { KeyPress } from "../terminal.js";
import { green, dim, cyan } from "../style.js";

export interface ListOptions {
  message: string;
  initial?: string;
  separator?: string;
}

export class ListHandler implements PromptHandler {
  private value: string;
  private cursor: number;
  private message: string;
  private separator: string;

  constructor(options: ListOptions) {
    this.message = options.message;
    this.value = options.initial ?? "";
    this.cursor = this.value.length;
    this.separator = options.separator ?? ",";
  }

  render(): string {
    const prefix = green("? ");
    const sep = dim(" › ");
    const before = this.value.slice(0, this.cursor);
    const after = this.value.slice(this.cursor);
    const cursorChar = after.length > 0 ? after[0] : " ";
    const rest = after.slice(1);
    return `${prefix}${this.message}${sep}${before}\x1b[7m${cursorChar}\x1b[27m${rest}`;
  }

  handleKey(key: KeyPress): boolean {
    if (key.name === "return") return true;

    if (key.name === "backspace") {
      if (this.cursor > 0) {
        this.value = this.value.slice(0, this.cursor - 1) + this.value.slice(this.cursor);
        this.cursor--;
      }
    } else if (key.name === "left") {
      if (this.cursor > 0) this.cursor--;
    } else if (key.name === "right") {
      if (this.cursor < this.value.length) this.cursor++;
    } else if (key.char && !key.ctrl && !key.meta) {
      this.value = this.value.slice(0, this.cursor) + key.char + this.value.slice(this.cursor);
      this.cursor += key.char.length;
    }

    return false;
  }

  getValue(): string[] {
    return this.value
      .split(this.separator)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  getDisplayValue(): string {
    return cyan(this.getValue().join(", "));
  }
}
