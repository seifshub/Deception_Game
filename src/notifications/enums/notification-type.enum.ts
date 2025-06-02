import { registerEnumType } from '@nestjs/graphql';

export enum NotificationType {
  FRIEND_REQUEST = 'FRIEND_REQUEST',
  FRIEND_REQUEST_ACCEPTED = 'FRIEND_REQUEST_ACCEPTED',
  LOBBY_INVITE = 'LOBBY_INVITE',
}

registerEnumType(NotificationType, {
  name: 'NotificationTypeEnum',
  description: 'The type of the notification',
});
