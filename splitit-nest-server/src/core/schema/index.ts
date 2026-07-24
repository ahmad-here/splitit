/**
 * Barrel for every Zod schema. Importers keep using `from '../schema'`, so the
 * split into one-concern-per-file is invisible to the rest of the codebase.
 *
 * These schemas serve double duty: request validation (ZodValidationPipe) and
 * LLM structured output (`model.withStructuredOutput(...)`), which is why the
 * `.describe()` calls matter — the model reads them as field documentation.
 *
 * Receipt domain:  line-item -> extraction -> assignment -> per-person -> split-result
 * Chat domain:     chat-message / chat-member -> chat-request, chat-split -> chat-reply
 */

export * from './line-item.schema';
export * from './extraction.schema';
export * from './assignment.schema';
export * from './per-person.schema';
export * from './split-result.schema';

export * from './chat-message.schema';
export * from './chat-member.schema';
export * from './chat-request.schema';
export * from './chat-split.schema';
export * from './chat-reply.schema';

// Multi-user / persistence (v2)
export * from './member.schema';
export * from './notification.schema';
export * from './split-record.schema';
export * from './payment.schema';
export * from './chat-session.schema';
export * from './memory.schema';
