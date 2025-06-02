import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import * as cookie from 'cookie';
import * as sessionParser from 'express-session';
import * as passport from 'passport';
import { Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import AppConfig from '../../config/app.config';
import { REQUEST_USER_KEY } from '../decorators/keys';

function applyMiddlewares(req: any, middlewares: Function[]): Promise<void> {
  return middlewares.reduce(
    (prev, middleware) =>
      prev.then(() => new Promise<void>((resolve, reject) =>
        middleware(req, {} as any, (err: any) => (err ? reject(err) : resolve()))
      )),
    Promise.resolve()
  );
}

@Injectable()
export class WsSessionGuard implements CanActivate {
  constructor(
    @Inject(AppConfig.KEY)
    private readonly appConfiguration: ConfigType<typeof AppConfig>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    const request = client.request as any;

    // If session has already been processed, return result
    if (request[REQUEST_USER_KEY]) {
      return request.isAuthenticated?.() ?? false;
    }

    const cookies = cookie.parse(client.handshake.headers.cookie || '');

    if (!cookies || !cookies['connect.sid']) {
      throw new WsException('Unauthorized: No session cookie found');
    }

    // Create session middleware instance with correct config
    const sessionMiddleware = sessionParser({
      secret: this.appConfiguration.session.secret!,
      resave: false,
      saveUninitialized: false,
    });

    try {
      await applyMiddlewares(request, [
        sessionMiddleware,
        passport.initialize(),
        passport.session(),
      ]);
    } catch (err) {
      throw new WsException('Unauthorized: Session or passport middleware failed');
    }

    const isAuthenticated = request.isAuthenticated?.();
    if (!isAuthenticated || !request.user) {
      throw new WsException('Unauthorized: Not authenticated');
    }

    return true;
  }
}
