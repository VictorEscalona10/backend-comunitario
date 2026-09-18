import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log('Starting NestJS application...');

  const app = await NestFactory.create(AppModule);

  // Cookie parser middleware con clave secreta
  const cookieSecret = process.env.COOKIE_SECRET || 'cookie_secret_comunitario_secure_123';
  const cookieMiddleware = (cookieParser as any).default || cookieParser;
  app.use(cookieMiddleware(cookieSecret));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no decoradas en DTOs
      forbidNonWhitelisted: true, // Lanza error si hay propiedades no permitidas
      transform: true, // Transforma payloads a instancias DTO
      transformOptions: {
        enableImplicitConversion: true, // Convierte tipos automáticamente
      },
    }),
  );

  // CORS con soporte para cookies y credenciales
  const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With'],
  });

  // Render provee el puerto en la variable PORT (ej. 10000)
  const port = parseInt(process.env.PORT || '3000', 10);
  
  // Escuchar en 0.0.0.0 para que Render pueda detectar el puerto abierto
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 Application successfully listening on http://0.0.0.0:${port}`);
}

bootstrap().catch((err) => {
  console.error('Fatal error during application bootstrap:', err);
  process.exit(1);
});
