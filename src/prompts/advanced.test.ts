import { describe, it, expect } from "vitest";
import { SelectHandler } from "./select.js";
import { MultiSelectHandler } from "./multiselect.js";
import { AutocompleteHandler } from "./autocomplete.js";
import { DateHandler } from "./date.js";
import type { KeyPress } from "../terminal.js";
import type { Choice } from "../types.js";

function key(name: string, char = "", ctrl = false): KeyPress {
  return { name, char, ctrl, shift: false, meta: false };
}

const colors: Choice[] = [
  { title: "Red", value: "red" },
  { title: "Green", value: "green" },
  { title: "Blue", value: "blue" },
];

describe("SelectHandler", () => {
  it("starts at first choice", () => {
    const h = new SelectHandler({ message: "Color?", choices: colors });
    expect(h.getValue()).toBe("red");
  });

  it("navigates with arrow keys", () => {
    const h = new SelectHandler({ message: "Color?", choices: colors });
    h.handleKey(key("down"));
    expect(h.getValue()).toBe("green");
    h.handleKey(key("down"));
    expect(h.getValue()).toBe("blue");
    h.handleKey(key("up"));
    expect(h.getValue()).toBe("green");
  });

  it("wraps around", () => {
    const h = new SelectHandler({ message: "Color?", choices: colors });
    h.handleKey(key("up"));
    expect(h.getValue()).toBe("blue");
  });

  it("supports initial index", () => {
    const h = new SelectHandler({ message: "Color?", choices: colors, initial: 2 });
    expect(h.getValue()).toBe("blue");
  });

  it("returns true on enter", () => {
    const h = new SelectHandler({ message: "Color?", choices: colors });
    expect(h.handleKey(key("return"))).toBe(true);
  });

  it("does not submit disabled choice", () => {
    const choices: Choice[] = [
      { title: "A", value: "a", disabled: true },
      { title: "B", value: "b" },
    ];
    const h = new SelectHandler({ message: "Pick?", choices });
    expect(h.handleKey(key("return"))).toBe(false);
    h.handleKey(key("down"));
    expect(h.handleKey(key("return"))).toBe(true);
  });

  it("renders choice list", () => {
    const h = new SelectHandler({ message: "Color?", choices: colors });
    const output = h.render();
    expect(output).toContain("Color?");
    expect(output).toContain("Red");
    expect(output).toContain("Green");
    expect(output).toContain("Blue");
  });

  it("uses title when value is undefined", () => {
    const choices: Choice[] = [{ title: "Foo" }];
    const h = new SelectHandler({ message: "Pick?", choices });
    expect(h.getValue()).toBe("Foo");
  });
});

describe("MultiSelectHandler", () => {
  it("starts with no selection", () => {
    const h = new MultiSelectHandler({ message: "Colors?", choices: colors });
    expect(h.getValue()).toEqual([]);
  });

  it("selects with space", () => {
    const h = new MultiSelectHandler({ message: "Colors?", choices: colors });
    h.handleKey(key("space", " "));
    expect(h.getValue()).toEqual(["red"]);
  });

  it("deselects with space", () => {
    const h = new MultiSelectHandler({ message: "Colors?", choices: colors });
    h.handleKey(key("space", " "));
    h.handleKey(key("space", " "));
    expect(h.getValue()).toEqual([]);
  });

  it("navigates and selects multiple", () => {
    const h = new MultiSelectHandler({ message: "Colors?", choices: colors });
    h.handleKey(key("space", " ")); // select red
    h.handleKey(key("down"));
    h.handleKey(key("down"));
    h.handleKey(key("space", " ")); // select blue
    expect(h.getValue()).toEqual(["red", "blue"]);
  });

  it("respects max selection", () => {
    const h = new MultiSelectHandler({ message: "Colors?", choices: colors, max: 1 });
    h.handleKey(key("space", " ")); // select red
    h.handleKey(key("down"));
    h.handleKey(key("space", " ")); // try to select green
    expect(h.getValue()).toEqual(["red"]);
  });

  it("respects min selection", () => {
    const h = new MultiSelectHandler({ message: "Colors?", choices: colors, min: 1 });
    // Try to submit with 0 selected
    expect(h.handleKey(key("return"))).toBe(false);
    h.handleKey(key("space", " ")); // select red
    expect(h.handleKey(key("return"))).toBe(true);
  });

  it("toggle all with 'a'", () => {
    const h = new MultiSelectHandler({ message: "Colors?", choices: colors });
    h.handleKey(key("a", "a"));
    expect(h.getValue()).toEqual(["red", "green", "blue"]);
    h.handleKey(key("a", "a"));
    expect(h.getValue()).toEqual([]);
  });

  it("respects pre-selected choices", () => {
    const preselected: Choice[] = [
      { title: "Red", value: "red", selected: true },
      { title: "Green", value: "green" },
      { title: "Blue", value: "blue", selected: true },
    ];
    const h = new MultiSelectHandler({ message: "Colors?", choices: preselected });
    expect(h.getValue()).toEqual(["red", "blue"]);
  });

  it("renders check marks", () => {
    const h = new MultiSelectHandler({ message: "Colors?", choices: colors });
    h.handleKey(key("space", " "));
    const output = h.render();
    expect(output).toContain("Colors?");
  });
});

