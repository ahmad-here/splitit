import { runSplit } from '@/lib/graph/graph';

/** CORS headers so the Expo app (different origin in dev) can call this. */
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}

/**
 * POST /api/split
 * multipart/form-data:
 *   - image:         the invoice photo (File)
 *   - description:   free text "who bought what"
 *   - participants:  repeated field, one name per entry
 *
 * Returns the reconciled SplitResult (see lib/schema.ts).
 */
export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const image = form.get('image');
    const description = String(form.get('description') ?? '');
    const participants = form
      .getAll('participants')
      .map((p) => String(p).trim())
      .filter(Boolean);

    if (!(image instanceof File)) {
      return Response.json({ error: 'Missing "image" file.' }, { status: 400, headers: cors });
    }
    if (participants.length === 0) {
      return Response.json({ error: 'At least one participant is required.' }, { status: 400, headers: cors });
    }

    const bytes = Buffer.from(await image.arrayBuffer());
    const mime = image.type || 'image/jpeg';
    const imageDataUrl = `data:${mime};base64,${bytes.toString('base64')}`;

    const result = await runSplit({ imageDataUrl, description, participants });
    return Response.json(result, { headers: cors });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to process the invoice.';
    return Response.json({ error: message }, { status: 500, headers: cors });
  }
}
