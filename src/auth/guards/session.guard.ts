import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { getRequestFromContext } from '../../common/utils/context';

@Injectable()
export class SessionGuard implements CanActivate {
  private readonly logger = new Logger(SessionGuard.name);
  
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = getRequestFromContext(context);
    
    if (!req.isAuthenticated) {
      this.logger.error('isAuthenticated method is not available on request object');
      return false;
    }
    
    return req.isAuthenticated();
  }
}
