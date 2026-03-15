import { describe, it, expect } from "vitest";
import prompt, { Prompt } from "./index.js";

describe("compat/enquirer", () => {
  it("exports prompt function", () => {
    expect(typeof prompt).toBe("function");
  });

  it("has inject method", () => {
    expect(typeof prompt.inject).toBe("function");
  });

  it("exports Prompt class", () => {
    expect(typeof Prompt).toBe("function");
  });

  it("resolves input type (maps to text)", async () => {
    prompt.inject(["alice"]);
    const response = await prompt({
      type: "input",
      name: "name",
      message: "What is your name?",
    });
    expect(response.name).toBe("alice");
  });

  it("resolves numeral type (maps to number)", async () => {
    prompt.inject([42]);
    const response = await prompt({
      type: "numeral",
      name: "age",
      message: "Age?",
    });
    expect(response.age).toBe(42);
  });

  it("resolves boolean type (maps to confirm)", async () => {
    prompt.inject([true]);
    const response = await prompt({
      type: "boolean",
      name: "ok",
      message: "OK?",
    });
    expect(response.ok).toBe(true);
  });

  it("resolves multiple prompts", async () => {
    prompt.inject(["bob", 25]);
    const response = await prompt([
      { type: "input", name: "name", message: "Name?" },
      { type: "numeral", name: "age", message: "Age?" },
    ]);
    expect(response.name).toBe("bob");
    expect(response.age).toBe(25);
  });

  it("skips questions with skip=true", async () => {
    prompt.inject(["value"]);
    const response = await prompt([
      { type: "input", name: "skip", message: "Skip?", skip: true },
      { type: "input", name: "keep", message: "Keep?" },
    ]);
    expect(response.skip).toBeUndefined();
    expect(response.keep).toBe("value");
  });

  it("applies result transformer", async () => {
    prompt.inject(["hello"]);
    const response = await prompt({
      type: "input",
      name: "val",
      message: "Value?",
      result: (v) => String(v).toUpperCase(),
    });
    expect(response.val).toBe("HELLO");
  });

  it("maps enquirer-style choices", async () => {
    prompt.inject(["blue"]);
    const response = await prompt({
      type: "select",
      name: "color",
      message: "Color?",
      choices: [
        { name: "red", message: "Red" },
        { name: "blue", message: "Blue" },
      ],
    });
    expect(response.color).toBe("blue");
  });

  it("handles string choices", async () => {
    prompt.inject(["apple"]);
    const response = await prompt({
      type: "select",
      name: "fruit",
      message: "Fruit?",
      choices: ["apple", "banana", "cherry"],
    });
    expect(response.fruit).toBe("apple");
  });

  it("Prompt class works", async () => {
    prompt.inject(["test"]);
    const p = new Prompt({
      type: "input",
      name: "val",
      message: "Value?",
    });
    const response = await p.run();
    expect(response.val).toBe("test");
  });
});
