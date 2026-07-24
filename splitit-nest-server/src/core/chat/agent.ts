import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

import { getProvider } from '../llm';
import { llmCallOptions } from '../llm/call-options';
import { computePerPerson, round2, sumPerPerson } from '../split/split-math';
import { MEMORY_EXTRACTION_PROMPT, SYSTEM_PROMPT } from '../constants';
import {
  ChatReplySchema,
  MemoryFactsSchema,
  type ChatMember,
  type ChatMessage,
  type ChatReply,
  type MemoryFacts,
  type SplitResult,
} from '../schema';

function buildMessages(history: ChatMessage[], members: ChatMember[], memoryFacts: string[] = []) {
  const membersLine =
    members.length > 0
      ? `KNOWN MEMBERS (json): ${JSON.stringify(members)}`
      : 'KNOWN MEMBERS (json): [] (the user has not added any members yet)';

  const memoryLine =
    memoryFacts.length > 0
      ? `\n\nWHAT YOU REMEMBER ABOUT THE USER (from past chats): ${JSON.stringify(memoryFacts)}`
      : '';

  const messages: (SystemMessage | HumanMessage | AIMessage)[] = [
    new SystemMessage(`${SYSTEM_PROMPT}\n\n${membersLine}${memoryLine}`),
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

export async function runChat(
  history: ChatMessage[],
  members: ChatMember[],
  memoryFacts: string[] = [],
): Promise<ChatResponse> {
  const model = getProvider().getModel();
  const structured = model.withStructuredOutput(ChatReplySchema, { name: 'chat_reply' });

  const output = (await structured.invoke(buildMessages(history, members, memoryFacts), llmCallOptions())) as ChatReply;

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

/**
 * Update the user's durable cross-chat memory from the latest conversation.
 * Returns the FULL new fact list (caller persists it). Pure/core: takes and
 * returns plain data, no storage dependency. Best-effort — on any model error
 * the caller should keep the existing facts.
 */
export async function extractMemory(history: ChatMessage[], existingFacts: string[]): Promise<string[]> {
  const model = getProvider().getModel();
  const structured = model.withStructuredOutput(MemoryFactsSchema, { name: 'memory_facts' });

  // Only the text of the conversation matters for memory (skip images).
  const transcript = history
    .map((m) => `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.text}`)
    .filter((l) => l.trim().length > 'User: '.length)
    .join('\n');

  const messages = [
    new SystemMessage(MEMORY_EXTRACTION_PROMPT),
    new HumanMessage(
      `EXISTING FACTS (json): ${JSON.stringify(existingFacts)}\n\nCONVERSATION:\n${transcript}`,
    ),
  ];

  const out = (await structured.invoke(messages, llmCallOptions())) as MemoryFacts;
  // Dedupe + cap defensively.
  return [...new Set(out.facts.map((f) => f.trim()).filter(Boolean))].slice(0, 20);
}
