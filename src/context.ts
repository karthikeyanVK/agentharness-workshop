export class ContextManager {
  constructor(readonly objective: string, readonly userContext: Record<string, unknown> = {}) {}
  working: Record<string, unknown> = {};
  business: Record<string, unknown> = {};
}
