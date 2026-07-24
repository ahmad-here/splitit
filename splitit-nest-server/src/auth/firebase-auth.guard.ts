import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

import { FirebaseService } from '../firebase/firebase.service';

/** Express request augmented with the authenticated user's uid. */
export type AuthedRequest = Request & { userId: string };

/**
 * Validates the `Authorization: Bearer <firebase-id-token>` header and attaches
 * `userId` (the Firebase uid) to the request. Apply with
 * @UseGuards(FirebaseAuthGuard) on any controller that acts on behalf of a
 * signed-in user; read the id with the @CurrentUser() decorator.
 */
@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private readonly firebase: FirebaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) throw new UnauthorizedException('Missing bearer token.');

    const userId = await this.firebase.getUserId(token);
    if (!userId) throw new UnauthorizedException('Invalid or expired session.');

    req.userId = userId;
    return true;
  }
}
