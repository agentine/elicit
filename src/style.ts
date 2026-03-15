/** Built-in ANSI color/style utilities — zero external dependencies. */

const ESC = "\x1b[";
const RESET = `${ESC}0m`;

type StyleFn = (s: string) => string;

function wrap(open: string, close: string): StyleFn {
  const openCode = `${ESC}${open}m`;
  const closeCode = `${ESC}${close}m`;
  return (s: string) => {
    if (s === "") return s;
    // Handle nested resets by replacing inner close with reopen
    return openCode + s.replace(new RegExp(escapeRegex(closeCode), "g"), closeCode + openCode) + closeCode;
  };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ── Modifiers ──────────────────────────────────────────────────────────

export const reset: StyleFn = () => RESET;
export const bold: StyleFn = wrap("1", "22");
export const dim: StyleFn = wrap("2", "22");
export const italic: StyleFn = wrap("3", "23");
export const underline: StyleFn = wrap("4", "24");
export const inverse: StyleFn = wrap("7", "27");
export const hidden: StyleFn = wrap("8", "28");
export const strikethrough: StyleFn = wrap("9", "29");

// ── Foreground colors ──────────────────────────────────────────────────

export const black: StyleFn = wrap("30", "39");
export const red: StyleFn = wrap("31", "39");
export const green: StyleFn = wrap("32", "39");
export const yellow: StyleFn = wrap("33", "39");
export const blue: StyleFn = wrap("34", "39");
export const magenta: StyleFn = wrap("35", "39");
export const cyan: StyleFn = wrap("36", "39");
export const white: StyleFn = wrap("37", "39");
export const gray: StyleFn = wrap("90", "39");
export const grey: StyleFn = gray;

// Bright foreground
export const redBright: StyleFn = wrap("91", "39");
export const greenBright: StyleFn = wrap("92", "39");
export const yellowBright: StyleFn = wrap("93", "39");
export const blueBright: StyleFn = wrap("94", "39");
export const magentaBright: StyleFn = wrap("95", "39");
export const cyanBright: StyleFn = wrap("96", "39");
export const whiteBright: StyleFn = wrap("97", "39");

// ── Background colors ──────────────────────────────────────────────────

export const bgBlack: StyleFn = wrap("40", "49");
export const bgRed: StyleFn = wrap("41", "49");
export const bgGreen: StyleFn = wrap("42", "49");
export const bgYellow: StyleFn = wrap("43", "49");
export const bgBlue: StyleFn = wrap("44", "49");
export const bgMagenta: StyleFn = wrap("45", "49");
export const bgCyan: StyleFn = wrap("46", "49");
export const bgWhite: StyleFn = wrap("47", "49");

// ── Utility ────────────────────────────────────────────────────────────

/** Strip all ANSI escape codes from a string. */
export function strip(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*m/g, "");
}

/** Visible length of a string (stripping ANSI codes). */
export function visibleLength(s: string): number {
  return strip(s).length;
}

/** Default style bundle used by prompt rendering. */
export const style = {
  // Modifiers
  reset,
  bold,
  dim,
  italic,
  underline,
  inverse,
  hidden,
  strikethrough,

  // Colors
  black,
  red,
  green,
  yellow,
  blue,
  magenta,
  cyan,
  white,
  gray,
  grey,
  redBright,
  greenBright,
  yellowBright,
  blueBright,
  magentaBright,
  cyanBright,
  whiteBright,

  // Background
  bgBlack,
  bgRed,
  bgGreen,
  bgYellow,
  bgBlue,
  bgMagenta,
  bgCyan,
  bgWhite,

  // Utility
  strip,
  visibleLength,
} as const;

export default style;
