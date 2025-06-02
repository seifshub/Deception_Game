import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, UpdateResult, In } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { FriendRequestNotification } from './entities/friend-request-notification.entity';
import { UsersService } from '../users/users.service';
import { FriendshipService } from '../users/friendship.service';
import { FriendRequestReceivedEvent } from './events/friend-request-notification.event';
import { NotificationType } from './enums/notification-type.enum';
import { User } from '../users/entities/user.entity';
import { Friendship } from '../users/entities/friendship.entity';
import { Observable, Subject } from 'rxjs';
import { FriendRequestAcceptedNotification } from './entities/friend-request-accepted-notification.entity';
import { FriendRequestAcceptedEvent } from './events/friend-request-accepted-notification.event';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationRepository: Repository<Notification>;
  let frNotificationRepo: Repository<FriendRequestNotification>;
  let fraNotificationRepo: Repository<FriendRequestAcceptedNotification>;
  let usersService: UsersService;
  let friendshipService: FriendshipService;
  let notificationSubject: Subject<Notification>;

  const mockNotificationRepository = {
    findOneBy: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      innerJoin: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
    })),
  };

  const mockFrNotificationRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockFraNotificationRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockUsersService = {
    findOne: jest.fn(),
  };

  const mockFriendshipService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationRepository,
        },
        {
          provide: getRepositoryToken(FriendRequestNotification),
          useValue: mockFrNotificationRepo,
        },
        {
          provide: getRepositoryToken(FriendRequestAcceptedNotification),
          useValue: mockFraNotificationRepo,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: FriendshipService,
          useValue: mockFriendshipService,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    notificationRepository = module.get<Repository<Notification>>(
      getRepositoryToken(Notification),
    );
    frNotificationRepo = module.get<Repository<FriendRequestNotification>>(
      getRepositoryToken(FriendRequestNotification),
    );
    fraNotificationRepo = module.get<
      Repository<FriendRequestAcceptedNotification>
    >(getRepositoryToken(FriendRequestAcceptedNotification));
    usersService = module.get<UsersService>(UsersService);
    friendshipService = module.get<FriendshipService>(FriendshipService);
    notificationSubject = (service as any).notificationSubject;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleFriendRequest', () => {
    it('should create and save a friend request notification and emit it', async () => {
      const recipient: User = { id: 1, username: 'recipientUser' } as User;
      const sender: User = { id: 2, username: 'senderUser' } as User;
      const friendship: Friendship = { id: 100 } as Friendship;

      const payload: FriendRequestReceivedEvent =
        new FriendRequestReceivedEvent(recipient.id, sender.id, friendship.id);

      const createdNotification: FriendRequestNotification = {
        id: 1,
        title: 'New Friend Request',
        content: `User ${sender.username} sent you a friend request.`,
        type: NotificationType.FRIEND_REQUEST,
        user: recipient,
        sender: sender,
        friendship: friendship,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.findOne.mockResolvedValueOnce(recipient);
      mockUsersService.findOne.mockResolvedValueOnce(sender);
      mockFriendshipService.findOne.mockResolvedValueOnce(friendship);
      mockFrNotificationRepo.create.mockReturnValue(createdNotification);
      mockFrNotificationRepo.save.mockResolvedValue(createdNotification);

      const notificationSubjectSpy = jest.spyOn(
        service['notificationSubject'],
        'next',
      );

      const result = await service.handleFriendRequest(payload);

      expect(mockUsersService.findOne).toHaveBeenCalledWith(
        payload.recipientId,
      );
      expect(mockUsersService.findOne).toHaveBeenCalledWith(payload.senderId);
      expect(mockFriendshipService.findOne).toHaveBeenCalledWith(
        payload.friendshipId,
      );
      expect(mockFrNotificationRepo.create).toHaveBeenCalledWith({
        title: 'New Friend Request',
        content: `User ${sender.username} sent you a friend request.`,
        type: payload.type,
        user: recipient,
        sender: sender,
        friendship: friendship,
        isRead: false,
      });
      expect(mockFrNotificationRepo.save).toHaveBeenCalledWith(
        createdNotification,
      );
      expect(notificationSubjectSpy).toHaveBeenCalledWith(createdNotification);
      expect(result).toEqual(createdNotification);
    });
  });

  describe('handleFriendRequestAccepted', () => {
    it('should create and save a friend request accepted notification and emit it', async () => {
      const recipient: User = { id: 2, username: 'recipientUser' } as User;
      const sender: User = { id: 1, username: 'senderUser' } as User;
      const friendship: Friendship = { id: 100 } as Friendship;

      const payload: FriendRequestAcceptedEvent =
        new FriendRequestAcceptedEvent(recipient.id, sender.id, friendship.id);

      const createdNotification: FriendRequestAcceptedNotification = {
        id: 2,
        title: 'Friend Request Accepted',
        content: `User ${sender.username} accepted your friend request.`,
        type: NotificationType.FRIEND_REQUEST_ACCEPTED,
        user: recipient,
        sender: sender,
        friendship: friendship,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.findOne.mockResolvedValueOnce(recipient);
      mockUsersService.findOne.mockResolvedValueOnce(sender);
      mockFriendshipService.findOne.mockResolvedValueOnce(friendship);
      mockFraNotificationRepo.create.mockReturnValue(createdNotification);
      mockFraNotificationRepo.save.mockResolvedValue(createdNotification);

      const notificationSubjectSpy = jest.spyOn(
        service['notificationSubject'],
        'next',
      );

      const result = await service.handleFriendRequestAccepted(payload);

      expect(mockUsersService.findOne).toHaveBeenCalledWith(
        payload.recipientId,
      );
      expect(mockUsersService.findOne).toHaveBeenCalledWith(payload.senderId);
      expect(mockFriendshipService.findOne).toHaveBeenCalledWith(
        payload.friendshipId,
      );
      expect(mockFraNotificationRepo.create).toHaveBeenCalledWith({
        title: 'Friend Request Accepted',
        content: `User ${sender.username} accepted your friend request.`,
        type: payload.type,
        user: recipient,
        sender: sender,
        friendship: friendship,
        isRead: false,
      });
      expect(mockFraNotificationRepo.save).toHaveBeenCalledWith(
        createdNotification,
      );
      expect(notificationSubjectSpy).toHaveBeenCalledWith(createdNotification);
      expect(result).toEqual(createdNotification);
    });
  });

  describe('getNotificationStream', () => {
    it('should return an observable', () => {
      const stream = service.getNotificationStream();
      expect(stream).toBeInstanceOf(Observable);
    });

    it('should return the notification subject as an observable', () => {
      expect(service.getNotificationStream()).toBeInstanceOf(Observable);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read and save it', async () => {
      const notificationId = 1;
      const mockNotification: Notification = {
        id: notificationId,
        title: 'Test',
        content: 'Content',
        isRead: false,
      } as Notification;
      const updatedNotification: Notification = {
        ...mockNotification,
        isRead: true,
      };

      mockNotificationRepository.findOneBy.mockResolvedValue(mockNotification);
      mockNotificationRepository.save.mockResolvedValue(updatedNotification);

      const result = await service.markAsRead(notificationId);

      expect(mockNotificationRepository.findOneBy).toHaveBeenCalledWith({
        id: notificationId,
      });
      expect(mockNotification.isRead).toBe(true);
      expect(mockNotificationRepository.save).toHaveBeenCalledWith(
        mockNotification,
      );
      expect(result).toEqual(updatedNotification);
    });

    it('should throw an error if notification is not found', async () => {
      const notificationId = 999;
      mockNotificationRepository.findOneBy.mockResolvedValue(null);

      await expect(service.markAsRead(notificationId)).rejects.toThrow(
        'Notification not found',
      );
      expect(mockNotificationRepository.findOneBy).toHaveBeenCalledWith({
        id: notificationId,
      });
      expect(mockNotificationRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('markManyAsRead', () => {
    it('should mark multiple notifications as read', async () => {
      const ids = [1, 2, 3];
      const updateResult: UpdateResult = { affected: 3 } as UpdateResult;

      mockNotificationRepository.update.mockResolvedValue(updateResult);

      const result = await service.markManyAsRead(ids);

      expect(mockNotificationRepository.update).toHaveBeenCalledWith(
        { id: In(ids) },
        { isRead: true },
      );
      expect(result).toEqual(updateResult);
    });

    it('should return affected: 0 if no ids are provided', async () => {
      const ids: number[] = [];

      const result = await service.markManyAsRead(ids);

      expect(mockNotificationRepository.update).not.toHaveBeenCalled();
      expect(result).toEqual({ affected: 0 });
    });
  });

  describe('findNotificationsByUser', () => {
    it('should find and paginate notifications for a user', async () => {
      const userId = 1;
      const page = 1;
      const limit = 10;
      const mockNotifications: Notification[] = [
        {
          id: 1,
          title: 'Notif 1',
          user: { id: userId } as User,
        } as Notification,
        {
          id: 2,
          title: 'Notif 2',
          user: { id: userId } as User,
        } as Notification,
      ];

      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockNotifications),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
      };
      mockNotificationRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const paginateSpy = jest.spyOn(service, 'paginate' as any);

      const result = await service.findNotificationsByUser(userId, page, limit);

      expect(
        mockNotificationRepository.createQueryBuilder,
      ).toHaveBeenCalledWith('notification');
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'notification.users',
        'user',
        'user.id = :userId',
        { userId },
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'notification.createdAt',
        'DESC',
      );
      expect(paginateSpy).toHaveBeenCalledWith(mockQueryBuilder, page, limit);
      expect(result).toEqual(mockNotifications);
    });
  });
});
