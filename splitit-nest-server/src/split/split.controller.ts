import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { SplitService } from './split.service';
import type { SplitResult } from '../core/schema';
import type { UploadedFileLike } from '../common/uploaded-file';

/**
 * POST /api/split — multipart/form-data:
 *   image        the invoice photo (File)
 *   description  free text "who bought what"
 *   participants repeated field, one name per entry
 */
@Controller('split')
export class SplitController {
  constructor(private readonly splitService: SplitService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async split(
    @UploadedFile() image: UploadedFileLike | undefined,
    @Body() body: { description?: string; participants?: string | string[] },
  ): Promise<SplitResult> {
    return this.splitService.split(image, body?.description, body?.participants);
  }
}
