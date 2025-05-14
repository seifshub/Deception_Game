import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class SessionGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const ctxType = context.getType<'graphql' | 'http'>();
    let req;
    if (ctxType === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context);
      req = gqlCtx.getContext().req;
    } else {
      req = context.switchToHttp().getRequest();
    }

    return req.isAuthenticated();
  }
}
