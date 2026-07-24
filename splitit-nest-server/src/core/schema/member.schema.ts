import { z } from 'zod';

/** A friend/member as returned to the app. */
export const MemberSchema = z.object({
  profileId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  name: z.string(),
  friendCode: z.string(),
});
export type Member = z.infer<typeof MemberSchema>;

/** Body of POST /api/members/redeem — add a friend by their code. */
export const RedeemCodeSchema = z.object({
  code: z.string().trim().min(4).max(12),
});
export type RedeemCode = z.infer<typeof RedeemCodeSchema>;
