import { Controller, Sse } from '@nestjs/common';
import { Auth } from '../auth/decorators/auth.decorator';
import { NotificationsService } from './notifications.service';
import { AuthType } from '../auth/enums/auth-type.enums';
import { filter, map, Observable } from 'rxjs';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import { Notification } from './entities/notification.entity';

@Controller('notifications')
export class SSEController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Auth(AuthType.Session)
  @Sse('sse')
  getNotifications(
    @ActiveUser('sub') userId: number,
  ): Observable<{ data: Partial<Notification> }> {
    return this.notificationsService.getNotificationStream().pipe(
      filter((notification: Notification) => {
        return notification.user && notification.user.id === userId;
      }),
      map((notification: Notification) => ({
        data: {
          id: notification.id,
          title: notification.title,
          content: notification.content,
          type: notification.type,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
        },
      })),
    );
  }
}
