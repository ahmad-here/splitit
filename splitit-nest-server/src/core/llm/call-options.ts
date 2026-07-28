/**
 * Per-invocation options shared by every LLM call (graph nodes + chat agent).
 *
 * A timeout is essential: an overloaded Gemini model can otherwise hang for
 * minutes with no response, and the mobile app is sitting on that request.
 * Failing fast surfaces a real error the user can retry. Tune with
 * LLM_TIMEOUT_MS.
 */
const DEFAULT_TIMEOUT_MS = 45_000;

/** The configured per-request timeout in ms (LLM_TIMEOUT_MS, default 45s). */
export function llmTimeoutMs(): number {
  const raw = process.env.LLM_TIMEOUT_MS;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : DEFAULT_TIMEOUT_MS;
}

/** Model-level call options (used by direct model.invoke / withStructuredOutput). */
export function llmCallOptions(): { timeout: number } {
  return { timeout: llmTimeoutMs() };
}

/**
 * Agent (LangGraph) invoke config — enforces the timeout via an abort signal.
 * When a threadId is given, tag the run so LangSmith groups the trace into a
 * thread (enables Thread-scoped evaluators like Tool Selection). LangSmith reads
 * thread_id / session_id / conversation_id from metadata; we set all three.
 */
export function agentInvokeConfig(threadId?: string): {
  signal: AbortSignal;
  configurable?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
} {
  const base = { signal: AbortSignal.timeout(llmTimeoutMs()) };
  if (!threadId) return base;
  return {
    ...base,
    configurable: { thread_id: threadId },
    metadata: { thread_id: threadId, session_id: threadId, conversation_id: threadId },
  };
}
