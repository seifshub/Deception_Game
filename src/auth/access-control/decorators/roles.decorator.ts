import { ROLES_KEY } from './keys';
import { SetMetadata } from '@nestjs/common';
import { Role } from '../../users/enums/role.enum';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);