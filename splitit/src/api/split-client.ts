/**
 * Client for the Splitit backend (Next.js). Posts the invoice image +
 * description + participants and returns the reconciled split.
 */

import { httpClient } from '@/api/http-client';
import type { SplitResult } from '@/db/models';

export type RequestSplitInput = {
  imageUri: string;
  description: string;
  participants: string[];
};

function inferMime(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic')) return 'image/heic';
  return 'image/jpeg';
}

export async function requestSplit({ imageUri, description, participants }: RequestSplitInput): Promise<SplitResult> {
  const form = new FormData();
  // React Native FormData accepts the { uri, name, type } file shape.
  form.append('image', {
    uri: imageUri,
    name: 'invoice.jpg',
    type: inferMime(imageUri),
  } as unknown as Blob);
  form.append('description', description);
  for (const p of participants) form.append('participants', p);

  return httpClient.postForm<SplitResult>('/api/split', form);
}
