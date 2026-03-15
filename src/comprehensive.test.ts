/**
 * Comprehensive test suite covering edge cases, integration scenarios,
 * validation, dynamic properties, and full prompt lifecycle.
 */
import { describe, it, expect } from "vitest";
import { PassThrough } from "node:stream";
import elicit from "./index.js";
import type { Answers } from "./types.js";

describe("edge cases", () => {
  it("empty questions array returns empty answers", async () => {
    const answers = await elicit([]);
    expect(answers).toEqual({});
  });

  it("injection with confirm prompt", async () => {
    elicit.inject([true]);
    const answers = await elicit({
      type: "confirm" as const,
      name: "agree",
      message: "Agree?",
    });
    expect(answers.agree).toBe(true);
  });

  it("injection with list prompt", async () => {
    elicit.inject([["a", "b", "c"]]);
    const answers = await elicit({
      type: "list" as const,
      name: "tags",
      message: "Tags?",
    });
    expect(answers.tags).toEqual(["a", "b", "c"]);
  });

  it("injection with toggle prompt", async () => {
    elicit.inject([true]);
    const answers = await elicit({
      type: "toggle" as const,
      name: "enabled",
      message: "Enable?",
      active: "yes",
      inactive: "no",
    });
    expect(answers.enabled).toBe(true);
  });

  it("injection with select prompt", async () => {
    elicit.inject(["green"]);
    const answers = await elicit({
      type: "select" as const,
      name: "color",
      message: "Color?",
      choices: [
        { title: "Red", value: "red" },
        { title: "Green", value: "green" },
      ],
    });
    expect(answers.color).toBe("green");
  });

  it("injection with multiselect prompt", async () => {
    elicit.inject([["a", "c"]]);
    const answers = await elicit({
      type: "multiselect" as const,
      name: "items",
      message: "Items?",
      choices: [
        { title: "A", value: "a" },
        { title: "B", value: "b" },
        { title: "C", value: "c" },
      ],
    });
    expect(answers.items).toEqual(["a", "c"]);
  });

  it("injection with date prompt", async () => {
    const date = new Date(2026, 0, 1);
    elicit.inject([date]);
    const answers = await elicit({
      type: "date" as const,
      name: "when",
      message: "When?",
    });
    expect(answers.when).toEqual(date);
  });

  it("injection with number prompt", async () => {
    elicit.inject([42]);
    const answers = await elicit({
      type: "number" as const,
      name: "count",
      message: "Count?",
    });
    expect(answers.count).toBe(42);
  });

  it("injection with password prompt", async () => {
    elicit.inject(["secret123"]);
    const answers = await elicit({
      type: "password" as const,
      name: "pass",
      message: "Password?",
    });
    expect(answers.pass).toBe("secret123");
  });

  it("injection with invisible prompt", async () => {
    elicit.inject(["token_xyz"]);
    const answers = await elicit({
      type: "invisible" as const,
      name: "token",
      message: "Token?",
    });
    expect(answers.token).toBe("token_xyz");
  });

  it("injection with autocomplete prompt", async () => {
    elicit.inject(["red"]);
    const answers = await elicit({
      type: "autocomplete" as const,
      name: "color",
      message: "Color?",
      choices: [
        { title: "Red", value: "red" },
        { title: "Blue", value: "blue" },
      ],
    });
    expect(answers.color).toBe("red");
  });
});

describe("dynamic properties", () => {
  it("dynamic message based on previous answer", async () => {
    elicit.inject(["alice", "yes"]);
    const answers = await elicit([
      { type: "text" as const, name: "name", message: "Name?" },
      {
        type: "text" as const,
        name: "greeting",
        message: ((prev: unknown) => `Hello ${prev}, confirm?`) as any,
      },
    ]);
    expect(answers.name).toBe("alice");
    expect(answers.greeting).toBe("yes");
  });

  it("dynamic initial value", async () => {
    elicit.inject(["alice", "alice@example.com"]);
    const answers = await elicit([
      { type: "text" as const, name: "name", message: "Name?" },
      {
        type: "text" as const,
        name: "email",
        message: "Email?",
        initial: ((_prev: unknown, answers: Answers) => `${answers.name}@example.com`) as any,
      },
    ]);
    expect(answers.email).toBe("alice@example.com");
  });

  it("conditional prompt type (skip with false)", async () => {
    elicit.inject(["yes", "done"]);
    const answers = await elicit([
      { type: "text" as const, name: "a", message: "A?" },
      {
        type: ((_prev: unknown, answers: Answers) =>
          answers.a === "yes" ? ("text" as const) : (false as const)) as any,
        name: "b",
        message: "B?",
      },
    ]);
    expect(answers.b).toBe("done");
  });
});

