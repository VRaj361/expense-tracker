import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const helmet = require('helmet');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');

  // Security headers (XSS protection, content-type sniffing, etc.)
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  }));

  // CORS — allow configured frontend + local network for dev
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
  ];
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.some(o => origin.startsWith(o)) ||
        origin.match(/^http:\/\/192\.168\.\d+\.\d+:\d+$/) ||
        origin.match(/^http:\/\/localhost:\d+$/)
      ) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.use(cookieParser());

  // Limit request body size
  app.use(require('express').json({ limit: '5mb' }));
  app.use(require('express').urlencoded({ extended: true, limit: '5mb' }));

  // Validation — strip unknown properties, transform types
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Uploads served through authenticated endpoint, not public static
  // app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Server running on http://0.0.0.0:${port}`);
}
bootstrap();
