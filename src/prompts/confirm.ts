import type { PromptHandler } from "../engine.js";
import type { KeyPress } from "../terminal.js";
import { green, dim, cyan } from "../style.js";

export interface ConfirmOptions {
  message: string;
  initial?: boolean;
}

export class ConfirmHandler implements PromptHandler {
  private value: boolean;
  private message: string;

  constructor(options: ConfirmOptions) {
    this.message = options.message;
    this.value = options.initial ?? false;
  }

  render(): string {
    const prefix = green("? ");
    const hint = this.value
      ? dim(" (") + green("Y") + dim("/n) ")
      : dim(" (y/") + green("N") + dim(") ");
    return `${prefix}${this.message}${hint}`;
  }

  handleKey(key: KeyPress): boolean {
    if (key.name === "return") return true;

    if (key.char === "y" || key.char === "Y") {
      this.value = true;
    } else if (key.char === "n" || key.char === "N") {
      this.value = false;
    } else if (key.name === "left" || key.name === "right") {
      this.value = !this.value;
    }

    return false;
  }

  getValue(): boolean {
    return this.value;
  }

  getDisplayValue(): string {
    return cyan(this.value ? "yes" : "no");
  }
}
