import type { PromptState, ValidateFunction, FormatFunction, StateChange } from "./types.js";
import type { Terminal, KeyPress } from "./terminal.js";
import { ansi } from "./terminal.js";

/**
 * Interface that individual prompt types implement.
 * The engine drives the lifecycle; the handler provides type-specific behavior.
 */
export interface PromptHandler {
  /** Render the current prompt state. Returns the output string (no trailing newline). */
  render(): string;

  /** Handle a keypress. Returns true if the prompt should submit. */
  handleKey(key: KeyPress): boolean;

  /** Get the current value. */
  getValue(): unknown;

  /** Get the formatted display value for the submitted answer. */
  getDisplayValue(): string | Promise<string>;
}

export interface EngineOptions {
  terminal: Terminal;
  handler: PromptHandler;
  message: string;
  validate?: ValidateFunction;
  format?: FormatFunction;
  onState?: (state: StateChange) => void;
  onRender?: () => void;
}

/**
 * The prompt engine drives the lifecycle: init → render → input → validate → submit.
 * Handles Ctrl+C abort (resolves with undefined).
 */
export class PromptEngine {
  private terminal: Terminal;
  private handler: PromptHandler;
  private message: string;
  private validate?: ValidateFunction;
  private format?: FormatFunction;
  private onState?: (state: StateChange) => void;
  private onRender?: () => void;
  private state: PromptState = "init";
  private error = "";
  private renderedLines = 0;

  constructor(options: EngineOptions) {
    this.terminal = options.terminal;
    this.handler = options.handler;
    this.message = options.message;
    this.validate = options.validate;
    this.format = options.format;
    this.onState = options.onState;
    this.onRender = options.onRender;
  }

  /** Run the prompt to completion. Returns the value, or undefined if aborted. */
  async run(): Promise<unknown> {
    this.terminal.enableRawMode();
    this.terminal.hideCursor();

    try {
      this.state = "active";
      this.emitState();
      this.render();

      while (this.state === "active" || this.state === "error") {
        const key = await this.terminal.readKey();
        if (key === null) {
          // Stream ended — treat as abort
          this.state = "cancel";
          this.emitState();
          return undefined;
        }

        // Ctrl+C — abort
        if (key.ctrl && key.name === "c") {
          this.state = "cancel";
          this.emitState();
          this.renderFinal(true);
          return undefined;
        }

        const shouldSubmit = this.handler.handleKey(key);

        if (shouldSubmit) {
          // Validate
          const value = this.handler.getValue();
          if (this.validate) {
            const result = await this.validate(value);
            if (result !== true) {
              this.error = typeof result === "string" ? result : "Invalid input";
              this.state = "error";
              this.emitState();
              this.render();
              continue;
            }
          }

          this.state = "submit";
          this.emitState();
          this.renderFinal(false);
          return value;
        }

        this.error = "";
        if (this.state === "error") {
          this.state = "active";
        }
        this.render();
      }

      return undefined;
    } finally {
      this.terminal.showCursor();
      this.terminal.disableRawMode();
    }
  }

  private render(): void {
    // Clear previous render
    if (this.renderedLines > 0) {
      this.terminal.write(ansi.cursorUp(this.renderedLines - 1));
      this.terminal.clearLine();
      for (let i = 1; i < this.renderedLines; i++) {
        this.terminal.write(ansi.cursorDown());
        this.terminal.clearLine();
      }
      this.terminal.write(ansi.cursorUp(this.renderedLines - 1));
    }

    const output = this.handler.render();
    const errorSuffix = this.error ? `\n  ${this.error}` : "";
    const fullOutput = output + errorSuffix;

    this.terminal.write(fullOutput);
    this.renderedLines = fullOutput.split("\n").length;

    this.onRender?.();
  }

  private async renderFinal(aborted: boolean): Promise<void> {
    // Clear previous render
    if (this.renderedLines > 0) {
      this.terminal.write(ansi.cursorUp(this.renderedLines - 1));
      this.terminal.clearLine();
      for (let i = 1; i < this.renderedLines; i++) {
        this.terminal.write(ansi.cursorDown());
        this.terminal.clearLine();
      }
      this.terminal.write(ansi.cursorUp(this.renderedLines - 1));
    }

    if (aborted) {
      this.terminal.writeLine(`\r${ansi.eraseLine}${this.message}`);
    } else {
      const display = await this.handler.getDisplayValue();
      const formatted = this.format ? await this.format(display) : display;
      this.terminal.writeLine(`\r${ansi.eraseLine}${this.message} ${formatted}`);
    }

    this.renderedLines = 0;
  }

  private emitState(): void {
    this.onState?.({
      state: this.state,
      value: this.handler.getValue(),
      aborted: this.state === "cancel",
    });
  }
}
