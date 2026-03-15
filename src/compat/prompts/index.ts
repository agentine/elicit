/**
 * @agentine/elicit/compat/prompts
 *
 * Drop-in replacement for terkelg/prompts v2.4.2.
 * Same function signature, return types, prompt type names, option shapes.
 */

import elicit from "../../index.js";
import type { Question, Answers, ElicitOptions, PromptQuestion, Choice } from "../../types.js";

/** prompts-compatible question definition. */
export interface PromptsQuestion {
  type: string | ((prev: unknown, answers: Record<string, unknown>) => string | false | null);
  name: string;
  message: string | ((prev: unknown, answers: Record<string, unknown>) => string);
  initial?: unknown | ((prev: unknown, answers: Record<string, unknown>) => unknown);
  format?: (val: unknown, answers: Record<string, unknown>) => unknown;
  validate?: (val: unknown) => boolean | string | Promise<boolean | string>;
  onRender?: (this: unknown) => void;
  onState?: (state: { value: unknown; aborted: boolean }) => void;

  // Type-specific options
  style?: string;
  min?: number;
  max?: number;
  float?: boolean;
  round?: number;
  increment?: number;
  separator?: string;
  active?: string;
  inactive?: string;
  choices?: Array<{ title: string; value?: unknown; description?: string; disabled?: boolean; selected?: boolean }>;
  hint?: string;
  warn?: string;
  suggest?: (input: string, choices: unknown[]) => Promise<unknown[]> | unknown[];
  limit?: number;
  clearFirst?: boolean;
  instructions?: string | boolean;
  mask?: string;
  locales?: Record<string, unknown>;
  stdin?: NodeJS.ReadableStream;
  stdout?: NodeJS.WritableStream;
}

export interface PromptsOptions {
  onSubmit?: (prompt: PromptsQuestion, answer: unknown, answers: Record<string, unknown>) => void;
  onCancel?: (prompt: PromptsQuestion, answers: Record<string, unknown>) => void | boolean;
}

/** Map a prompts-style question to an elicit Question. */
function mapQuestion(q: PromptsQuestion): Question {
  return {
    type: q.type as any,
    name: q.name,
    message: q.message as any,
    initial: q.initial as any,
    format: q.format ? (val: unknown) => String(q.format!(val, {})) : undefined,
    validate: q.validate,
    onRender: q.onRender,
    onState: q.onState ? (state: any) => q.onState!(state) : undefined,
    // Type-specific
    ...(q.min !== undefined && { min: q.min }),
    ...(q.max !== undefined && { max: q.max }),
    ...(q.float !== undefined && { float: q.float }),
    ...(q.round !== undefined && { round: q.round }),
    ...(q.increment !== undefined && { increment: q.increment }),
    ...(q.separator !== undefined && { separator: q.separator }),
    ...(q.active !== undefined && { active: q.active }),
    ...(q.inactive !== undefined && { inactive: q.inactive }),
    ...(q.choices && { choices: q.choices as Choice[] }),
    ...(q.hint !== undefined && { hint: q.hint }),
    ...(q.warn !== undefined && { warn: q.warn }),
    ...(q.suggest && { suggest: q.suggest as any }),
    ...(q.limit !== undefined && { limit: q.limit }),
    ...(q.clearFirst !== undefined && { clearFirst: q.clearFirst }),
    ...(q.instructions !== undefined && { instructions: q.instructions }),
    ...(q.mask !== undefined && { mask: q.mask }),
    ...(q.stdin && { stdin: q.stdin as any }),
    ...(q.stdout && { stdout: q.stdout as any }),
  } as Question;
}

/**
 * prompts() — drop-in replacement for terkelg/prompts.
 *
 * @param questions - Single question object or array of questions
 * @param options - onSubmit/onCancel callbacks
 * @returns Answers object keyed by prompt name
 */
async function prompts(
  questions: PromptsQuestion | PromptsQuestion[],
  options?: PromptsOptions
): Promise<Record<string, unknown>> {
  const list = Array.isArray(questions) ? questions : [questions];
  const mapped = list.map(mapQuestion);

  const elicitOptions: ElicitOptions | undefined = options
    ? {
        onSubmit: options.onSubmit
          ? (q: PromptQuestion, answer: unknown, answers: Answers) => {
              const orig = list.find((pq) => pq.name === q.name);
              if (orig) options.onSubmit!(orig, answer, answers);
            }
          : undefined,
        onCancel: options.onCancel
          ? (q: PromptQuestion, answers: Answers) => {
              const orig = list.find((pq) => pq.name === q.name);
              if (orig) return options.onCancel!(orig, answers);
            }
          : undefined,
      }
    : undefined;

  return elicit(mapped, elicitOptions);
}

/** Inject answers for testing — same as prompts.inject(). */
prompts.inject = function inject(values: unknown[]): void {
  elicit.inject(values);
};

export default prompts;
export { prompts };
