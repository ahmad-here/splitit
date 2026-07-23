import { Controller, Get } from '@nestjs/common';

import { LlmService } from '../llm/llm.service';

/** GET /api/health — liveness plus which LLM provider is wired up. */
@Controller('health')
export class HealthController {
  constructor(private readonly llm: LlmService) {}

  @Get()
  health(): { ok: true; provider: string } {
    let provider = 'unknown';
    try {
      provider = this.llm.providerName;
    } catch {
      // provider misconfigured — still report liveness
    }
    return { ok: true, provider };
  }
}
