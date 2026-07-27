import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';

import { AppModule } from './app.module';
import { ErrorShapeFilter } from './common/http-exception.filter';

/**
 * LangSmith auto-tracing: LangChain reads these env vars at call time. We mirror
 * the modern LANGSMITH_* names to the older LANGCHAIN_* aliases so tracing works
 * regardless of LangChain version. Set them in .env.local (see .env.example).
 */
function configureLangSmith(): void {
  const alias: Record<string, string> = {
    LANGSMITH_TRACING: 'LANGCHAIN_TRACING_V2',
    LANGSMITH_API_KEY: 'LANGCHAIN_API_KEY',
    LANGSMITH_PROJECT: 'LANGCHAIN_PROJECT',
    LANGSMITH_ENDPOINT: 'LANGCHAIN_ENDPOINT',
  };
  for (const [modern, legacy] of Object.entries(alias)) {
    if (process.env[modern] && !process.env[legacy]) process.env[legacy] = process.env[modern];
  }
  const on =
    process.env.LANGCHAIN_TRACING_V2 === 'true' && !!process.env.LANGCHAIN_API_KEY;
  Logger.log(
    on ? `LangSmith tracing ON (project: ${process.env.LANGCHAIN_PROJECT ?? 'default'})` : 'LangSmith tracing off',
    'Bootstrap',
  );
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ConfigModule has now loaded .env.local into process.env.
  configureLangSmith();

  // The Expo app runs on a different origin (web/dev). Must allow the
  // Authorization header or browsers block every authenticated request with
  // "Failed to fetch". ngrok-skip-browser-warning lets browser fetches bypass
  // ngrok's interstitial page.
  app.enableCors({
    origin: '*',
    methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization,ngrok-skip-browser-warning',
  });

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
