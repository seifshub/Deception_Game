import { Friendship } from './entities/friendship.entity';
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { FriendshipService } from './friendship.service';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import { User } from './entities/user.entity';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enums';

@Auth(AuthType.Session)
@Controller('friends')
export class FriendsController {
  constructor(private readonly friendshipService: FriendshipService) {}

  @Post(':addresseeId')
  async sendRequest(
    @ActiveUser('sub') requesterId: number,
    @Param('addresseeId') addresseeId: number,
  ): Promise<Friendship> {
    return this.friendshipService.sendRequest(requesterId, addresseeId);
  }

  @Get('requests/pending')
  async getPendingRequests(
    @ActiveUser('sub') userId: number,
  ): Promise<Friendship[]> {
    return this.friendshipService.getPendingRequests(userId);
  }

  @Post('requests/:requestId/accept')
  async acceptRequest(
    @ActiveUser('sub') userId: number,
    @Param('requestId') requestId: number,
  ): Promise<Friendship> {
    return this.friendshipService.acceptRequest(userId, requestId);
  }

  @Post('requests/:requestId/refuse')
  @HttpCode(HttpStatus.NO_CONTENT)
  async refuseRequest(
    @ActiveUser('sub') userId: number,
    @Param('requestId') requestId: number,
  ): Promise<void> {
    return this.friendshipService.refuseRequest(userId, requestId);
  }

  @Get()
  async getFriends(@ActiveUser('sub') userId: number): Promise<User[]> {
    return this.friendshipService.getFriends(userId);
  }
}
