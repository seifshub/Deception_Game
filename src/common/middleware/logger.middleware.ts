import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as morgan from 'morgan';
import { Logger } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  constructor() {}

  use(req: Request, res: Response, next: NextFunction) {
    // Create a token for request body
    morgan.token('body', (req: Request) => {
      if (req.body && Object.keys(req.body).length) {
        // Avoid logging sensitive information
        const safeBody = { ...req.body };
        if (safeBody.password) safeBody.password = '[REDACTED]';
        if (safeBody.token) safeBody.token = '[REDACTED]';
        return JSON.stringify(safeBody);
      }
      return '';
    });

    // Create a token for response body
    morgan.token('response-body', (req: Request, res: any) => {
      if (res.body) {
        return JSON.stringify(res.body);
      }
      return '';
    });

    const format = 'dev';

    morgan(format, {
      stream: {
        write: (message) => this.logger.log(message.trim()),
      },
    })(req, res, next);
  }
}