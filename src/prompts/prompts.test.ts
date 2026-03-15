import { describe, it, expect } from "vitest";
import { TextHandler } from "./text.js";
import { PasswordHandler } from "./password.js";
import { InvisibleHandler } from "./invisible.js";
import { NumberHandler } from "./number.js";
import { ConfirmHandler } from "./confirm.js";
import { ListHandler } from "./list.js";
import { ToggleHandler } from "./toggle.js";
import type { KeyPress } from "../terminal.js";

function key(name: string, char = "", ctrl = false): KeyPress {
  return { name, char, ctrl, shift: false, meta: false };
}

function charKey(c: string): KeyPress {
  return key(c, c);
}

describe("TextHandler", () => {
  it("starts with initial value", () => {
    const h = new TextHandler({ message: "Name?", initial: "alice" });
    expect(h.getValue()).toBe("alice");
  });

  it("accumulates typed characters", () => {
    const h = new TextHandler({ message: "Name?" });
    h.handleKey(charKey("h"));
    h.handleKey(charKey("i"));
    expect(h.getValue()).toBe("hi");
  });

  it("handles backspace", () => {
    const h = new TextHandler({ message: "Name?", initial: "abc" });
    h.handleKey(key("backspace"));
    expect(h.getValue()).toBe("ab");
  });

  it("handles delete", () => {
    const h = new TextHandler({ message: "Name?", initial: "abc" });
    h.handleKey(key("home")); // move cursor to start
    h.handleKey(key("delete"));
    expect(h.getValue()).toBe("bc");
  });

  it("moves cursor with arrow keys", () => {
    const h = new TextHandler({ message: "Name?", initial: "abc" });
    h.handleKey(key("left"));
    h.handleKey(charKey("X"));
    expect(h.getValue()).toBe("abXc");
  });

  it("returns true on enter", () => {
    const h = new TextHandler({ message: "Name?" });
    expect(h.handleKey(key("return"))).toBe(true);
  });

  it("renders prompt with message", () => {
    const h = new TextHandler({ message: "Name?", initial: "bob" });
    const output = h.render();
    expect(output).toContain("Name?");
    expect(output).toContain("bob");
  });

  it("getDisplayValue returns styled value", () => {
    const h = new TextHandler({ message: "Name?", initial: "test" });
    const display = h.getDisplayValue();
    expect(display).toContain("test");
  });
});

describe("PasswordHandler", () => {
  it("accumulates typed characters", () => {
    const h = new PasswordHandler({ message: "Pass?" });
    h.handleKey(charKey("s"));
    h.handleKey(charKey("e"));
    h.handleKey(charKey("c"));
    expect(h.getValue()).toBe("sec");
  });

  it("renders masked output", () => {
    const h = new PasswordHandler({ message: "Pass?" });
    h.handleKey(charKey("a"));
    h.handleKey(charKey("b"));
    const output = h.render();
    expect(output).toContain("**");
    expect(output).not.toContain("ab");
  });

  it("handles backspace", () => {
    const h = new PasswordHandler({ message: "Pass?" });
    h.handleKey(charKey("a"));
    h.handleKey(charKey("b"));
    h.handleKey(key("backspace"));
    expect(h.getValue()).toBe("a");
  });

  it("returns true on enter", () => {
    const h = new PasswordHandler({ message: "Pass?" });
    expect(h.handleKey(key("return"))).toBe(true);
  });
});

describe("InvisibleHandler", () => {
  it("accumulates typed characters invisibly", () => {
    const h = new InvisibleHandler({ message: "Token?" });
    h.handleKey(charKey("x"));
    h.handleKey(charKey("y"));
    expect(h.getValue()).toBe("xy");
  });

  it("renders without showing value", () => {
    const h = new InvisibleHandler({ message: "Token?" });
    h.handleKey(charKey("s"));
    const output = h.render();
    expect(output).toContain("Token?");
    expect(output).not.toContain("s");
  });

  it("getDisplayValue shows [hidden]", () => {
    const h = new InvisibleHandler({ message: "Token?" });
    h.handleKey(charKey("x"));
    expect(h.getDisplayValue()).toContain("[hidden]");
  });
});

