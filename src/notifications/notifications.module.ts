import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsResolver } from './notifications.resolver';
import { SSEController } from './sse.controller';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { FriendRequestNotification } from './entities/friend-request-notification.entity';
import { FriendRequestAcceptedNotification } from './entities/friend-request-accepted-notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      FriendRequestNotification,
      FriendRequestAcceptedNotification,
    ]),
    UsersModule,
  ],
  providers: [NotificationsService, NotificationsResolver],
  controllers: [SSEController],
})
export class NotificationsModule {}
