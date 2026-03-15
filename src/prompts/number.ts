import type { PromptHandler } from "../engine.js";
import type { KeyPress } from "../terminal.js";
import { green, dim, cyan, yellow } from "../style.js";

export interface NumberOptions {
  message: string;
  initial?: number;
  min?: number;
  max?: number;
  float?: boolean;
  round?: number;
  increment?: number;
}

export class NumberHandler implements PromptHandler {
  private input: string;
  private message: string;
  private min: number;
  private max: number;
  private float: boolean;
  private round: number;
  private increment: number;

  constructor(options: NumberOptions) {
    this.message = options.message;
    this.input = options.initial !== undefined ? String(options.initial) : "";
    this.min = options.min ?? -Infinity;
    this.max = options.max ?? Infinity;
    this.float = options.float ?? false;
    this.round = options.round ?? 2;
    this.increment = options.increment ?? 1;
  }

  render(): string {
    const prefix = green("? ");
    const sep = dim(" › ");
    const display = this.input || dim("enter a number");
    return `${prefix}${this.message}${sep}${display}`;
  }

  handleKey(key: KeyPress): boolean {
    if (key.name === "return") return true;

    if (key.name === "up") {
      const n = this.parseNum() + this.increment;
      this.input = this.formatNum(Math.min(n, this.max));
    } else if (key.name === "down") {
      const n = this.parseNum() - this.increment;
      this.input = this.formatNum(Math.max(n, this.min));
    } else if (key.name === "backspace") {
      this.input = this.input.slice(0, -1);
    } else if (key.char && !key.ctrl && !key.meta) {
      // Allow digits, minus, and decimal point
      if (/[\d]/.test(key.char)) {
        this.input += key.char;
      } else if (key.char === "-" && this.input === "") {
        this.input += key.char;
      } else if (key.char === "." && this.float && !this.input.includes(".")) {
        this.input += key.char;
      }
    }

    return false;
  }

  getValue(): number | undefined {
    if (this.input === "" || this.input === "-") return undefined;
    let n = this.float ? parseFloat(this.input) : parseInt(this.input, 10);
    if (isNaN(n)) return undefined;
    if (this.float) {
      n = parseFloat(n.toFixed(this.round));
    }
    n = Math.max(this.min, Math.min(this.max, n));
    return n;
  }

  getDisplayValue(): string {
    const v = this.getValue();
    if (v === undefined) return yellow("NaN");
    return cyan(String(v));
  }

  private parseNum(): number {
    const n = this.float ? parseFloat(this.input) : parseInt(this.input, 10);
    return isNaN(n) ? 0 : n;
  }

  private formatNum(n: number): string {
    if (this.float) return n.toFixed(this.round);
    return String(Math.round(n));
  }
}
