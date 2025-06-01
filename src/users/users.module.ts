import { Module } from '@nestjs/common';
import { User } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friendship } from './entities/friendship.entity';
import { FriendsController } from './friendship.controller';
import { FriendshipService } from './friendship.service';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Friendship])],
  controllers: [FriendsController],
  providers: [FriendshipService, UsersService],
  exports: [FriendshipService, UsersService],
})
export class UsersModule {}