describe("NumberHandler", () => {
  it("starts with initial value", () => {
    const h = new NumberHandler({ message: "Age?", initial: 25 });
    expect(h.getValue()).toBe(25);
  });

  it("accepts digit input", () => {
    const h = new NumberHandler({ message: "Age?" });
    h.handleKey(charKey("4"));
    h.handleKey(charKey("2"));
    expect(h.getValue()).toBe(42);
  });

  it("handles negative numbers", () => {
    const h = new NumberHandler({ message: "Offset?" });
    h.handleKey(charKey("-"));
    h.handleKey(charKey("5"));
    expect(h.getValue()).toBe(-5);
  });

  it("respects min/max", () => {
    const h = new NumberHandler({ message: "Age?", min: 0, max: 120 });
    h.handleKey(charKey("9"));
    h.handleKey(charKey("9"));
    h.handleKey(charKey("9"));
    expect(h.getValue()).toBe(120);
  });

  it("handles float mode", () => {
    const h = new NumberHandler({ message: "Price?", float: true, round: 2 });
    h.handleKey(charKey("3"));
    h.handleKey(charKey("."));
    h.handleKey(charKey("1"));
    h.handleKey(charKey("4"));
    expect(h.getValue()).toBe(3.14);
  });

  it("increments/decrements with arrow keys", () => {
    const h = new NumberHandler({ message: "N?", initial: 5, increment: 2 });
    h.handleKey(key("up"));
    expect(h.getValue()).toBe(7);
    h.handleKey(key("down"));
    h.handleKey(key("down"));
    expect(h.getValue()).toBe(3);
  });

  it("returns undefined for empty input", () => {
    const h = new NumberHandler({ message: "N?" });
    expect(h.getValue()).toBeUndefined();
  });

  it("ignores non-numeric chars", () => {
    const h = new NumberHandler({ message: "N?" });
    h.handleKey(charKey("a"));
    h.handleKey(charKey("3"));
    expect(h.getValue()).toBe(3);
  });
});

describe("ConfirmHandler", () => {
  it("defaults to false", () => {
    const h = new ConfirmHandler({ message: "OK?" });
    expect(h.getValue()).toBe(false);
  });

  it("starts with initial=true", () => {
    const h = new ConfirmHandler({ message: "OK?", initial: true });
    expect(h.getValue()).toBe(true);
  });

  it("toggles with y/n", () => {
    const h = new ConfirmHandler({ message: "OK?" });
    h.handleKey(charKey("y"));
    expect(h.getValue()).toBe(true);
    h.handleKey(charKey("n"));
    expect(h.getValue()).toBe(false);
  });

  it("toggles with arrow keys", () => {
    const h = new ConfirmHandler({ message: "OK?" });
    h.handleKey(key("right"));
    expect(h.getValue()).toBe(true);
    h.handleKey(key("left"));
    expect(h.getValue()).toBe(false);
  });

  it("renders Y/N hint", () => {
    const h = new ConfirmHandler({ message: "OK?", initial: true });
    expect(h.render()).toContain("OK?");
  });

  it("getDisplayValue returns yes/no", () => {
    const h = new ConfirmHandler({ message: "OK?", initial: true });
    expect(h.getDisplayValue()).toContain("yes");
  });
});

describe("ListHandler", () => {
  it("splits by comma", () => {
    const h = new ListHandler({ message: "Tags?" });
    "a,b,c".split("").forEach((c) => h.handleKey(charKey(c)));
    expect(h.getValue()).toEqual(["a", "b", "c"]);
  });

  it("trims whitespace", () => {
    const h = new ListHandler({ message: "Tags?", initial: " a , b , c " });
    expect(h.getValue()).toEqual(["a", "b", "c"]);
  });

  it("uses custom separator", () => {
    const h = new ListHandler({ message: "Items?", separator: "|" });
    "x|y".split("").forEach((c) => h.handleKey(charKey(c)));
    expect(h.getValue()).toEqual(["x", "y"]);
  });

  it("filters empty entries", () => {
    const h = new ListHandler({ message: "Tags?", initial: "a,,b," });
    expect(h.getValue()).toEqual(["a", "b"]);
  });

  it("handles backspace", () => {
    const h = new ListHandler({ message: "Tags?", initial: "ab" });
    h.handleKey(key("backspace"));
    expect(h.getValue()).toEqual(["a"]);
  });
});

describe("ToggleHandler", () => {
  it("defaults to false (inactive)", () => {
    const h = new ToggleHandler({ message: "Enable?" });
    expect(h.getValue()).toBe(false);
  });

  it("starts with initial=true", () => {
    const h = new ToggleHandler({ message: "Enable?", initial: true });
    expect(h.getValue()).toBe(true);
  });

  it("toggles with space/tab/arrows", () => {
    const h = new ToggleHandler({ message: "Enable?" });
    h.handleKey(key("space", " "));
    expect(h.getValue()).toBe(true);
    h.handleKey(key("tab"));
    expect(h.getValue()).toBe(false);
    h.handleKey(key("right"));
    expect(h.getValue()).toBe(true);
    h.handleKey(key("left"));
    expect(h.getValue()).toBe(false);
  });

  it("handles y/n/1/0", () => {
    const h = new ToggleHandler({ message: "Enable?" });
    h.handleKey(charKey("y"));
    expect(h.getValue()).toBe(true);
    h.handleKey(charKey("0"));
    expect(h.getValue()).toBe(false);
    h.handleKey(charKey("1"));
    expect(h.getValue()).toBe(true);
    h.handleKey(charKey("n"));
    expect(h.getValue()).toBe(false);
  });

  it("uses custom labels", () => {
    const h = new ToggleHandler({
      message: "Enable?",
      initial: true,
      active: "yes",
      inactive: "no",
    });
    expect(h.getDisplayValue()).toContain("yes");
    h.handleKey(key("space", " "));
    expect(h.getDisplayValue()).toContain("no");
  });
});
