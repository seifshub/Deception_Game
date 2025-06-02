import { NotificationType } from '../enums/notification-type.enum';

export class FriendRequestAcceptedEvent {
  readonly type = NotificationType.FRIEND_REQUEST_ACCEPTED;

  constructor(
    public readonly recipientId: number,
    public readonly senderId: number,
    public readonly friendshipId: number,
  ) {}
}
