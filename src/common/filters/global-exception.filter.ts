import { Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { GqlArgumentsHost } from '@nestjs/graphql';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    let status: number;
    let message: string;

    if (host.getType() === 'http') {
      // HTTP context (REST)
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();

      if (exception instanceof HttpException) {
        status = exception.getStatus();
        message = exception.message;
      } else {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Internal server error';
      }

      // Log the error with HTTP request details
      this.logger.error(
        `${request.method} ${request.url} - ${status} ${message}`,
        exception instanceof Error ? exception.stack : ''
      );

      // Standard HTTP response
      response.status(status).json({
        statusCode: status,
        message,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    } else {
      // GraphQL context
      if (exception instanceof HttpException) {
        status = exception.getStatus();
        message = exception.message;
      } else {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = exception instanceof Error ? exception.message : 'Internal server error';
      }

      // Get GraphQL info if available
      let operationName = 'GraphQL operation';
      try {
        const gqlHost = GqlArgumentsHost.create(host);
        const info = gqlHost.getInfo();
        if (info) {
          operationName = info.fieldName || operationName;
        }
      } catch (err) {
      }

      // Log the error with GraphQL operation details
      this.logger.error(
        `GraphQL ${operationName} - ${status} ${message}`,
        exception instanceof Error ? exception.stack : ''
      );

      // For GraphQL, we just rethrow the exception and let Apollo handle it
      throw exception;
    }
  }
}