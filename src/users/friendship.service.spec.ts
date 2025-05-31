import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FriendshipService } from './friendship.service';
import { Friendship } from './entities/friendship.entity';
import { User } from './entities/user.entity';
import { FriendshipStatus } from './enums/friendship-status.enum';
import { Role } from './enums/role.enum';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

describe('FriendshipService', () => {
  let service: FriendshipService;
  let friendshipRepository: Repository<Friendship>;
  let userRepository: Repository<User>;

  const mockUser1: User = {
    id: 1,
    email: 'user1@example.com',
    username: 'user1',
    password: 'hashedpassword',
    role: Role.Regular,
    sentFriendRequests: [],
    receivedFriendRequests: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser2: User = {
    id: 2,
    email: 'user2@example.com',
    username: 'user2',
    password: 'hashedpassword',
    role: Role.Regular,
    sentFriendRequests: [],
    receivedFriendRequests: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFriendship: Friendship = {
    id: 1,
    requester: mockUser1,
    addressee: mockUser2,
    status: FriendshipStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFriendshipRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FriendshipService,
        {
          provide: getRepositoryToken(Friendship),
          useValue: mockFriendshipRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<FriendshipService>(FriendshipService);
    friendshipRepository = module.get<Repository<Friendship>>(
      getRepositoryToken(Friendship),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendRequest', () => {
    beforeEach(() => {
      mockUserRepository.findOne.mockResolvedValue(mockUser2);
      mockFriendshipRepository.findOne.mockResolvedValue(null);
    });

    it('should send a friend request successfully', async () => {
      const savedFriendship = { ...mockFriendship };
      mockFriendshipRepository.save.mockResolvedValue(savedFriendship);

      const result = await service.sendRequest(1, 2);

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 2 } });
      expect(friendshipRepository.save).toHaveBeenCalledWith({
        requester: { id: 1 },
        addressee: { id: 2 },
        status: FriendshipStatus.PENDING,
      });
      expect(result).toEqual(savedFriendship);
    });

    it('should throw BadRequestException when trying to send request to self', async () => {
      await expect(service.sendRequest(1, 1)).rejects.toThrow(
        new BadRequestException('You cannot send a request to yourself.'),
      );

      expect(userRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when addressee does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.sendRequest(1, 999)).rejects.toThrow(
        new NotFoundException('User with id 999 not found.'),
      );
    });

    it('should throw ConflictException when pending request already exists', async () => {
      mockFriendshipRepository.findOne.mockResolvedValue({
        ...mockFriendship,
        status: FriendshipStatus.PENDING,
      });

      await expect(service.sendRequest(1, 2)).rejects.toThrow(
        new ConflictException(
          'A friend request has already been sent and is still pending.',
        ),
      );
    });

    it('should throw ConflictException when users are already friends', async () => {
      mockFriendshipRepository.findOne.mockResolvedValue({
        ...mockFriendship,
        status: FriendshipStatus.ACCEPTED,
      });

      await expect(service.sendRequest(1, 2)).rejects.toThrow(
        new ConflictException('You are already friends with this user.'),
      );
    });

    it('should throw ConflictException when previous request was rejected', async () => {
      mockFriendshipRepository.findOne.mockResolvedValue({
        ...mockFriendship,
        status: FriendshipStatus.REJECTED,
      });

      await expect(service.sendRequest(1, 2)).rejects.toThrow(
        new ConflictException('Cannot send a friend request.'),
      );
    });

    it('should accept reverse pending request automatically', async () => {
      mockFriendshipRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          ...mockFriendship,
          requester: mockUser2,
          addressee: mockUser1,
          status: FriendshipStatus.PENDING,
        });

      const acceptedFriendship = {
        ...mockFriendship,
        requester: mockUser2,
        addressee: mockUser1,
        status: FriendshipStatus.ACCEPTED,
      };
      mockFriendshipRepository.save.mockResolvedValue(acceptedFriendship);

      const result = await service.sendRequest(1, 2);

      expect(result.status).toBe(FriendshipStatus.ACCEPTED);
      expect(friendshipRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: FriendshipStatus.ACCEPTED }),
      );
    });

    it('should throw ConflictException when reverse friendship is already accepted', async () => {
      mockFriendshipRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          ...mockFriendship,
          requester: mockUser2,
          addressee: mockUser1,
          status: FriendshipStatus.ACCEPTED,
        });

      await expect(service.sendRequest(1, 2)).rejects.toThrow(
        new ConflictException('You are already friends with this user.'),
      );
    });
  });

  describe('getPendingRequests', () => {
    it('should return pending friend requests', async () => {
      const pendingRequests = [mockFriendship];
      mockFriendshipRepository.find.mockResolvedValue(pendingRequests);

      const result = await service.getPendingRequests(2);

      expect(friendshipRepository.find).toHaveBeenCalledWith({
        where: { addressee: { id: 2 }, status: FriendshipStatus.PENDING },
        relations: ['requester'],
      });
      expect(result).toEqual(pendingRequests);
    });

    it('should return empty array when no pending requests', async () => {
      mockFriendshipRepository.find.mockResolvedValue([]);

      const result = await service.getPendingRequests(2);

      expect(result).toEqual([]);
    });
  });

  describe('acceptRequest', () => {
    const mockRequest = {
      id: 1,
      requester: mockUser1,
      addressee: mockUser2,
      status: FriendshipStatus.PENDING,
    };

    it('should accept a friend request successfully', async () => {
      mockFriendshipRepository.findOne.mockResolvedValue(mockRequest);
      const acceptedRequest = {
        ...mockRequest,
        status: FriendshipStatus.ACCEPTED,
      };
      mockFriendshipRepository.save.mockResolvedValue(acceptedRequest);

      const result = await service.acceptRequest(2, 1);

      expect(friendshipRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['addressee', 'requester'],
      });
      expect(friendshipRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: FriendshipStatus.ACCEPTED }),
      );
      expect(result.status).toBe(FriendshipStatus.ACCEPTED);
    });

    it('should throw NotFoundException when request does not exist', async () => {
      mockFriendshipRepository.findOne.mockResolvedValue(null);

      await expect(service.acceptRequest(2, 999)).rejects.toThrow(
        new NotFoundException('Friend request not found'),
      );
    });

    it('should throw NotFoundException when user is not the addressee', async () => {
      mockFriendshipRepository.findOne.mockResolvedValue({
        ...mockRequest,
        addressee: { ...mockUser1, id: 3 },
      });

      await expect(service.acceptRequest(2, 1)).rejects.toThrow(
        new NotFoundException('Friend request not found'),
      );
    });

    it('should throw ConflictException when request is already accepted', async () => {
      mockFriendshipRepository.findOne.mockResolvedValue({
        ...mockRequest,
        status: FriendshipStatus.ACCEPTED,
      });

      await expect(service.acceptRequest(2, 1)).rejects.toThrow(
        new ConflictException('This friend request has already been accepted.'),
      );
    });

    it('should throw ConflictException when request is already rejected', async () => {
      mockFriendshipRepository.findOne.mockResolvedValue({
        ...mockRequest,
        status: FriendshipStatus.REJECTED,
      });

      await expect(service.acceptRequest(2, 1)).rejects.toThrow(
        new ConflictException('This friend request has already been rejected.'),
      );
    });
  });

  describe('refuseRequest', () => {
    const mockRequest = {
      id: 1,
      requester: mockUser1,
      addressee: mockUser2,
      status: FriendshipStatus.PENDING,
    };

    it('should refuse a friend request successfully', async () => {
      mockFriendshipRepository.findOne.mockResolvedValue(mockRequest);
      mockFriendshipRepository.save.mockResolvedValue({
        ...mockRequest,
        status: FriendshipStatus.REJECTED,
      });

      await service.refuseRequest(2, 1);

      expect(friendshipRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['addressee'],
      });
      expect(friendshipRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: FriendshipStatus.REJECTED }),
      );
    });

    it('should throw NotFoundException when request does not exist', async () => {
      mockFriendshipRepository.findOne.mockResolvedValue(null);

      await expect(service.refuseRequest(2, 999)).rejects.toThrow(
        new NotFoundException('Friend request not found'),
      );
    });

    it('should throw NotFoundException when user is not the addressee', async () => {
      mockFriendshipRepository.findOne.mockResolvedValue({
        ...mockRequest,
        addressee: { ...mockUser1, id: 3 },
      });

      await expect(service.refuseRequest(2, 1)).rejects.toThrow(
        new NotFoundException('Friend request not found'),
      );
    });
  });

  describe('getFriends', () => {
    it('should return friends where user is requester', async () => {
      const friendships = [
        {
          requester: mockUser1,
          addressee: mockUser2,
          status: FriendshipStatus.ACCEPTED,
        },
      ];
      mockFriendshipRepository.find.mockResolvedValue(friendships);

      const result = await service.getFriends(1);

      expect(friendshipRepository.find).toHaveBeenCalledWith({
        where: [
          { requester: { id: 1 }, status: FriendshipStatus.ACCEPTED },
          { addressee: { id: 1 }, status: FriendshipStatus.ACCEPTED },
        ],
        relations: ['requester', 'addressee'],
      });
      expect(result).toEqual([mockUser2]);
    });

    it('should return friends where user is addressee', async () => {
      const friendships = [
        {
          requester: mockUser2,
          addressee: mockUser1,
          status: FriendshipStatus.ACCEPTED,
        },
      ];
      mockFriendshipRepository.find.mockResolvedValue(friendships);

      const result = await service.getFriends(1);

      expect(result).toEqual([mockUser2]);
    });

    it('should return friends from both requester and addressee relationships', async () => {
      const mockUser3 = { ...mockUser1, id: 3, username: 'user3' };
      const friendships = [
        {
          requester: mockUser1,
          addressee: mockUser2,
          status: FriendshipStatus.ACCEPTED,
        },
        {
          requester: mockUser3,
          addressee: mockUser1,
          status: FriendshipStatus.ACCEPTED,
        },
      ];
      mockFriendshipRepository.find.mockResolvedValue(friendships);

      const result = await service.getFriends(1);

      expect(result).toEqual([mockUser2, mockUser3]);
    });

    it('should return empty array when no friends', async () => {
      mockFriendshipRepository.find.mockResolvedValue([]);

      const result = await service.getFriends(1);

      expect(result).toEqual([]);
    });

    it('should only return accepted friendships', async () => {
      const friendships = [
        {
          requester: mockUser1,
          addressee: mockUser2,
          status: FriendshipStatus.PENDING,
        },
        {
          requester: mockUser1,
          addressee: { ...mockUser2, id: 3 },
          status: FriendshipStatus.REJECTED,
        },
      ];
      mockFriendshipRepository.find.mockResolvedValue([]);

      const result = await service.getFriends(1);

      expect(result).toEqual([]);
    });
  });

  describe('findFriendship (private method)', () => {
    it('should find existing friendship', async () => {
      mockFriendshipRepository.findOne.mockResolvedValue(mockFriendship);

      mockUserRepository.findOne.mockResolvedValue(mockUser2);

      await expect(service.sendRequest(1, 2)).rejects.toThrow(
        new ConflictException(
          'A friend request has already been sent and is still pending.',
        ),
      );

      expect(friendshipRepository.findOne).toHaveBeenCalledWith({
        where: {
          requester: { id: 1 },
          addressee: { id: 2 },
        },
      });
    });
  });
});
