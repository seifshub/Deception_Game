import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { SignUpDto } from './dto/sign-up.dto';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { Request } from 'express';
import { promisify } from 'util';
import { Auth } from './decorators/auth.decorator';
import { AuthType } from './enums/auth-type.enums';

@Auth(AuthType.None)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Req() request: Request, @Body() signInDto: SignInDto) {
    const user = await this.authService.signIn(signInDto);
    await promisify(request.logIn).call(request, user);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Req() request: Request) {
    return this.authService.logout(request);
  }
}
