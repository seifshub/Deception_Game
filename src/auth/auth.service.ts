import {
  ConflictException,
  HttpStatus,
  Injectable,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { HashingService } from './hashing/hashing.service';
import { SignUpDto } from './dto/sign-up.dto';
import { PG_UNIQUE_VIOLATION_KEY } from './auth.constants';
import { UQ_USER_EMAIL, UQ_USER_USERNAME } from '../users/users.constants';
import { SignInDto } from './dto/sign-in.dto';
import { Request } from 'express';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly hashingService: HashingService,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    try {
      const user = new User();
      user.email = signUpDto.email;
      user.username = signUpDto.username;
      user.password = await this.hashingService.hash(signUpDto.password);
      await this.userRepository.save(user);
    } catch (err) {
      console.log(err);
      if (err.code === PG_UNIQUE_VIOLATION_KEY) {
        switch (err.constraint) {
          case UQ_USER_EMAIL:
            throw new ConflictException('Email already exists');
          case UQ_USER_USERNAME:
            throw new ConflictException('Username already exists');
          default:
            throw new ConflictException();
        }
      }
      throw err;
    }
  }

  async signIn(signInDto: SignInDto) {
    const user = await this.userRepository.findOne({
      where: { username: signInDto.username },
    });
    if (!user) {
      throw new UnauthorizedException('User does not exist');
    }
    const isEqual = await this.hashingService.compare(
      signInDto.password,
      user.password,
    );
    if (!isEqual) {
      throw new UnauthorizedException('Password does not match');
    }
    return user;
  }

  async logout(@Req() request: Request) {
    request.session.destroy(() => {
      return {
        message: 'Logout successful',
        statusCode: HttpStatus.OK,
      };
    });
  }
}
