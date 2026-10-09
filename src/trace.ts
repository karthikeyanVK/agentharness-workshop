import type { ActionStatus } from "./types.js";

export interface TraceEvent { at: string; type: string; status: ActionStatus | "info"; data: unknown; }

export class Trace {
  readonly events: TraceEvent[] = [];
  onEvent?: (event: TraceEvent) => void; // optional live subscriber (used by the runtime demo)
  record(type: string, status: TraceEvent["status"], data: unknown): void {
    const event = { at: new Date().toISOString(), type, status, data };
    this.events.push(event);
    this.onEvent?.(event);
  }
}
