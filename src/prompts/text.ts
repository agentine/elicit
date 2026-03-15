import type { PromptHandler } from "../engine.js";
import type { KeyPress } from "../terminal.js";
import { green, cyan, dim } from "../style.js";

export interface TextOptions {
  message: string;
  initial?: string;
}

export class TextHandler implements PromptHandler {
  private value: string;
  private cursor: number;
  private message: string;

  constructor(options: TextOptions) {
    this.message = options.message;
    this.value = options.initial ?? "";
    this.cursor = this.value.length;
  }

  render(): string {
    const prefix = green("? ");
    const msg = this.message;
    const sep = dim(" › ");
    const before = this.value.slice(0, this.cursor);
    const after = this.value.slice(this.cursor);
    const cursorChar = after.length > 0 ? after[0] : " ";
    const rest = after.slice(1);
    return `${prefix}${msg}${sep}${before}\x1b[7m${cursorChar}\x1b[27m${rest}`;
  }

  handleKey(key: KeyPress): boolean {
    if (key.name === "return") return true;

    if (key.name === "backspace") {
      if (this.cursor > 0) {
        this.value = this.value.slice(0, this.cursor - 1) + this.value.slice(this.cursor);
        this.cursor--;
      }
    } else if (key.name === "delete") {
      if (this.cursor < this.value.length) {
        this.value = this.value.slice(0, this.cursor) + this.value.slice(this.cursor + 1);
      }
    } else if (key.name === "left") {
      if (this.cursor > 0) this.cursor--;
    } else if (key.name === "right") {
      if (this.cursor < this.value.length) this.cursor++;
    } else if (key.name === "home" || (key.ctrl && key.name === "a")) {
      this.cursor = 0;
    } else if (key.name === "end" || (key.ctrl && key.name === "e")) {
      this.cursor = this.value.length;
    } else if (key.char && !key.ctrl && !key.meta) {
      this.value = this.value.slice(0, this.cursor) + key.char + this.value.slice(this.cursor);
      this.cursor += key.char.length;
    }

    return false;
  }

  getValue(): string {
    return this.value;
  }

  getDisplayValue(): string {
    return cyan(this.value);
  }
}
