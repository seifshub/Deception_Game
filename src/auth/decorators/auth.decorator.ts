import { AUTH_TYPE_KEY } from './keys';
import { SetMetadata } from '@nestjs/common';
import { AuthType } from '../enums/auth-type.enums';

export const Auth = (...authTypes: AuthType[]) =>
  SetMetadata(AUTH_TYPE_KEY, authTypes);
