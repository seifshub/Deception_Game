import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { REQUEST_USER_KEY } from './keys';
import { ActiveUserData } from '../interfaces/active-user-data.interface';
import { GqlExecutionContext } from '@nestjs/graphql';

export const ActiveUser = createParamDecorator(
  (field: keyof ActiveUserData | undefined, ctx: ExecutionContext) => {
    const ctxType = ctx.getType<'graphql' | 'http'>();
    const request =
      ctxType === 'graphql'
        ? GqlExecutionContext.create(ctx).getContext().req
        : ctx.switchToHttp().getRequest();

    const user: ActiveUserData | undefined = request[REQUEST_USER_KEY];
    return field ? user?.[field] : user;
  },
);
