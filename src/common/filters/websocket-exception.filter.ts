import {
  ArgumentsHost,
  Catch,
  Logger,
} from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';

@Catch()
export class WebSocketExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WebSocketExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient();
    const data = host.switchToWs().getData();

    let errorMessage = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';
    let requiresReconnect = false;
    
    if (exception instanceof WsException) {
      const error = exception.getError();
      if (typeof error === 'object' && error !== null) {
        errorMessage = error['message'] || errorMessage;
        errorCode = error['code'] || errorCode;
        requiresReconnect = error['requiresReconnect'] || false;
      } else {
        errorMessage = error.toString();
      }
    } else if (exception instanceof Error) {
      errorMessage = exception.message;
      this.logger.error(`WebSocket error: ${errorMessage}`, exception.stack);
    }

    const errorResponse = {
      status: 'error',
      timestamp: new Date().toISOString(),
      message: errorMessage,
      code: errorCode,
      requiresReconnect,
      event: data.event || 'unknown',
    };

    this.logger.warn(`WebSocket error: ${JSON.stringify({
      event: data.event,
      error: exception instanceof Error ? exception.message : String(exception),
      stack: exception instanceof Error ? exception.stack : undefined,
    })}`);

    client.emit('error', errorResponse);
  }
}
