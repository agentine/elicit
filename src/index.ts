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

import type { Question, Answers, ElicitOptions } from "./types.js";

/**
 * Run one or more interactive prompts sequentially and collect answers.
 * Returns a partial answers object — prompts cancelled via Ctrl+C are omitted.
 */
export default async function elicit(
  questions: Question | Question[],
  options?: ElicitOptions
): Promise<Answers> {
  const _questions = Array.isArray(questions) ? questions : [questions];
  const _options = options;
  const answers: Answers = {};

  // Placeholder — individual prompt types will be wired in Phase 3-6
  void _questions;
  void _options;

  return answers;
}
