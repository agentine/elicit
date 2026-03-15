import type { Readable, Writable } from "node:stream";

/** Supported prompt type names. */
export type PromptType =
  | "text"
  | "password"
  | "invisible"
  | "number"
  | "confirm"
  | "list"
  | "toggle"
  | "select"
  | "multiselect"
  | "autocomplete"
  | "date";

/** A single choice for select/multiselect/autocomplete prompts. */
export interface Choice {
  title: string;
  value?: unknown;
  description?: string;
  disabled?: boolean;
  selected?: boolean;
}

/** Prompt lifecycle state. */
export type PromptState = "init" | "active" | "cancel" | "submit" | "error";

/** State change callback payload. */
export interface StateChange {
  state: PromptState;
  value: unknown;
  aborted: boolean;
}

/** Validation function — return true if valid, or a string error message. */
export type ValidateFunction = (
  value: unknown
) => boolean | string | Promise<boolean | string>;

/** Format function — transforms displayed value. */
export type FormatFunction = (value: unknown) => string | Promise<string>;

/** Dynamic property — a value or a function that receives previous answers. */
export type DynamicProperty<T> = T | ((prev: unknown, answers: Answers) => T);

/** Collected answers keyed by prompt name. */
export type Answers = Record<string, unknown>;

/** Base prompt question definition. */
export interface PromptQuestion {
  type: DynamicProperty<PromptType | false>;
  name: string;
  message: DynamicProperty<string>;
  initial?: DynamicProperty<unknown>;
  format?: FormatFunction;
  validate?: ValidateFunction;
  onRender?: (this: unknown) => void;
  onState?: (state: StateChange) => void;
  stdin?: Readable;
  stdout?: Writable;
}

/** Text prompt options. */
export interface TextQuestion extends PromptQuestion {
  type: "text";
  style?: string;
  initial?: DynamicProperty<string>;
}

/** Password prompt options. */
export interface PasswordQuestion extends PromptQuestion {
  type: "password";
}

/** Invisible prompt options. */
export interface InvisibleQuestion extends PromptQuestion {
  type: "invisible";
}

/** Number prompt options. */
export interface NumberQuestion extends PromptQuestion {
  type: "number";
  initial?: DynamicProperty<number>;
  min?: number;
  max?: number;
  float?: boolean;
  round?: number;
  increment?: number;
}

/** Confirm prompt options. */
export interface ConfirmQuestion extends PromptQuestion {
  type: "confirm";
  initial?: DynamicProperty<boolean>;
}

/** List prompt options. */
export interface ListQuestion extends PromptQuestion {
  type: "list";
  initial?: DynamicProperty<string>;
  separator?: string;
}

/** Toggle prompt options. */
export interface ToggleQuestion extends PromptQuestion {
  type: "toggle";
  initial?: DynamicProperty<boolean>;
  active?: string;
  inactive?: string;
}

/** Select prompt options. */
export interface SelectQuestion extends PromptQuestion {
  type: "select";
  choices: DynamicProperty<Choice[]>;
  hint?: string;
  warn?: string;
}

/** MultiSelect prompt options. */
export interface MultiSelectQuestion extends PromptQuestion {
  type: "multiselect";
  choices: DynamicProperty<Choice[]>;
  hint?: string;
  warn?: string;
  min?: number;
  max?: number;
  instructions?: string | boolean;
}

/** Autocomplete prompt options. */
export interface AutocompleteQuestion extends PromptQuestion {
  type: "autocomplete";
  choices: DynamicProperty<Choice[]>;
  suggest?: (
    input: string,
    choices: Choice[]
  ) => Promise<Choice[]> | Choice[];
  limit?: number;
  clearFirst?: boolean;
}

/** Date prompt options. */
export interface DateQuestion extends PromptQuestion {
  type: "date";
  initial?: DynamicProperty<Date>;
  locales?: Record<string, unknown>;
  mask?: string;
}

/** Union of all prompt question types. */
export type Question =
  | TextQuestion
  | PasswordQuestion
  | InvisibleQuestion
  | NumberQuestion
  | ConfirmQuestion
  | ListQuestion
  | ToggleQuestion
  | SelectQuestion
  | MultiSelectQuestion
  | AutocompleteQuestion
  | DateQuestion;

/** Options for the main elicit() function. */
export interface ElicitOptions {
  onSubmit?: (question: PromptQuestion, answer: unknown, answers: Answers) => void;
  onCancel?: (question: PromptQuestion, answers: Answers) => void | boolean;
}
