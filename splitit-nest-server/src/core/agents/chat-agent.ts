import { AIMessage, HumanMessage, type BaseMessage } from '@langchain/core/messages';
import { createAgent, toolStrategy } from 'langchain';

import { SYSTEM_PROMPT } from '../constants';
import { getProvider } from '../llm';
import { agentInvokeConfig } from '../llm/call-options';
import { computeSplitTool } from '../tools';
import { ChatReplySchema, type ChatMember, type ChatMessage, type ChatReply } from '../schema';

/**
 * Gemini only accepts images as base64 data URLs. Restored chats carry the
 * receipt as an https (Cloudinary) URL, so fetch + convert those; pass data URLs
 * through untouched. Returns null on failure so we can drop the image gracefully.
 */
async function toDataUrl(image: string): Promise<string | null> {
  if (image.startsWith('data:')) return image;
  if (!/^https?:\/\//.test(image)) return null;
  try {
    const res = await fetch(image);
    if (!res.ok) return null;
    const mime = res.headers.get('content-type') || 'image/jpeg';
    const b64 = Buffer.from(await res.arrayBuffer()).toString('base64');
    return `data:${mime};base64,${b64}`;
  } catch {
    return null;
  }
}

/** Turn the chat history into agent messages (image turns carry an image_url). */
async function toMessages(history: ChatMessage[]): Promise<BaseMessage[]> {
  return Promise.all(
    history.map(async (m) => {
      if (m.role === 'assistant') return new AIMessage(m.text);
      if (m.image) {
        const dataUrl = await toDataUrl(m.image);
        if (dataUrl) {
          return new HumanMessage({
            content: [
              { type: 'text', text: m.text || '(no message — receipt photo attached)' },
              { type: 'image_url', image_url: dataUrl },
            ],
          });
        }
      }
      return new HumanMessage(m.text);
    }),
  );
}

/**
 * Conversational split agent. Uses the compute_split tool for money math and
 * returns a typed ChatReply (responseFormat). Known members + long-term memory
 * are injected into the system prompt. Post-processing (participant guard,
 * building the SplitResult) stays in chat/agent.ts.
 */
export async function runChatReply(
  history: ChatMessage[],
  members: ChatMember[],
  memoryFacts: string[] = [],
  threadId?: string,
): Promise<ChatReply> {
  const membersLine =
    members.length > 0
      ? `KNOWN MEMBERS (json): ${JSON.stringify(members)}`
      : 'KNOWN MEMBERS (json): [] (the user has not added any members yet)';
  const memoryLine =
    memoryFacts.length > 0
      ? `\n\nWHAT YOU REMEMBER ABOUT THE USER (from past chats): ${JSON.stringify(memoryFacts)}`
      : '';

  const agent = createAgent({
    model: getProvider().getModel(),
    tools: [computeSplitTool],
    systemPrompt: `${SYSTEM_PROMPT}\n\n${membersLine}${memoryLine}`,
    // Cast: langchain 1.5's ResponseFormat generics don't line up with zod v4's
    // inferred type, but toolStrategy validates against the schema at runtime.
    responseFormat: toolStrategy(ChatReplySchema) as never,
  });

  const res = (await agent.invoke(
    { messages: await toMessages(history) },
    agentInvokeConfig(threadId),
  )) as unknown as {
    structuredResponse: ChatReply;
  };
  return res.structuredResponse;
}
