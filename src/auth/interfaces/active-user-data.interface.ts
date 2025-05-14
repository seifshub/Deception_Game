import { Role } from '../../users/enums/role.enum';

export interface ActiveUserData {
  /**
   * Subject of the token
   * The value of this property is user ID that granted this token
   */
  sub: number;

  email: string;

  username: string;

  role: Role;
}
