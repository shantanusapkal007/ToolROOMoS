import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  console.log("Starting backend... Please wait.");
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  
  // Increase payload limits for large BOM files
  const express = require('express');
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  app.useLogger(app.get(Logger));

  // Security headers
  app.use(helmet());

  // Enable CORS — origins read from env for production safety
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3005', 'http://127.0.0.1:3005', 'http://127.0.0.1:3000'];

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
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

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();

