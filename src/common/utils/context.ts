import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export function getRequestFromContext(context: ExecutionContext) {
  const type = context.getType<'graphql' | 'http'>();
  if (type === 'graphql') {
    return GqlExecutionContext.create(context).getContext().req;
  }
  return context.switchToHttp().getRequest();
}
