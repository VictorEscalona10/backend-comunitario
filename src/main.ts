import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
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

  // CORS con soporte para cookies y credenciales en local y producción (Render/Vercel)
  const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: (origin, callback) => {
      // Si no hay origen (postman, mobile) o está en la lista o en desarrollo
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        // En producción permitir el origen configurado o cualquier subdominio vercel/render si se especifica
        callback(null, true);
      }
    },
    credentials: true, // Habilitar envío y recepción de cookies HttpOnly
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With'],
  });

  const port = process.env.PORT ?? 3000;
  // Escuchar en 0.0.0.0 para compatibilidad con contenedores y plataformas en la nube (Render)
  await app.listen(port, '0.0.0.0');
  console.log(`Backend server running on http://0.0.0.0:${port}`);
}
bootstrap();
