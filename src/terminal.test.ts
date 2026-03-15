import { describe, it, expect } from "vitest";
import { PassThrough } from "node:stream";
import { ansi, parseKey, Terminal } from "./terminal.js";

describe("ansi", () => {
  it("generates cursor movement sequences", () => {
    expect(ansi.cursorUp()).toBe("\x1b[1A");
    expect(ansi.cursorUp(3)).toBe("\x1b[3A");
    expect(ansi.cursorDown(2)).toBe("\x1b[2B");
    expect(ansi.cursorForward(5)).toBe("\x1b[5C");
    expect(ansi.cursorBack(1)).toBe("\x1b[1D");
  });

  it("generates cursor position sequences", () => {
    expect(ansi.cursorTo(0)).toBe("\x1b[1G");
    expect(ansi.cursorTo(4, 2)).toBe("\x1b[3;5H");
  });

  it("generates visibility sequences", () => {
    expect(ansi.cursorShow).toBe("\x1b[?25h");
    expect(ansi.cursorHide).toBe("\x1b[?25l");
  });

  it("generates erase sequences", () => {
    expect(ansi.eraseLine).toBe("\x1b[2K");
    expect(ansi.eraseDown).toBe("\x1b[J");
  });
});

describe("parseKey", () => {
  it("parses return", () => {
    expect(parseKey(Buffer.from("\r")).name).toBe("return");
    expect(parseKey(Buffer.from("\n")).name).toBe("return");
  });

  it("parses tab", () => {
    expect(parseKey(Buffer.from("\t")).name).toBe("tab");
  });

  it("parses backspace", () => {
    expect(parseKey(Buffer.from("\x7f")).name).toBe("backspace");
  });

  it("parses escape", () => {
    expect(parseKey(Buffer.from("\x1b")).name).toBe("escape");
  });

  it("parses space", () => {
    const key = parseKey(Buffer.from(" "));
    expect(key.name).toBe("space");
    expect(key.char).toBe(" ");
  });

  it("parses ctrl+c", () => {
    const key = parseKey(Buffer.from("\x03"));
    expect(key.name).toBe("c");
    expect(key.ctrl).toBe(true);
  });

  it("parses arrow keys", () => {
    expect(parseKey(Buffer.from("\x1b[A")).name).toBe("up");
    expect(parseKey(Buffer.from("\x1b[B")).name).toBe("down");
    expect(parseKey(Buffer.from("\x1b[C")).name).toBe("right");
    expect(parseKey(Buffer.from("\x1b[D")).name).toBe("left");
  });

  it("parses shift+arrow keys", () => {
    const key = parseKey(Buffer.from("\x1b[1;2A"));
    expect(key.name).toBe("up");
    expect(key.shift).toBe(true);
  });

  it("parses printable characters", () => {
    const key = parseKey(Buffer.from("a"));
    expect(key.name).toBe("a");
    expect(key.char).toBe("a");
  });
});

describe("Terminal", () => {
  it("writes to stdout stream", () => {
    const stdout = new PassThrough();
    const term = new Terminal({ stdin: new PassThrough(), stdout });
    term.write("hello");

    const data = stdout.read();
    expect(data?.toString()).toBe("hello");
  });

  it("clears line", () => {
    const stdout = new PassThrough();
    const term = new Terminal({ stdin: new PassThrough(), stdout });
    term.clearLine();

    const data = stdout.read();
    expect(data?.toString()).toBe("\x1b[2K\r");
  });

  it("hides and shows cursor", () => {
    const stdout = new PassThrough();
    const term = new Terminal({ stdin: new PassThrough(), stdout });

    term.hideCursor();
    expect(stdout.read()?.toString()).toBe("\x1b[?25l");

    term.showCursor();
    expect(stdout.read()?.toString()).toBe("\x1b[?25h");
  });

  it("reads key press from stdin", async () => {
    const stdin = new PassThrough();
    const term = new Terminal({ stdin, stdout: new PassThrough() });

    const keyPromise = term.readKey();
    stdin.write(Buffer.from("a"));
    const key = await keyPromise;

    expect(key).not.toBeNull();
    expect(key!.name).toBe("a");
    expect(key!.char).toBe("a");
  });

  it("returns null on stream end", async () => {
    const stdin = new PassThrough();
    const term = new Terminal({ stdin, stdout: new PassThrough() });

    const keyPromise = term.readKey();
    stdin.end();
    const key = await keyPromise;

    expect(key).toBeNull();
  });

  it("defaults columns to 80 for non-TTY", () => {
    const term = new Terminal({
      stdin: new PassThrough(),
      stdout: new PassThrough(),
    });
    expect(term.columns).toBe(80);
  });
});
