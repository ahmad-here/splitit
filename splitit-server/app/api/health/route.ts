import { getProvider } from '@/lib/llm';

export async function GET() {
  let provider = 'unknown';
  try {
    provider = getProvider().name;
  } catch {
    
  }
  return Response.json({ ok: true, provider });
}
