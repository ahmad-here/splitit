import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';

import { runSplit } from '../core/agents/split-agent';
import type { SplitResult } from '../core/schema';
import type { UploadedFileLike } from '../common/uploaded-file';

/** Normalise a multipart field that may arrive once or repeated. */
function toList(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  const raw = Array.isArray(value) ? value : [value];
  return raw.map((v) => String(v).trim()).filter(Boolean);
}

@Injectable()
export class SplitService {
  async split(
    image: UploadedFileLike | undefined,
    description: unknown,
    participants: unknown,
  ): Promise<SplitResult> {
    if (!image) throw new BadRequestException('Missing "image" file.');

    const people = toList(participants);
    if (people.length === 0) {
      throw new BadRequestException('At least one participant is required.');
    }

    const mime = image.mimetype || 'image/jpeg';
    const imageDataUrl = `data:${mime};base64,${image.buffer.toString('base64')}`;

    // One-shot flow → one LangSmith thread per split request.
    return runSplit(
      {
        imageDataUrl,
        description: String(description ?? ''),
        participants: people,
      },
      randomUUID(),
    );
  }
}
