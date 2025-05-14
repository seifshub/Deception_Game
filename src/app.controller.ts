import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ActiveUser } from './auth/decorators/active-user.decorator';
import { ActiveUserData } from './auth/interfaces/active-user-data.interface';
import { Roles } from './access-control/decorators/roles.decorator';
import { Role } from './users/enums/role.enum';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Roles(Role.Admin)
  @Get()
  getHello(@ActiveUser() user: ActiveUserData): string {
    return this.appService.getHello(user.username);
  }
}
