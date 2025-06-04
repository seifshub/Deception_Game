import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { Server } from 'socket.io';
import * as passport from 'passport';
import { 
  cookieParserMiddleware, 
  createSessionMiddleware, 
  passportMiddlewares, 
  sessionDebugMiddleware 
} from './common/middlewares/session.middleware';
import { IncomingMessage } from 'http';

async function bootstrap() {  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  const configService = app.get(ConfigService);
  const sessionSecret = configService.get<string>('app.session.secret');
  const dbConfig = configService.get('app.database');
  
  // Create session middleware with database config
  const sessionMiddleware = createSessionMiddleware(sessionSecret!, dbConfig);

  app.use(cookieParserMiddleware); 
  app.use(sessionMiddleware); 
  app.use(...passportMiddlewares);
  app.use(sessionDebugMiddleware);  // Add the debug middleware

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: false,
    }),
  );

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useStaticAssets(join(__dirname, '..', 'src', 'games', 'test'));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        return new BadRequestException(errors);
      },
    }),
  );

  const server = app.getHttpServer();
  const io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });
  io.use((socket, next) => {
    cookieParserMiddleware(socket.request as any, {} as any, () => {
      sessionMiddleware(socket.request as any, {} as any, () => {
        passport.initialize()(socket.request as any, {} as any, () => {
          passport.session()(socket.request as any, {} as any, () => {
            console.log('[WS] Session ID:', socket.request.sessionID);
            console.log('[WS] Session Passport:', socket.request.session?.passport);
            console.log('[WS] Is authenticated:', socket.request.isAuthenticated ? 
              socket.request.isAuthenticated() : 'method not available');
            if (!socket.request.isAuthenticated || !socket.request.isAuthenticated()) {
              console.log('[WS] Authentication failed for session', socket.request.sessionID);
            }
            next();
          });
        });
      });
    });
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

bootstrap();