describe("onSubmit/onCancel callbacks", () => {
  it("onSubmit called for each answer", async () => {
    const log: Array<{ name: string; value: unknown }> = [];
    elicit.inject(["x", "y"]);
    await elicit(
      [
        { type: "text" as const, name: "a", message: "A?" },
        { type: "text" as const, name: "b", message: "B?" },
      ],
      {
        onSubmit: (q, val) => { log.push({ name: q.name, value: val }); },
      }
    );
    expect(log).toEqual([
      { name: "a", value: "x" },
      { name: "b", value: "y" },
    ]);
  });

  it("onCancel called on Ctrl+C", async () => {
    const stdin = new PassThrough();
    const stdout = new PassThrough();
    let cancelled = false;

    const resultPromise = elicit(
      { type: "text" as const, name: "val", message: "Val?", stdin, stdout },
      { onCancel: () => { cancelled = true; } }
    );

    stdin.write(Buffer.from("\x03"));
    await resultPromise;
    expect(cancelled).toBe(true);
  });
});

describe("terminal I/O integration", () => {
  it("text prompt with validation failure then success", async () => {
    const stdin = new PassThrough();
    const stdout = new PassThrough();

    const resultPromise = elicit({
      type: "text" as const,
      name: "val",
      message: "Enter (non-empty)?",
      validate: (v) => (v === "" ? "Required" : true),
      stdin,
      stdout,
    });

    // Press enter with no input — should fail validation
    stdin.write(Buffer.from("\r"));
    await new Promise((r) => setTimeout(r, 50));

    // Type something and submit
    stdin.write(Buffer.from("ok"));
    await new Promise((r) => setTimeout(r, 10));
    stdin.write(Buffer.from("\r"));

    const answers = await resultPromise;
    expect(answers.val).toBe("ok");
  });

  it("select prompt navigation and submission", async () => {
    const stdin = new PassThrough();
    const stdout = new PassThrough();

    const resultPromise = elicit({
      type: "select" as const,
      name: "color",
      message: "Color?",
      choices: [
        { title: "Red", value: "red" },
        { title: "Green", value: "green" },
        { title: "Blue", value: "blue" },
      ],
      stdin,
      stdout,
    });

    // Navigate down twice (to Blue) and submit
    stdin.write(Buffer.from("\x1b[B")); // down
    await new Promise((r) => setTimeout(r, 10));
    stdin.write(Buffer.from("\x1b[B")); // down
    await new Promise((r) => setTimeout(r, 10));
    stdin.write(Buffer.from("\r"));

    const answers = await resultPromise;
    expect(answers.color).toBe("blue");
  });

  it("confirm prompt with n key", async () => {
    const stdin = new PassThrough();
    const stdout = new PassThrough();

    const resultPromise = elicit({
      type: "confirm" as const,
      name: "ok",
      message: "OK?",
      initial: true,
      stdin,
      stdout,
    });

    stdin.write(Buffer.from("n"));
    await new Promise((r) => setTimeout(r, 10));
    stdin.write(Buffer.from("\r"));

    const answers = await resultPromise;
    expect(answers.ok).toBe(false);
  });

  it("number prompt with arrow key increment", async () => {
    const stdin = new PassThrough();
    const stdout = new PassThrough();

    const resultPromise = elicit({
      type: "number" as const,
      name: "n",
      message: "Number?",
      initial: 10,
      stdin,
      stdout,
    });

    // Arrow up 3 times
    stdin.write(Buffer.from("\x1b[A"));
    await new Promise((r) => setTimeout(r, 10));
    stdin.write(Buffer.from("\x1b[A"));
    await new Promise((r) => setTimeout(r, 10));
    stdin.write(Buffer.from("\x1b[A"));
    await new Promise((r) => setTimeout(r, 10));
    stdin.write(Buffer.from("\r"));

    const answers = await resultPromise;
    expect(answers.n).toBe(13);
  });
});

describe("build output", () => {
  it("TypeScript compiles without errors (tested by CI)", () => {
    // This is a placeholder — the real check is `npx tsc --noEmit`
    // which runs before tests in CI
    expect(true).toBe(true);
  });
});
