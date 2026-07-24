import { z } from 'zod';

export const NotificationTypeSchema = z.enum(['split_added', 'reminder']);
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

/** A notification row as returned to the app. */
export const NotificationSchema = z.object({
  id: z.string(),
  recipientId: z.string(),
  actorId: z.string().nullable().optional(),
  type: NotificationTypeSchema,
  title: z.string(),
  body: z.string(),
  data: z.record(z.string(), z.unknown()).default({}),
  read: z.boolean(),
  createdAt: z.string(),
});
export type Notification = z.infer<typeof NotificationSchema>;

/** Body of POST /api/notifications/remind — nudge a friend about pending money. */
export const RemindSchema = z.object({
  friendId: z.string(),
  amount: z.number().optional(),
  note: z.string().optional(),
  /** Currency prefix for the amount, e.g. "Rs " or "$". */
  currency: z.string().optional(),
});
export type Remind = z.infer<typeof RemindSchema>;

/** Body of POST /api/push/register. */
export const RegisterPushSchema = z.object({
  token: z.string().min(1),
});
export type RegisterPush = z.infer<typeof RegisterPushSchema>;
