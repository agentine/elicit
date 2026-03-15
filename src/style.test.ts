import { describe, it, expect } from "vitest";
import { bold, red, green, dim, underline, cyan, strip, visibleLength, style } from "./style.js";

describe("style", () => {
  it("applies bold", () => {
    const s = bold("hello");
    expect(s).toBe("\x1b[1mhello\x1b[22m");
  });

  it("applies red foreground", () => {
    const s = red("error");
    expect(s).toBe("\x1b[31merror\x1b[39m");
  });

  it("applies green foreground", () => {
    const s = green("ok");
    expect(s).toBe("\x1b[32mok\x1b[39m");
  });

  it("applies dim", () => {
    const s = dim("faded");
    expect(s).toBe("\x1b[2mfaded\x1b[22m");
  });

  it("applies underline", () => {
    const s = underline("link");
    expect(s).toBe("\x1b[4mlink\x1b[24m");
  });

  it("nests styles correctly", () => {
    const s = bold(red("important"));
    expect(s).toContain("\x1b[1m");
    expect(s).toContain("\x1b[31m");
  });

  it("returns empty string for empty input", () => {
    expect(bold("")).toBe("");
    expect(red("")).toBe("");
  });

  it("strips ANSI codes", () => {
    expect(strip(bold("hello"))).toBe("hello");
    expect(strip(red(bold("test")))).toBe("test");
    expect(strip("plain")).toBe("plain");
  });

  it("calculates visible length", () => {
    expect(visibleLength(cyan("hello"))).toBe(5);
    expect(visibleLength(bold(red("ab")))).toBe(2);
    expect(visibleLength("plain")).toBe(5);
  });

  it("exports all styles on default bundle", () => {
    expect(typeof style.bold).toBe("function");
    expect(typeof style.red).toBe("function");
    expect(typeof style.strip).toBe("function");
    expect(typeof style.visibleLength).toBe("function");
  });
});
