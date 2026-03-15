import type { PromptHandler } from "../engine.js";
import type { KeyPress } from "../terminal.js";
import { green, dim, cyan } from "../style.js";

export interface DateOptions {
  message: string;
  initial?: Date;
  mask?: string;
}

/** Which segment of the date is being edited. */
type DateSegment = "month" | "day" | "year" | "hours" | "minutes";

const SEGMENTS: DateSegment[] = ["month", "day", "year", "hours", "minutes"];

export class DateHandler implements PromptHandler {
  private message: string;
  private date: Date;
  private segmentIndex: number;

  constructor(options: DateOptions) {
    this.message = options.message;
    this.date = options.initial ? new Date(options.initial.getTime()) : new Date();
    this.segmentIndex = 0;
  }

  render(): string {
    const prefix = green("? ");
    const sep = dim(" › ");
    const parts = SEGMENTS.map((seg, i) => {
      const val = this.getSegmentValue(seg);
      return i === this.segmentIndex ? cyan(val) : dim(val);
    });
    const dateStr = `${parts[0]}/${parts[1]}/${parts[2]} ${parts[3]}:${parts[4]}`;
    return `${prefix}${this.message}${sep}${dateStr}`;
  }

  handleKey(key: KeyPress): boolean {
    if (key.name === "return") return true;

    const segment = SEGMENTS[this.segmentIndex];

    if (key.name === "up") {
      this.adjustSegment(segment, 1);
    } else if (key.name === "down") {
      this.adjustSegment(segment, -1);
    } else if (key.name === "left" || key.name === "tab") {
      this.segmentIndex = (this.segmentIndex - 1 + SEGMENTS.length) % SEGMENTS.length;
    } else if (key.name === "right") {
      this.segmentIndex = (this.segmentIndex + 1) % SEGMENTS.length;
    }

    return false;
  }

  getValue(): Date {
    return new Date(this.date.getTime());
  }

  getDisplayValue(): string {
    return cyan(this.formatDate());
  }

  private getSegmentValue(segment: DateSegment): string {
    switch (segment) {
      case "month":
        return String(this.date.getMonth() + 1).padStart(2, "0");
      case "day":
        return String(this.date.getDate()).padStart(2, "0");
      case "year":
        return String(this.date.getFullYear());
      case "hours":
        return String(this.date.getHours()).padStart(2, "0");
      case "minutes":
        return String(this.date.getMinutes()).padStart(2, "0");
    }
  }

  private adjustSegment(segment: DateSegment, delta: number): void {
    switch (segment) {
      case "month":
        this.date.setMonth(this.date.getMonth() + delta);
        break;
      case "day":
        this.date.setDate(this.date.getDate() + delta);
        break;
      case "year":
        this.date.setFullYear(this.date.getFullYear() + delta);
        break;
      case "hours":
        this.date.setHours(this.date.getHours() + delta);
        break;
      case "minutes":
        this.date.setMinutes(this.date.getMinutes() + delta);
        break;
    }
  }

  private formatDate(): string {
    const m = String(this.date.getMonth() + 1).padStart(2, "0");
    const d = String(this.date.getDate()).padStart(2, "0");
    const y = this.date.getFullYear();
    const h = String(this.date.getHours()).padStart(2, "0");
    const min = String(this.date.getMinutes()).padStart(2, "0");
    return `${m}/${d}/${y} ${h}:${min}`;
  }
}
