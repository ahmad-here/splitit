import { HumanMessage } from '@langchain/core/messages';

import { getProvider } from '../../llm';
import { llmCallOptions } from '../../llm/call-options';
import { ExtractionSchema, type Extraction } from '../../schema';
import { EXTRACT_ITEMS_PROMPT } from '../../constants';
import type { NodeSpec } from '../../graph/nodes/types';

/** Node — read the receipt image and extract structured line items + totals. */
export const extractItemsNode: NodeSpec = {
  name: 'extractItems',
  async run(state) {
    const model = getProvider().getModel();
    const structured = model.withStructuredOutput(ExtractionSchema, { name: 'extraction' });

    const message = new HumanMessage({
      content: [
        { type: 'text', text: EXTRACT_ITEMS_PROMPT },
        { type: 'image_url', image_url: state.imageDataUrl },
      ],
    });

    const extraction = (await structured.invoke([message], llmCallOptions())) as Extraction;
    return { extraction };
  },
};
