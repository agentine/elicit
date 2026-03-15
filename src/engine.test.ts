import { describe, it, expect } from "vitest";
import { PassThrough } from "node:stream";
import { Terminal } from "./terminal.js";
import { PromptEngine } from "./engine.js";
import type { PromptHandler } from "./engine.js";

function makeTerminal() {
  const stdin = new PassThrough();
  const stdout = new PassThrough();
  const terminal = new Terminal({ stdin, stdout });
  return { stdin, stdout, terminal };
}

function makeHandler(opts: {
  value?: unknown;
  display?: string;
  submitOnReturn?: boolean;
}): PromptHandler {
  let value = opts.value ?? "";
  return {
    render: () => `? What is your name? › ${String(value)}`,
    handleKey(key) {
      if (opts.submitOnReturn !== false && key.name === "return") return true;
      if (key.char) value = String(value) + key.char;
      return false;
    },
    getValue: () => value,
    getDisplayValue: () => opts.display ?? String(value),
  };
}

describe("PromptEngine", () => {
  it("runs a prompt to submission on enter", async () => {
    const { stdin, terminal } = makeTerminal();
    const handler = makeHandler({ value: "alice" });
    const engine = new PromptEngine({
      terminal,
      handler,
      message: "? What is your name?",
    });

    const resultPromise = engine.run();
    // Simulate pressing enter
    stdin.write(Buffer.from("\r"));
    const result = await resultPromise;

    expect(result).toBe("alice");
  });

  it("returns undefined on Ctrl+C", async () => {
    const { stdin, terminal } = makeTerminal();
    const handler = makeHandler({ value: "test" });
    const engine = new PromptEngine({
      terminal,
      handler,
      message: "? Name?",
    });

    const resultPromise = engine.run();
    stdin.write(Buffer.from("\x03")); // Ctrl+C
    const result = await resultPromise;

    expect(result).toBeUndefined();
  });

  it("returns undefined on stream end", async () => {
    const { stdin, terminal } = makeTerminal();
    const handler = makeHandler({ value: "test" });
    const engine = new PromptEngine({
      terminal,
      handler,
      message: "? Name?",
    });

    const resultPromise = engine.run();
    stdin.end();
    const result = await resultPromise;

    expect(result).toBeUndefined();
  });

  it("calls onState with lifecycle states", async () => {
    const { stdin, terminal } = makeTerminal();
    const handler = makeHandler({ value: "bob" });
    const states: string[] = [];
    const engine = new PromptEngine({
      terminal,
      handler,
      message: "? Name?",
      onState: (s) => states.push(s.state),
    });

    const resultPromise = engine.run();
    stdin.write(Buffer.from("\r"));
    await resultPromise;

    expect(states).toContain("active");
    expect(states).toContain("submit");
  });

  it("validates and shows error on failure", async () => {
    const { stdin, stdout, terminal } = makeTerminal();
    const handler = makeHandler({ value: "" });
    const engine = new PromptEngine({
      terminal,
      handler,
      message: "? Name?",
      validate: (v) => (v === "" ? "Required" : true),
    });

    const resultPromise = engine.run();

    // First enter with empty value — should fail validation
    stdin.write(Buffer.from("\r"));

    // Wait a tick for the validation to run and re-render
    await new Promise((r) => setTimeout(r, 50));

    // Check that error was written to stdout
    const output = stdout.read()?.toString() ?? "";
    expect(output).toContain("Required");

    // Now type something and submit
    stdin.write(Buffer.from("a"));
    await new Promise((r) => setTimeout(r, 10));
    stdin.write(Buffer.from("\r"));

    const result = await resultPromise;
    expect(result).toBe("a");
  });

  it("calls onState cancel on Ctrl+C", async () => {
    const { stdin, terminal } = makeTerminal();
    const handler = makeHandler({});
    const states: { state: string; aborted: boolean }[] = [];
    const engine = new PromptEngine({
      terminal,
      handler,
      message: "? Name?",
      onState: (s) => states.push({ state: s.state, aborted: s.aborted }),
    });

    const resultPromise = engine.run();
    stdin.write(Buffer.from("\x03"));
    await resultPromise;

    const cancelState = states.find((s) => s.state === "cancel");
    expect(cancelState).toBeDefined();
    expect(cancelState!.aborted).toBe(true);
  });
});
