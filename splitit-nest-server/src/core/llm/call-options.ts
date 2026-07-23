/**
 * Per-invocation options shared by every LLM call (graph nodes + chat agent).
 *
 * A timeout is essential: an overloaded Gemini model can otherwise hang for
 * minutes with no response, and the mobile app is sitting on that request.
 * Failing fast surfaces a real error the user can retry. Tune with
 * LLM_TIMEOUT_MS.
 */
const DEFAULT_TIMEOUT_MS = 45_000;

export function llmCallOptions(): { timeout: number } {
  const raw = process.env.LLM_TIMEOUT_MS;
  const parsed = raw ? Number(raw) : NaN;
  return { timeout: Number.isFinite(parsed) ? parsed : DEFAULT_TIMEOUT_MS };
}
