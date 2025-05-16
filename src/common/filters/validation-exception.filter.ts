import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(ValidationExceptionFilter.name);

    catch(exception: BadRequestException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest();

        const exceptionResponse = exception.getResponse() as any;
        let validationErrors = {};
        let errorMessage = 'Validation failed';

        if (exceptionResponse.message && Array.isArray(exceptionResponse.message)) {
            exceptionResponse.message.forEach((error: any) => {
                if (typeof error === 'string') {
                    validationErrors = { ...validationErrors, general: error };
                } else if (error.property && error.constraints) {
                    validationErrors = {
                        ...validationErrors,
                        [error.property]: Object.values(error.constraints)[0]
                    };
                }
            });
        } else if (exceptionResponse.message) {
            errorMessage = exceptionResponse.message;
        }

        this.logger.warn(`Validation failed for ${request.method} ${request.url}`, {
            endpoint: request.url,
            validationErrors, 
        });

        response.status(400).json({
            statusCode: 400,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: errorMessage,
            success: false,
            errors: validationErrors,
        });
    }
}
