import { z } from 'zod';

/** A known member the user has saved (used for participant disambiguation). */
export const ChatMemberSchema = z.object({ id: z.string(), name: z.string() });
export type ChatMember = z.infer<typeof ChatMemberSchema>;
