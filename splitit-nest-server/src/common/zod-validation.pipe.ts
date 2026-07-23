import { BadRequestException, PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';

/**
 * Validates a request body against a Zod schema (DIP: controllers depend on the
 * schema, not on a validation library). Keeps lib/schema.ts as the single source
 * of truth — the same schemas LangChain uses for structured output.
 */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(
    private readonly schema: ZodType<T>,
    private readonly message = 'Invalid request body.',
  ) {}

  transform(value: unknown): T {
    const parsed = this.schema.safeParse(value);
    if (!parsed.success) throw new BadRequestException(this.message);
    return parsed.data;
  }
}
