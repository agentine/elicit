/**
 * @agentine/elicit/compat/enquirer
 *
 * Compatibility adapter matching enquirer API.
 * Class-based Prompt interface, prompt() function, type name mapping.
 */

import elicit from "../../index.js";
import type { Question, Choice } from "../../types.js";

/** Enquirer type name → elicit type name mapping. */
const TYPE_MAP: Record<string, string> = {
  input: "text",
  numeral: "number",
  boolean: "confirm",
  quiz: "select",
  survey: "multiselect",
  scale: "multiselect",
  snippet: "text",
  sort: "multiselect",
  form: "text",
  // Direct mappings
  text: "text",
  password: "password",
  invisible: "invisible",
  number: "number",
  confirm: "confirm",
  list: "list",
  toggle: "toggle",
  select: "select",
  multiselect: "multiselect",
  autocomplete: "autocomplete",
  date: "date",
};

/** Enquirer-style question options. */
export interface EnquirerQuestion {
  type: string;
  name: string;
  message: string;
  initial?: unknown;
  format?: (value: unknown) => unknown;
  validate?: (value: unknown) => boolean | string | Promise<boolean | string>;
  result?: (value: unknown) => unknown;
  skip?: boolean | (() => boolean);

  // Type-specific
  choices?: Array<string | { name: string; message?: string; value?: unknown; hint?: string; disabled?: boolean | string; role?: string }>;
  min?: number;
  max?: number;
  float?: boolean;
  round?: number;
  increment?: number;
  separator?: string;
  active?: string;
  inactive?: string;
  hint?: string;
  limit?: number;
  suggest?: (input: string, choices: unknown[]) => Promise<unknown[]> | unknown[];
  mask?: string;
  stdin?: NodeJS.ReadableStream;
  stdout?: NodeJS.WritableStream;
}

/** Map enquirer choices to elicit choices. */
function mapChoices(
  choices?: EnquirerQuestion["choices"]
): Choice[] | undefined {
  if (!choices) return undefined;
  return choices.map((c) => {
    if (typeof c === "string") {
      return { title: c, value: c };
    }
    return {
      title: c.message ?? c.name,
      value: c.value ?? c.name,
      description: c.hint,
      disabled: !!c.disabled,
    };
  });
}

/** Map an enquirer-style question to an elicit Question. */
function mapQuestion(q: EnquirerQuestion): Question | null {
  const skip = typeof q.skip === "function" ? q.skip() : q.skip;
  if (skip) return null;

  const mappedType = TYPE_MAP[q.type] ?? q.type;

  return {
    type: mappedType as any,
    name: q.name,
    message: q.message,
    initial: q.initial as any,
    format: q.format ? (val: unknown) => String(q.format!(val)) : undefined,
    validate: q.validate,
    ...(q.choices && { choices: mapChoices(q.choices) }),
    ...(q.min !== undefined && { min: q.min }),
    ...(q.max !== undefined && { max: q.max }),
    ...(q.float !== undefined && { float: q.float }),
    ...(q.round !== undefined && { round: q.round }),
    ...(q.increment !== undefined && { increment: q.increment }),
    ...(q.separator !== undefined && { separator: q.separator }),
    ...(q.active !== undefined && { active: q.active }),
    ...(q.inactive !== undefined && { inactive: q.inactive }),
    ...(q.hint !== undefined && { hint: q.hint }),
    ...(q.limit !== undefined && { limit: q.limit }),
    ...(q.suggest && { suggest: q.suggest as any }),
    ...(q.mask !== undefined && { mask: q.mask }),
    ...(q.stdin && { stdin: q.stdin as any }),
    ...(q.stdout && { stdout: q.stdout as any }),
  } as Question;
}

/**
 * Prompt class — enquirer-style class-based API.
 */
export class Prompt {
  private questions: EnquirerQuestion[];

  constructor(questions: EnquirerQuestion | EnquirerQuestion[]) {
    this.questions = Array.isArray(questions) ? questions : [questions];
  }

  async run(): Promise<Record<string, unknown>> {
    const mapped = this.questions
      .map(mapQuestion)
      .filter((q): q is Question => q !== null);
    return elicit(mapped);
  }
}

/**
 * prompt() — enquirer-style functional API.
 *
 * @param questions - Single question or array of questions
 * @returns Answers object
 */
export async function prompt(
  questions: EnquirerQuestion | EnquirerQuestion[]
): Promise<Record<string, unknown>> {
  const list = Array.isArray(questions) ? questions : [questions];
  const mapped = list
    .map(mapQuestion)
    .filter((q): q is Question => q !== null);

  const answers = await elicit(mapped);

  // Apply result transformers
  for (const q of list) {
    if (q.result && answers[q.name] !== undefined) {
      answers[q.name] = q.result(answers[q.name]);
    }
  }

  return answers;
}

/** Inject answers for testing. */
prompt.inject = function inject(values: unknown[]): void {
  elicit.inject(values);
};

export default prompt;
