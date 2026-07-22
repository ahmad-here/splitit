import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

import { getProvider } from '@/lib/llm';
import { computePerPerson, round2, sumPerPerson } from '@/lib/split/split-math';
import {
  ChatReplySchema,
  type ChatMember,
  type ChatMessage,
  type ChatReply,
  type SplitResult,
} from '@/lib/schema';

const SYSTEM_PROMPT = `You are Splitit, a warm, concise assistant that helps people split bills.

You are in a chat. Each turn the user may attach a photo of a receipt/invoice, describe the bill in plain text, or both. The device owner is "Me".

You are given a list of KNOWN MEMBERS (people the user saved), each with an id and name. Use them to identify participants.

How to behave:
1. IMAGE ONLY (no split instructions): First describe what you see on the receipt — the notable items and the total — in a friendly sentence or two. Then ASK how they want to split it and among whom. Set ready=false, split=null.
2. TEXT ONLY (no image): The user may be relaying an invoice. Work from the details they give. If an essential detail is missing (amounts, or who had what), ask for it. Set ready=false until you can produce a correct split.
3. PARTICIPANTS: Draw participants from the known members and any names the user types. Always include "Me" if the user refers to themselves.
4. MEMBER DISAMBIGUATION — important: If a name the user mentions matches MORE THAN ONE known member, or is ambiguous, DO NOT guess. Ask them to clarify by member id, or ask them to add the specific member. Example: "There are two people named Ali. Which one? You can tell me their id, or add the exact member." Set ready=false.
5. WHEN YOU HAVE ENOUGH (the amounts + how to split + unambiguous participants): produce the final split. Set ready=true and fill "split":
   - items: line items with numeric prices (qty defaults to 1).
   - assignments: for each item, the list of participant names sharing it. Items nobody specifically claims go to ALL participants.
   - participants: everyone involved.
   - subtotal, tax, tip (0 if none), total: numbers only, no currency symbols.
   - title: a short label like "KFC Dinner".
6. Always write a short, friendly "reply". Never invent receipt contents you cannot see. Keep money as plain numbers.`;

function buildMessages(history: ChatMessage[], members: ChatMember[]) {
  const membersLine =
    members.length > 0
      ? `KNOWN MEMBERS (json): ${JSON.stringify(members)}`
      : 'KNOWN MEMBERS (json): [] (the user has not added any members yet)';

  const messages: (SystemMessage | HumanMessage | AIMessage)[] = [
    new SystemMessage(`${SYSTEM_PROMPT}\n\n${membersLine}`),
  ];

  for (const m of history) {
    if (m.role === 'assistant') {
      messages.push(new AIMessage(m.text));
      continue;
    }
    // user turn — may carry an image
    if (m.image) {
      messages.push(
        new HumanMessage({
          content: [
            { type: 'text', text: m.text || '(no message — receipt photo attached)' },
            { type: 'image_url', image_url: m.image },
          ],
        }),
      );
    } else {
      messages.push(new HumanMessage(m.text));
    }
  }
  return messages;
}

export type ChatResponse = { reply: string; result: SplitResult | null; title: string | null };

export async function runChat(history: ChatMessage[], members: ChatMember[]): Promise<ChatResponse> {
  const model = getProvider().getModel();
  const structured = model.withStructuredOutput(ChatReplySchema, { name: 'chat_reply' });

  const output = (await structured.invoke(buildMessages(history, members))) as ChatReply;

  if (!output.ready || !output.split) {
    return { reply: output.reply, result: null, title: null };
  }

  const split = output.split;
  const perPerson = computePerPerson({
    items: split.items,
    assignments: split.assignments,
    participants: split.participants,
    tax: split.tax,
    tip: split.tip,
  });
  const computedTotal = sumPerPerson(perPerson);
  const needsReview = split.total > 0 && Math.abs(computedTotal - round2(split.total)) > 0.05;

  const result: SplitResult = {
    items: split.items,
    assignments: split.assignments,
    perPerson,
    subtotal: split.subtotal,
    tax: split.tax,
    tip: split.tip,
    total: split.total > 0 ? split.total : round2(computedTotal),
    needsReview,
  };

  return { reply: output.reply, result, title: split.title };
}
