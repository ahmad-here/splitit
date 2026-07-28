/**
 * Static graph exports for LangGraph Studio ONLY. The real flows build agents
 * per-request (with per-user members/memory) in split-agent.ts / chat-agent.ts;
 * Studio needs a statically-exported compiled graph to introspect, so we expose
 * plain versions here. Referenced by ../../../langgraph.json.
 */

import { createAgent, toolStrategy } from 'langchain';

import { SPLIT_AGENT_PROMPT, SYSTEM_PROMPT } from '../constants';
import { getProvider } from '../llm';
import { computeSplitTool } from '../tools';
import { ChatReplySchema, SplitDraftSchema } from '../schema';

/** Conversational split agent (chat flow). */
export const chatGraph = createAgent({
  model: getProvider().getModel(),
  tools: [computeSplitTool],
  systemPrompt: SYSTEM_PROMPT,
  responseFormat: toolStrategy(ChatReplySchema) as never,
});

/** Receipt split agent (vision flow). */
export const splitGraph = createAgent({
  model: getProvider().getModel(),
  tools: [computeSplitTool],
  systemPrompt: SPLIT_AGENT_PROMPT,
  responseFormat: toolStrategy(SplitDraftSchema) as never,
});
