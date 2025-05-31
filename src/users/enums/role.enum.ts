import { registerEnumType } from '@nestjs/graphql';

export enum Role {
  Regular = 'regular',
  Admin = 'admin',
}

registerEnumType(Role, {
  name: 'Role',
});
