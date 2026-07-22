import { runChat } from '@/lib/chat/agent';
import { ChatRequestSchema } from '@/lib/schema';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}

/**
 * POST /api/chat — conversational bill splitting.
 * Body: { messages: ChatMessage[], members: ChatMember[] }
 * Returns: { reply: string, result: SplitResult | null }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = ChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: 'Invalid request body.' }, { status: 400, headers: cors });
    }
    if (parsed.data.messages.length === 0) {
      return Response.json({ error: 'No messages provided.' }, { status: 400, headers: cors });
    }

    const { reply, result, title } = await runChat(parsed.data.messages, parsed.data.members);
    return Response.json({ reply, result, title }, { headers: cors });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to process the chat.';
    return Response.json({ error: message }, { status: 500, headers: cors });
  }
}
