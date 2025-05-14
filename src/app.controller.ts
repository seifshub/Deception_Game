import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ActiveUser } from './auth/decorators/active-user.decorator';
import { ActiveUserData } from './auth/interfaces/active-user-data.interface';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(@ActiveUser() user: ActiveUserData): string {
    return this.appService.getHello(user.username);
  }
}
