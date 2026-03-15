export type {
  PromptType,
  Choice,
  PromptState,
  StateChange,
  ValidateFunction,
  FormatFunction,
  DynamicProperty,
  Answers,
  PromptQuestion,
  TextQuestion,
  PasswordQuestion,
  InvisibleQuestion,
  NumberQuestion,
  ConfirmQuestion,
  ListQuestion,
  ToggleQuestion,
  SelectQuestion,
  MultiSelectQuestion,
  AutocompleteQuestion,
  DateQuestion,
  Question,
  ElicitOptions,
} from "./types.js";

export { PromptEngine } from "./engine.js";
export type { PromptHandler } from "./engine.js";
export { Terminal, ansi, parseKey } from "./terminal.js";
export { style } from "./style.js";

import type {
  Question,
  Answers,
  ElicitOptions,
  PromptType,
  Choice,
  DynamicProperty,
} from "./types.js";
import { Terminal } from "./terminal.js";
import { PromptEngine } from "./engine.js";
import type { PromptHandler } from "./engine.js";
import { TextHandler } from "./prompts/text.js";
import { PasswordHandler } from "./prompts/password.js";
import { InvisibleHandler } from "./prompts/invisible.js";
import { NumberHandler } from "./prompts/number.js";
import { ConfirmHandler } from "./prompts/confirm.js";
import { ListHandler } from "./prompts/list.js";
import { ToggleHandler } from "./prompts/toggle.js";
import { SelectHandler } from "./prompts/select.js";
import { MultiSelectHandler } from "./prompts/multiselect.js";
import { AutocompleteHandler } from "./prompts/autocomplete.js";
import { DateHandler } from "./prompts/date.js";

/** Resolve a dynamic property: if it's a function, call it with prev and answers. */
function resolve<T>(prop: DynamicProperty<T> | undefined, prev: unknown, answers: Answers): T | undefined {
  if (typeof prop === "function") {
    return (prop as (prev: unknown, answers: Answers) => T)(prev, answers);
  }
  return prop;
}

/** Create the appropriate PromptHandler for a given question type. */
function createHandler(type: PromptType, q: Question, prev: unknown, answers: Answers): PromptHandler {
  const msg = resolve(q.message, prev, answers) ?? "";

  switch (type) {
    case "text": {
      const tq = q as import("./types.js").TextQuestion;
      return new TextHandler({
        message: msg,
        initial: resolve(tq.initial, prev, answers) as string | undefined,
      });
    }
    case "password":
      return new PasswordHandler({ message: msg });
    case "invisible":
      return new InvisibleHandler({ message: msg });
    case "number": {
      const nq = q as import("./types.js").NumberQuestion;
      return new NumberHandler({
        message: msg,
        initial: resolve(nq.initial, prev, answers) as number | undefined,
        min: nq.min,
        max: nq.max,
        float: nq.float,
        round: nq.round,
        increment: nq.increment,
      });
    }
    case "confirm": {
      const cq = q as import("./types.js").ConfirmQuestion;
      return new ConfirmHandler({
        message: msg,
        initial: resolve(cq.initial, prev, answers) as boolean | undefined,
      });
    }
    case "list": {
      const lq = q as import("./types.js").ListQuestion;
      return new ListHandler({
        message: msg,
        initial: resolve(lq.initial, prev, answers) as string | undefined,
        separator: lq.separator,
      });
    }
    case "toggle": {
      const tgq = q as import("./types.js").ToggleQuestion;
      return new ToggleHandler({
        message: msg,
        initial: resolve(tgq.initial, prev, answers) as boolean | undefined,
        active: tgq.active,
        inactive: tgq.inactive,
      });
    }
    case "select": {
      const sq = q as import("./types.js").SelectQuestion;
      return new SelectHandler({
        message: msg,
        choices: resolve(sq.choices, prev, answers) as Choice[],
        hint: sq.hint,
        warn: sq.warn,
      });
    }
    case "multiselect": {
      const msq = q as import("./types.js").MultiSelectQuestion;
      return new MultiSelectHandler({
        message: msg,
        choices: resolve(msq.choices, prev, answers) as Choice[],
        hint: msq.hint,
        warn: msq.warn,
        min: msq.min,
        max: msq.max,
        instructions: msq.instructions,
      });
    }
    case "autocomplete": {
      const aq = q as import("./types.js").AutocompleteQuestion;
      return new AutocompleteHandler({
        message: msg,
        choices: resolve(aq.choices, prev, answers) as Choice[],
        suggest: aq.suggest,
        limit: aq.limit,
      });
    }
    case "date": {
      const dq = q as import("./types.js").DateQuestion;
      return new DateHandler({
        message: msg,
        initial: resolve(dq.initial, prev, answers) as Date | undefined,
        mask: dq.mask,
      });
    }
  }
}

/** Programmatic answer injection for testing. */
const injected: unknown[] = [];

/**
 * Inject answers for testing. Call before elicit() to provide answers
 * without requiring TTY input. Answers are consumed in order.
 */
elicit.inject = function inject(values: unknown[]): void {
  injected.push(...values);
};

/**
 * Run one or more interactive prompts sequentially and collect answers.
 * Returns a partial answers object — prompts cancelled via Ctrl+C are omitted.
 */
export default async function elicit(
  questions: Question | Question[],
  options?: ElicitOptions
): Promise<Answers> {
  const list = Array.isArray(questions) ? questions : [questions];
  const answers: Answers = {};
  let prev: unknown = undefined;

  for (const q of list) {
    // Resolve dynamic type — type may be a function returning PromptType | false
    const type = resolve(q.type as DynamicProperty<PromptType | false>, prev, answers);
    if (!type) continue;

    // Check for injected answer
    if (injected.length > 0) {
      const value = injected.shift();
      answers[q.name] = value;
      options?.onSubmit?.(q, value, answers);
      prev = value;
      continue;
    }

    const terminal = new Terminal({
      stdin: q.stdin,
      stdout: q.stdout,
    });

    const handler = createHandler(type, q, prev, answers);
    const engine = new PromptEngine({
      terminal,
      handler,
      message: resolve(q.message, prev, answers) ?? "",
      validate: q.validate,
      format: q.format,
      onState: q.onState,
      onRender: q.onRender ? () => q.onRender!.call(handler) : undefined,
    });

    const result = await engine.run();

    if (result === undefined) {
      // Cancelled
      const shouldBreak = options?.onCancel?.(q, answers);
      if (shouldBreak !== false) break;
      continue;
    }

    answers[q.name] = result;
    options?.onSubmit?.(q, result, answers);
    prev = result;
  }

  return answers;
}
