import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as morgan from 'morgan';

interface ResponseWithBody extends Response {
  body?: string;
}

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  constructor() {
    morgan.token('body', (req: Request) => {
      if (req.body && Object.keys(req.body).length > 0) {
        const safeBody = { ...req.body };
        if ('password' in safeBody) safeBody.password = '[REDACTED]';
        if ('token' in safeBody) safeBody.token = '[REDACTED]';
        return JSON.stringify(safeBody);
      }
      return '';
    });

    morgan.token('response-body', (req: Request, res: ResponseWithBody) => {
      if (process.env.NODE_ENV === 'production') return '';
      if (res.body && res.body.length < 1000) return res.body;
      return '[RESPONSE TOO LARGE OR OMITTED]';
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    const resWithBody = res as ResponseWithBody;
    resWithBody.body = '';

    const oldWrite = res.write.bind(res);
    const oldEnd = res.end.bind(res);

    res.write = function (chunk: any, ...args: any[]): boolean {
      if (chunk) {
        resWithBody.body += chunk instanceof Buffer ? chunk.toString() : chunk;
      }
      return oldWrite(chunk, ...args);
    };

    res.end = function (chunk: any, ...args: any[]): any {
      if (chunk) {
        resWithBody.body += chunk instanceof Buffer ? chunk.toString() : chunk;
      }
      return oldEnd(chunk, ...args);
    };

    morgan(
      ':method :url :status :res[content-length] - :response-time ms :body :response-body',
      {
        stream: {
          write: (message: string) => this.logger.log(message.trim()),
        },
      },
    )(req, resWithBody, next);
  }
}
