import { z } from 'zod';

/** A single line item read off the receipt. */
export const LineItemSchema = z.object({
  name: z.string().describe('Item name as printed on the receipt'),
  qty: z.number().describe('Quantity; default 1 if not printed'),
  price: z.number().describe('Total price for this line (qty * unit price)'),
});
export type LineItem = z.infer<typeof LineItemSchema>;
