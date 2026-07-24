import { z } from 'zod';

export const PaymentDirectionSchema = z.enum(['received', 'given']);
export type PaymentDirection = z.infer<typeof PaymentDirectionSchema>;

/** A settlement between the owner and a friend. Mirrors the app's Payment type. */
export const PaymentSchema = z.object({
  id: z.string(),
  friendId: z.string(),
  amount: z.number(),
  direction: PaymentDirectionSchema,
  note: z.string().optional(),
  createdAt: z.string(),
});
export type Payment = z.infer<typeof PaymentSchema>;

/** Body of POST /api/payments. */
export const CreatePaymentSchema = z.object({
  friendId: z.string(),
  amount: z.number().positive(),
  direction: PaymentDirectionSchema,
  note: z.string().optional(),
});
export type CreatePayment = z.infer<typeof CreatePaymentSchema>;
