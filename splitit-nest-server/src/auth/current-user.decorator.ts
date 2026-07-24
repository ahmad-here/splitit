import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { AuthedRequest } from './firebase-auth.guard';

/**
 * Injects the authenticated user's id (set by FirebaseAuthGuard).
 * Usage: myRoute(@CurrentUser() userId: string) { ... }
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  return ctx.switchToHttp().getRequest<AuthedRequest>().userId;
});
