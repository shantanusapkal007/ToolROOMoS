import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
const compression = require('compression');
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  console.log("Starting backend... Please wait.");
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  
  // Standard payload limit for normal requests (prevents DoS via memory exhaustion)
  const express = require('express');
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // Enable gzip response compression
  app.use(compression());

  app.useLogger(app.get(Logger));

  // Security headers (Tailored for REST API)
  app.use(
    helmet({
      contentSecurityPolicy: false, // CSP applies to HTML web servers, not JSON APIs
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginOpenerPolicy: false,
    }),
  );

  // Enable CORS — supports comma-separated origins, wildcard, or dynamic client hosts
  const rawAllowedOrigins = process.env.ALLOWED_ORIGINS;
  const allowedList = rawAllowedOrigins
    ? rawAllowedOrigins.split(',').map((o) => o.trim().toLowerCase())
    : [];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow non-browser requests (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // If wildcards or unconfigured, allow all origins
      if (!rawAllowedOrigins || allowedList.includes('*') || rawAllowedOrigins.trim() === '') {
        return callback(null, true);
      }

      const normalized = origin.toLowerCase();
      if (
        allowedList.includes(normalized) ||
        normalized.includes('localhost') ||
        normalized.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }

      // Check without port
      const originWithoutPort = normalized.replace(/:\d+$/, '');
      if (allowedList.some((allowed) => allowed.includes(originWithoutPort))) {
        return callback(null, true);
      }

      return callback(null, true);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Request-ID',
      'Idempotency-Key',
      'X-API-Version',
      'Accept',
    ],
  });

  // Global validation pipe
  // whitelist: strips properties not in DTO
  // forbidNonWhitelisted: set to false so extra fields (like status from UI) are stripped without failing
  // transform: auto-convert primitives (string → number etc.)
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  // Global Exception Filters — registered in order from least to most specific.
  // AllExceptionsFilter is the catch-all (runs last in chain = catches first).
  // PrismaExceptionFilter is more specific and registered after, so it catches DB errors first.
  app.useGlobalFilters(new AllExceptionsFilter(), new PrismaExceptionFilter());

  await app.listen(process.env.PORT ?? 4000, '0.0.0.0');
}
bootstrap();

