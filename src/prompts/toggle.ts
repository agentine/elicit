import type { PromptHandler } from "../engine.js";
import type { KeyPress } from "../terminal.js";
import { green, dim, cyan, underline } from "../style.js";

export interface ToggleOptions {
  message: string;
  initial?: boolean;
  active?: string;
  inactive?: string;
}

export class ToggleHandler implements PromptHandler {
  private value: boolean;
  private message: string;
  private active: string;
  private inactive: string;

  constructor(options: ToggleOptions) {
    this.message = options.message;
    this.value = options.initial ?? false;
    this.active = options.active ?? "on";
    this.inactive = options.inactive ?? "off";
  }

  render(): string {
    const prefix = green("? ");
    const sep = dim(" · ");
    const inactiveLabel = this.value ? dim(this.inactive) : underline(this.inactive);
    const activeLabel = this.value ? underline(this.active) : dim(this.active);
    const slash = dim(" / ");
    return `${prefix}${this.message}${sep}${inactiveLabel}${slash}${activeLabel}`;
  }

  handleKey(key: KeyPress): boolean {
    if (key.name === "return") return true;

    if (
      key.name === "left" ||
      key.name === "right" ||
      key.name === "space" ||
      key.name === "tab"
    ) {
      this.value = !this.value;
    } else if (key.char === "y" || key.char === "Y" || key.char === "1") {
      this.value = true;
    } else if (key.char === "n" || key.char === "N" || key.char === "0") {
      this.value = false;
    }

    return false;
  }

  getValue(): boolean {
    return this.value;
  }

  getDisplayValue(): string {
    return cyan(this.value ? this.active : this.inactive);
  }
}
