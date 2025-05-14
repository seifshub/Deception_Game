import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/keys';
import { Role } from '../../users/enums/role.enum';
import { ActiveUserData } from '../../auth/interfaces/active-user-data.interface';
import { REQUEST_USER_KEY } from '../../auth/decorators/keys';
import { getRequestFromContext } from '../../common/utils/context';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const contextRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!contextRoles) {
      return true;
    }
    const request = getRequestFromContext(context);

    const user: ActiveUserData = request[REQUEST_USER_KEY];

    return contextRoles.some((role) => user.role === role);
  }
}
