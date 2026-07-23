import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';

import { AppModule } from './app.module';
import { ErrorShapeFilter } from './common/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // The Expo app runs on a different origin in dev.
  app.enableCors({ origin: '*', methods: 'GET,POST,OPTIONS', allowedHeaders: 'Content-Type' });

  // Keeps the existing /api/split, /api/chat, /api/health paths.
  app.setGlobalPrefix('api');

  // Chat sends receipt photos as base64 data URLs inside JSON.
  app.use(json({ limit: '25mb' }));
  app.use(urlencoded({ limit: '25mb', extended: true }));

  // Every error responds as { error: string } — the shape the app parses.
  app.useGlobalFilters(new ErrorShapeFilter());

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
