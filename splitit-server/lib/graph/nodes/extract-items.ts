import { HumanMessage } from '@langchain/core/messages';

import { getProvider } from '@/lib/llm';
import { ExtractionSchema, type Extraction } from '@/lib/schema';
import type { NodeSpec } from '@/lib/graph/nodes/types';

/** Node — read the receipt image and extract structured line items + totals. */
export const extractItemsNode: NodeSpec = {
  name: 'extractItems',
  async run(state) {
    const model = getProvider().getModel();
    const structured = model.withStructuredOutput(ExtractionSchema, { name: 'extraction' });

    const message = new HumanMessage({
      content: [
        {
          type: 'text',
          text:
            'You are reading a photo of a restaurant/shop receipt. Extract every line item with its ' +
            'quantity and total price, plus subtotal, tax, tip (0 if none), and grand total. ' +
            'Use numbers only, no currency symbols.',
        },
        { type: 'image_url', image_url: state.imageDataUrl },
      ],
    });

    const extraction = (await structured.invoke([message])) as Extraction;
    return { extraction };
  },
};
