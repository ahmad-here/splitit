import { HumanMessage, SystemMessage } from '@langchain/core/messages';

import { runChatReply } from '../agents/chat-agent';
import { getProvider } from '../llm';
import { llmCallOptions } from '../llm/call-options';
import { computePerPerson, round2, sumPerPerson } from '../split/split-math';
import { MEMORY_EXTRACTION_PROMPT } from '../constants';
import {
  MemoryFactsSchema,
  type ChatMember,
  type ChatMessage,
  type MemoryFacts,
  type SplitResult,
} from '../schema';

export type ChatResponse = { reply: string; result: SplitResult | null; title: string | null };

export async function runChat(
  history: ChatMessage[],
  members: ChatMember[],
  memoryFacts: string[] = [],
): Promise<ChatResponse> {
  // The conversational agent (createAgent + compute_split tool) returns a typed reply.
  const output = await runChatReply(history, members, memoryFacts);

  if (!output.ready || !output.split) {
    return { reply: output.reply, result: null, title: null };
  }

  const split = output.split;

  // Deterministic guard: participants may only be the selected members + "Me".
  // If the model included anyone else, refuse the split and ask to add them —
  // never trust the model to enforce this.
  const allowed = new Set(members.map((m) => m.name.trim().toLowerCase()));
  allowed.add('me');
  const isAllowed = (name: string) => allowed.has(name.trim().toLowerCase());
  const unknown = [...new Set(split.participants.filter((p) => !isAllowed(p)))];
  if (unknown.length > 0) {
    const names = unknown.join(', ');
    const plural = unknown.length > 1;
    return {
      reply: `${names} ${plural ? "aren't" : "isn't"} added to this split yet — add ${
        plural ? 'them' : names
      } from "Add members" above and I'll split it.`,
      result: null,
      title: null,
    };
  }

  // Drop any assignment references to non-participants; if that empties an
  // item, fall back to everyone so the math stays consistent.
  const assignments = split.assignments.map((a) => {
    const people = a.people.filter(isAllowed);
    return { ...a, people: people.length > 0 ? people : split.participants };
  });

  const perPerson = computePerPerson({
    items: split.items,
    assignments,
    participants: split.participants,
    tax: split.tax,
    tip: split.tip,
  });
  const computedTotal = sumPerPerson(perPerson);
  const needsReview = split.total > 0 && Math.abs(computedTotal - round2(split.total)) > 0.05;

  const result: SplitResult = {
    items: split.items,
    assignments,
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
