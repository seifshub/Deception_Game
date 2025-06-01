import { NotificationType } from '../enums/notification-type.enum';

export class FriendRequestReceivedEvent {
  readonly type = NotificationType.FRIEND_REQUEST;

  constructor(
    public readonly recipientId: number,
    public readonly senderId: number,
    public readonly friendshipId: number,
  ) {}
}
