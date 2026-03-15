import { describe, it, expect } from "vitest";
import { PassThrough } from "node:stream";
import elicit from "./index.js";

describe("elicit", () => {
  it("exports a default function", () => {
    expect(typeof elicit).toBe("function");
  });

  it("returns an empty answers object for an empty array", async () => {
    const answers = await elicit([]);
    expect(answers).toEqual({});
  });

  it("has inject method for testing", () => {
    expect(typeof elicit.inject).toBe("function");
  });
});

describe("elicit with injection", () => {
  it("resolves single text prompt with injected value", async () => {
    elicit.inject(["alice"]);
    const answers = await elicit({
      type: "text" as const,
      name: "name",
      message: "What is your name?",
    });
    expect(answers.name).toBe("alice");
  });

  it("resolves multiple prompts with injected values", async () => {
    elicit.inject(["bob", 25]);
    const answers = await elicit([
      { type: "text" as const, name: "name", message: "Name?" },
      { type: "number" as const, name: "age", message: "Age?" },
    ]);
    expect(answers.name).toBe("bob");
    expect(answers.age).toBe(25);
  });

  it("calls onSubmit for each prompt", async () => {
    const submitted: string[] = [];
    elicit.inject(["yes", "no"]);
    await elicit(
      [
        { type: "text" as const, name: "a", message: "A?" },
        { type: "text" as const, name: "b", message: "B?" },
      ],
      { onSubmit: (q) => { submitted.push(q.name); } }
    );
    expect(submitted).toEqual(["a", "b"]);
  });

  it("skips prompts with type=false", async () => {
    elicit.inject(["val"]);
    const answers = await elicit([
      { type: false as const, name: "skip", message: "Skip?" } as any,
      { type: "text" as const, name: "keep", message: "Keep?" },
    ]);
    expect(answers.skip).toBeUndefined();
    expect(answers.keep).toBe("val");
  });

  it("supports dynamic type function", async () => {
    elicit.inject(["first", "second"]);
    const answers = await elicit([
      { type: "text" as const, name: "a", message: "A?" },
      {
        type: ((_prev: unknown, answers: Record<string, unknown>) =>
          answers.a === "first" ? "text" : false) as any,
        name: "b",
        message: "B?",
      },
    ]);
    expect(answers.a).toBe("first");
    expect(answers.b).toBe("second");
  });
});

describe("elicit with terminal I/O", () => {
  it("runs text prompt with keyboard input", async () => {
    const stdin = new PassThrough();
    const stdout = new PassThrough();

    const resultPromise = elicit({
      type: "text" as const,
      name: "name",
      message: "Name?",
      stdin,
      stdout,
    });

    // Type "hi" then press enter
    stdin.write(Buffer.from("h"));
    stdin.write(Buffer.from("i"));
    await new Promise((r) => setTimeout(r, 10));
    stdin.write(Buffer.from("\r"));

    const answers = await resultPromise;
    expect(answers.name).toBe("hi");
  });

  it("runs confirm prompt with y key", async () => {
    const stdin = new PassThrough();
    const stdout = new PassThrough();

    const resultPromise = elicit({
      type: "confirm" as const,
      name: "ok",
      message: "OK?",
      stdin,
      stdout,
    });

    stdin.write(Buffer.from("y"));
    await new Promise((r) => setTimeout(r, 10));
    stdin.write(Buffer.from("\r"));

    const answers = await resultPromise;
    expect(answers.ok).toBe(true);
  });

  it("handles Ctrl+C abort", async () => {
    const stdin = new PassThrough();
    const stdout = new PassThrough();

    const resultPromise = elicit({
      type: "text" as const,
      name: "name",
      message: "Name?",
      stdin,
      stdout,
    });

    stdin.write(Buffer.from("\x03")); // Ctrl+C

    const answers = await resultPromise;
    expect(answers.name).toBeUndefined();
  });
});
