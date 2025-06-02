import { Args, Query, Resolver } from '@nestjs/graphql';
import { NotificationsService } from './notifications.service';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import { Notification } from './entities/notification.entity';

@Resolver(() => Notification)
export class NotificationsResolver {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Query(() => [Notification], { name: 'myNotifications' })
  async getForUser(
    @ActiveUser('sub') userId: number,
    @Args('page', { type: () => Number, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Number, defaultValue: 10 }) limit: number,
  ) {
    return this.notificationsService.findNotificationsByUser(
      userId,
      page,
      limit,
    );
  }
}
