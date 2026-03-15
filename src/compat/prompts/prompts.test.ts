import { describe, it, expect } from "vitest";
import prompts from "./index.js";

describe("compat/prompts", () => {
  it("exports prompts function", () => {
    expect(typeof prompts).toBe("function");
  });

  it("has inject method", () => {
    expect(typeof prompts.inject).toBe("function");
  });

  it("resolves single text prompt with injection", async () => {
    prompts.inject(["alice"]);
    const response = await prompts({
      type: "text",
      name: "name",
      message: "What is your name?",
    });
    expect(response.name).toBe("alice");
  });

  it("resolves multiple prompts with injection", async () => {
    prompts.inject(["bob", true]);
    const response = await prompts([
      { type: "text", name: "name", message: "Name?" },
      { type: "confirm", name: "agree", message: "Agree?" },
    ]);
    expect(response.name).toBe("bob");
    expect(response.agree).toBe(true);
  });

  it("calls onSubmit callback", async () => {
    const submitted: string[] = [];
    prompts.inject(["value1"]);
    await prompts(
      { type: "text", name: "field", message: "Field?" },
      { onSubmit: (q) => { submitted.push(q.name); } }
    );
    expect(submitted).toEqual(["field"]);
  });

  it("handles number prompt", async () => {
    prompts.inject([42]);
    const response = await prompts({
      type: "number",
      name: "age",
      message: "Age?",
    });
    expect(response.age).toBe(42);
  });

  it("handles confirm prompt", async () => {
    prompts.inject([false]);
    const response = await prompts({
      type: "confirm",
      name: "ok",
      message: "OK?",
    });
    expect(response.ok).toBe(false);
  });

  it("handles select prompt", async () => {
    prompts.inject(["red"]);
    const response = await prompts({
      type: "select",
      name: "color",
      message: "Color?",
      choices: [
        { title: "Red", value: "red" },
        { title: "Blue", value: "blue" },
      ],
    });
    expect(response.color).toBe("red");
  });

  it("passes through type-specific options", async () => {
    prompts.inject([3.14]);
    const response = await prompts({
      type: "number",
      name: "price",
      message: "Price?",
      float: true,
      min: 0,
      max: 100,
      round: 2,
    });
    expect(response.price).toBe(3.14);
  });
});
