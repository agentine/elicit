import { describe, it, expect } from "vitest";
import elicit from "./index.js";

describe("elicit", () => {
  it("exports a default function", () => {
    expect(typeof elicit).toBe("function");
  });

  it("returns an empty answers object for an empty array", async () => {
    const answers = await elicit([]);
    expect(answers).toEqual({});
  });
});
