import type { Readable, Writable } from "node:stream";
import { ReadStream } from "node:tty";

// ── ANSI escape sequences ──────────────────────────────────────────────

const ESC = "\x1b[";

/** ANSI escape helpers for cursor and screen manipulation. */
export const ansi = {
  // Cursor movement
  cursorUp: (n = 1) => `${ESC}${n}A`,
  cursorDown: (n = 1) => `${ESC}${n}B`,
  cursorForward: (n = 1) => `${ESC}${n}C`,
  cursorBack: (n = 1) => `${ESC}${n}D`,
  cursorTo: (col: number, row?: number) =>
    row === undefined ? `${ESC}${col + 1}G` : `${ESC}${row + 1};${col + 1}H`,
  cursorSave: `${ESC}s`,
  cursorRestore: `${ESC}u`,

  // Cursor visibility
  cursorShow: `${ESC}?25h`,
  cursorHide: `${ESC}?25l`,

  // Line clearing
  eraseLine: `${ESC}2K`,
  eraseLineEnd: `${ESC}0K`,
  eraseLineStart: `${ESC}1K`,

  // Screen clearing
  eraseDown: `${ESC}J`,
  eraseUp: `${ESC}1J`,
  eraseScreen: `${ESC}2J`,

  // Scrolling
  scrollUp: (n = 1) => `${ESC}${n}S`,
  scrollDown: (n = 1) => `${ESC}${n}T`,

  // Misc
  beep: "\x07",
} as const;

// ── Key parsing ────────────────────────────────────────────────────────

/** Parsed key event from stdin. */
export interface KeyPress {
  name: string;
  char: string;
  ctrl: boolean;
  shift: boolean;
  meta: boolean;
}

/** Parse a raw stdin buffer into a KeyPress. */
export function parseKey(buf: Buffer): KeyPress {
  const s = buf.toString("utf-8");
  const key: KeyPress = {
    name: "",
    char: "",
    ctrl: false,
    shift: false,
    meta: false,
  };

  if (s === "\r" || s === "\n") {
    key.name = "return";
  } else if (s === "\t") {
    key.name = "tab";
  } else if (s === "\x7f" || s === "\b") {
    key.name = "backspace";
  } else if (s === "\x1b") {
    key.name = "escape";
  } else if (s === " ") {
    key.name = "space";
    key.char = " ";
  } else if (s.length === 1 && s >= "\x01" && s <= "\x1a") {
    // Ctrl+A through Ctrl+Z
    key.ctrl = true;
    key.name = String.fromCharCode(s.charCodeAt(0) + 96); // a-z
  } else if (s.startsWith("\x1b[") || s.startsWith("\x1bO")) {
    // ANSI escape sequences
    const seq = s.slice(2);
    switch (seq) {
      case "A":
        key.name = "up";
        break;
      case "B":
        key.name = "down";
        break;
      case "C":
        key.name = "right";
        break;
      case "D":
        key.name = "left";
        break;
      case "H":
        key.name = "home";
        break;
      case "F":
        key.name = "end";
        break;
      case "3~":
        key.name = "delete";
        break;
      case "5~":
        key.name = "pageup";
        break;
      case "6~":
        key.name = "pagedown";
        break;
      case "1;2A":
        key.name = "up";
        key.shift = true;
        break;
      case "1;2B":
        key.name = "down";
        key.shift = true;
        break;
      case "1;2C":
        key.name = "right";
        key.shift = true;
        break;
      case "1;2D":
        key.name = "left";
        key.shift = true;
        break;
      case "1;5A":
        key.name = "up";
        key.ctrl = true;
        break;
      case "1;5B":
        key.name = "down";
        key.ctrl = true;
        break;
      case "1;5C":
        key.name = "right";
        key.ctrl = true;
        break;
      case "1;5D":
        key.name = "left";
        key.ctrl = true;
        break;
      default:
        key.name = "unknown";
        break;
    }
  } else if (s.length === 1 && s >= " " && s <= "~") {
    // Printable ASCII
    key.name = s;
    key.char = s;
  } else if (s.length > 0) {
    // Multi-byte unicode
    key.name = s;
    key.char = s;
  }

  return key;
}

// ── Terminal I/O ───────────────────────────────────────────────────────

export interface TerminalOptions {
  stdin?: Readable;
  stdout?: Writable;
}

/**
 * Terminal wraps stdin/stdout with raw mode handling, cursor control,
 * and key event reading. Configurable streams allow testing without a TTY.
 */
export class Terminal {
  readonly stdin: Readable;
  readonly stdout: Writable;
  private _rawMode = false;

  constructor(options?: TerminalOptions) {
    this.stdin = options?.stdin ?? process.stdin;
    this.stdout = options?.stdout ?? process.stdout;
  }

  /** Write a string to stdout. */
  write(s: string): void {
    this.stdout.write(s);
  }

  /** Write a line to stdout. */
  writeLine(s: string): void {
    this.stdout.write(s + "\n");
  }

  /** Clear the current line and move cursor to column 0. */
  clearLine(): void {
    this.write(ansi.eraseLine + "\r");
  }

  /** Clear from cursor to end of screen. */
  clearDown(): void {
    this.write(ansi.eraseDown);
  }

  /** Move cursor up N lines and clear each line. */
  clearLines(count: number): void {
    for (let i = 0; i < count; i++) {
      this.clearLine();
      if (i < count - 1) {
        this.write(ansi.cursorUp());
      }
    }
  }

  /** Hide the cursor. */
  hideCursor(): void {
    this.write(ansi.cursorHide);
  }

  /** Show the cursor. */
  showCursor(): void {
    this.write(ansi.cursorShow);
  }

  /** Move cursor to a column on the current line. */
  cursorTo(col: number): void {
    this.write(ansi.cursorTo(col));
  }

  /** Get terminal columns. Falls back to 80. */
  get columns(): number {
    if ("columns" in this.stdout) {
      return (this.stdout as { columns: number }).columns || 80;
    }
    return 80;
  }

  /** Enable raw mode on stdin (if it's a TTY). */
  enableRawMode(): void {
    if (this._rawMode) return;
    const stream = this.stdin;
    if (stream instanceof ReadStream && stream.isTTY) {
      stream.setRawMode(true);
    }
    this._rawMode = true;
  }

  /** Disable raw mode on stdin (if it's a TTY). */
  disableRawMode(): void {
    if (!this._rawMode) return;
    const stream = this.stdin;
    if (stream instanceof ReadStream && stream.isTTY) {
      stream.setRawMode(false);
    }
    this._rawMode = false;
  }

  /** Read the next key press from stdin. Returns null on stream end. */
  readKey(): Promise<KeyPress | null> {
    return new Promise((resolve) => {
      const onData = (buf: Buffer) => {
        cleanup();
        resolve(parseKey(buf));
      };
      const onEnd = () => {
        cleanup();
        resolve(null);
      };
      const cleanup = () => {
        this.stdin.removeListener("data", onData);
        this.stdin.removeListener("end", onEnd);
      };
      this.stdin.once("data", onData);
      this.stdin.once("end", onEnd);
    });
  }
}
