import type { PromptHandler } from "../engine.js";
import type { KeyPress } from "../terminal.js";
import { green, dim, cyan } from "../style.js";

export interface PasswordOptions {
  message: string;
}

export class PasswordHandler implements PromptHandler {
  private value = "";
  private message: string;

  constructor(options: PasswordOptions) {
    this.message = options.message;
  }

  render(): string {
    const prefix = green("? ");
    const sep = dim(" › ");
    const masked = "*".repeat(this.value.length);
    return `${prefix}${this.message}${sep}${masked}`;
  }

  handleKey(key: KeyPress): boolean {
    if (key.name === "return") return true;

    if (key.name === "backspace") {
      if (this.value.length > 0) {
        this.value = this.value.slice(0, -1);
      }
    } else if (key.char && !key.ctrl && !key.meta) {
      this.value += key.char;
    }

    return false;
  }

  getValue(): string {
    return this.value;
  }

  getDisplayValue(): string {
    return cyan("*".repeat(this.value.length));
  }
}
