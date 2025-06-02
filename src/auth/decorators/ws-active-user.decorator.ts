import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { REQUEST_USER_KEY } from './keys';
import { ActiveUserData } from '../interfaces/active-user-data.interface';
import { Socket } from 'socket.io';

export const WsActiveUser = createParamDecorator(
  (field: keyof ActiveUserData | undefined, ctx: ExecutionContext) => {
    const client = ctx.switchToWs().getClient<Socket>();
    const request = client.request as any;
    const user: ActiveUserData | undefined = request[REQUEST_USER_KEY];
    return field ? user?.[field] : user;
  },
);