describe("AutocompleteHandler", () => {
  it("starts with all choices", () => {
    const h = new AutocompleteHandler({ message: "Color?", choices: colors });
    expect(h.getValue()).toBe("red");
  });

  it("filters on input", () => {
    const h = new AutocompleteHandler({ message: "Color?", choices: colors });
    h.handleKey(key("g", "g"));
    expect(h.getValue()).toBe("green");
  });

  it("navigates filtered list", () => {
    const h = new AutocompleteHandler({ message: "Color?", choices: colors });
    h.handleKey(key("down"));
    expect(h.getValue()).toBe("green");
    h.handleKey(key("down"));
    expect(h.getValue()).toBe("blue");
  });

  it("handles backspace", () => {
    const h = new AutocompleteHandler({ message: "Color?", choices: colors });
    h.handleKey(key("x", "x")); // no match
    h.handleKey(key("backspace")); // back to all
    expect(h.getValue()).toBe("red");
  });

  it("returns input when no matches", () => {
    const h = new AutocompleteHandler({ message: "Color?", choices: colors });
    h.handleKey(key("z", "z"));
    h.handleKey(key("z", "z"));
    expect(h.getValue()).toBe("zz");
  });

  it("does not submit on enter with no matches", () => {
    const h = new AutocompleteHandler({ message: "Color?", choices: colors });
    h.handleKey(key("z", "z"));
    h.handleKey(key("z", "z"));
    expect(h.handleKey(key("return"))).toBe(false);
  });

  it("submits on enter with matches", () => {
    const h = new AutocompleteHandler({ message: "Color?", choices: colors });
    expect(h.handleKey(key("return"))).toBe(true);
  });

  it("renders input and choices", () => {
    const h = new AutocompleteHandler({ message: "Color?", choices: colors });
    const output = h.render();
    expect(output).toContain("Color?");
    expect(output).toContain("Red");
  });

  it("shows no matches message", () => {
    const h = new AutocompleteHandler({ message: "Color?", choices: colors });
    h.handleKey(key("z", "z"));
    h.handleKey(key("z", "z"));
    h.handleKey(key("z", "z"));
    const output = h.render();
    expect(output).toContain("No matches");
  });

  it("uses custom suggest function", () => {
    const suggest = (input: string, choices: Choice[]) =>
      choices.filter((c) => c.title.startsWith(input.toUpperCase()));
    const h = new AutocompleteHandler({
      message: "Color?",
      choices: colors,
      suggest,
    });
    h.handleKey(key("r", "r")); // uppercase R matches Red
    // With our suggest, "r" -> "R" startsWith check
    expect(h.getValue()).toBe("red");
  });
});

describe("DateHandler", () => {
  const fixedDate = new Date(2026, 2, 15, 10, 30); // March 15, 2026 10:30

  it("uses initial date", () => {
    const h = new DateHandler({ message: "Date?", initial: fixedDate });
    const val = h.getValue();
    expect(val.getFullYear()).toBe(2026);
    expect(val.getMonth()).toBe(2);
    expect(val.getDate()).toBe(15);
  });

  it("increments month with up arrow", () => {
    const h = new DateHandler({ message: "Date?", initial: fixedDate });
    h.handleKey(key("up"));
    expect(h.getValue().getMonth()).toBe(3); // April
  });

  it("decrements month with down arrow", () => {
    const h = new DateHandler({ message: "Date?", initial: fixedDate });
    h.handleKey(key("down"));
    expect(h.getValue().getMonth()).toBe(1); // February
  });

  it("moves to day segment with right arrow", () => {
    const h = new DateHandler({ message: "Date?", initial: fixedDate });
    h.handleKey(key("right")); // now on day
    h.handleKey(key("up"));
    expect(h.getValue().getDate()).toBe(16);
  });

  it("moves to year segment", () => {
    const h = new DateHandler({ message: "Date?", initial: fixedDate });
    h.handleKey(key("right")); // day
    h.handleKey(key("right")); // year
    h.handleKey(key("up"));
    expect(h.getValue().getFullYear()).toBe(2027);
  });

  it("moves to hours and minutes", () => {
    const h = new DateHandler({ message: "Date?", initial: fixedDate });
    h.handleKey(key("right")); // day
    h.handleKey(key("right")); // year
    h.handleKey(key("right")); // hours
    h.handleKey(key("up"));
    expect(h.getValue().getHours()).toBe(11);

    h.handleKey(key("right")); // minutes
    h.handleKey(key("up"));
    expect(h.getValue().getMinutes()).toBe(31);
  });

  it("wraps segments with left arrow", () => {
    const h = new DateHandler({ message: "Date?", initial: fixedDate });
    h.handleKey(key("left")); // wrap to minutes
    h.handleKey(key("up"));
    expect(h.getValue().getMinutes()).toBe(31);
  });

  it("returns true on enter", () => {
    const h = new DateHandler({ message: "Date?", initial: fixedDate });
    expect(h.handleKey(key("return"))).toBe(true);
  });

  it("renders date display", () => {
    const h = new DateHandler({ message: "Date?", initial: fixedDate });
    const output = h.render();
    expect(output).toContain("Date?");
    expect(output).toContain("03");
    expect(output).toContain("15");
    expect(output).toContain("2026");
  });
});
