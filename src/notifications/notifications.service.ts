import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { Subject } from 'rxjs';
import { OnEvent } from '@nestjs/event-emitter';
import { FriendRequestReceivedEvent } from './events/friend-request-notification.event';
import { FriendRequestNotification } from './entities/friend-request-notification.entity';
import { User } from '../users/entities/user.entity';
import { Friendship } from '../users/entities/friendship.entity';
import { UsersService } from '../users/users.service';
import { FriendshipService } from '../users/friendship.service';
import { GenericCrudService } from '../common/services/generic.crud.service';
import {
  FRIEND_REQUEST_ACCEPTED_EVENT,
  FRIEND_REQUEST_RECEIVED_EVENT,
} from './constants/notifications.constants';
import { FriendRequestAcceptedEvent } from './events/friend-request-accepted-notification.event';
import { FriendRequestAcceptedNotification } from './entities/friend-request-accepted-notification.entity';

@Injectable()
export class NotificationsService extends GenericCrudService<Notification> {
  private notificationSubject = new Subject<Notification>();

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(FriendRequestNotification)
    private readonly frNotificationRepo: Repository<FriendRequestNotification>,
    @InjectRepository(FriendRequestAcceptedNotification)
    private readonly fraNotificationRepo: Repository<FriendRequestAcceptedNotification>,
    private readonly usersService: UsersService,
    private readonly friendshipService: FriendshipService,
  ) {
    super(notificationRepository);
  }

  @OnEvent(FRIEND_REQUEST_RECEIVED_EVENT)
  async handleFriendRequest(
    payload: FriendRequestReceivedEvent,
  ): Promise<FriendRequestNotification> {
    const recipient: User = await this.usersService.findOne(
      payload.recipientId,
    );

    const sender: User = await this.usersService.findOne(payload.senderId);

    const friendship: Friendship = await this.friendshipService.findOne(
      payload.friendshipId,
    );

    const frNotification = this.frNotificationRepo.create({
      title: 'New Friend Request',
      content: `User ${sender.username} sent you a friend request.`,
      type: payload.type,
      user: recipient,
      sender: sender,
      friendship: friendship,
      isRead: false,
    });

    const saved = await this.frNotificationRepo.save(frNotification);

    this.notificationSubject.next(saved);
    console.log(this.notificationSubject);
    return saved;
  }

  @OnEvent(FRIEND_REQUEST_ACCEPTED_EVENT)
  async handleFriendRequestAccepted(
    payload: FriendRequestAcceptedEvent,
  ): Promise<FriendRequestAcceptedNotification> {
    const recipient: User = await this.usersService.findOne(
      payload.recipientId,
    );

    const sender: User = await this.usersService.findOne(payload.senderId);

    const friendship: Friendship = await this.friendshipService.findOne(
      payload.friendshipId,
    );

    const fraNotification = this.fraNotificationRepo.create({
      title: 'Friend Request Accepted',
      content: `User ${sender.username} accepted your friend request.`,
      type: payload.type,
      user: recipient,
      sender: sender,
      friendship: friendship,
      isRead: false,
    });

    const saved = await this.fraNotificationRepo.save(fraNotification);

    this.notificationSubject.next(saved);
    return saved;
  }

  getNotificationStream() {
    return this.notificationSubject.asObservable();
  }

  async markAsRead(id: number): Promise<Notification> {
    const notification = await this.notificationRepository.findOneBy({ id });
    if (!notification) throw new Error('Notification not found');

    notification.isRead = true;
    return this.notificationRepository.save(notification);
  }

  async markManyAsRead(ids: number[]): Promise<any> {
    if (ids.length === 0) {
      return { affected: 0 };
    }

    const result = await this.notificationRepository.update(
      { id: In(ids) },
      { isRead: true },
    );
    return result;
  }

  async findNotificationsByUser(
    userId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<Notification[]> {
    const qb = this.notificationRepository
      .createQueryBuilder('notification')
      .innerJoin('notification.users', 'user', 'user.id = :userId', {
        userId,
      })
      .orderBy('notification.createdAt', 'DESC');

    return this.paginate(qb, page, limit);
  }
}
