import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Friendship } from './entities/friendship.entity';
import { Repository } from 'typeorm';
import { FriendshipStatus } from './enums/friendship-status.enum';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GenericCrudService } from '../common/services/generic.crud.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FriendRequestReceivedEvent } from '../notifications/events/friend-request-notification.event';
import {
  FRIEND_REQUEST_ACCEPTED_EVENT,
  FRIEND_REQUEST_RECEIVED_EVENT,
} from '../notifications/constants/notifications.constants';
import { FriendRequestAcceptedEvent } from '../notifications/events/friend-request-accepted-notification.event';

@Injectable()
export class FriendshipService extends GenericCrudService<Friendship> {
  constructor(
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private eventEmitter: EventEmitter2,
  ) {
    super(friendshipRepository);
  }

  async sendRequest(
    requesterId: number,
    addresseeId: number,
  ): Promise<Friendship> {
    if (requesterId === addresseeId) {
      throw new BadRequestException('You cannot send a request to yourself.');
    }

    const addresseeUser = await this.userRepository.findOne({
      where: { id: addresseeId },
    });
    if (!addresseeUser) {
      throw new NotFoundException(`User with id ${addresseeId} not found.`);
    }

    const existing = await this.findFriendship(requesterId, addresseeId);
    if (existing) {
      if (existing.status === FriendshipStatus.PENDING) {
        throw new ConflictException(
          'A friend request has already been sent and is still pending.',
        );
      }
      if (existing.status === FriendshipStatus.ACCEPTED) {
        throw new ConflictException('You are already friends with this user.');
      }
      if (existing.status === FriendshipStatus.REJECTED) {
        throw new ConflictException('Cannot send a friend request.');
      }
    }

    const reverse = await this.findFriendship(addresseeId, requesterId);
    if (reverse) {
      if (reverse.status === FriendshipStatus.ACCEPTED) {
        throw new ConflictException('You are already friends with this user.');
      }
      if (reverse.status === FriendshipStatus.PENDING) {
        reverse.status = FriendshipStatus.ACCEPTED;
        return this.friendshipRepository.save(reverse);
      }
    }

    const friendship = await this.friendshipRepository.save({
      requester: { id: requesterId },
      addressee: { id: addresseeId },
      status: FriendshipStatus.PENDING,
    });
    this.eventEmitter.emit(
      FRIEND_REQUEST_RECEIVED_EVENT,
      new FriendRequestReceivedEvent(addresseeId, requesterId, friendship.id),
    );
    return friendship;
  }

  async getPendingRequests(userId: number): Promise<Friendship[]> {
    return this.friendshipRepository.find({
      where: { addressee: { id: userId }, status: FriendshipStatus.PENDING },
      relations: ['requester'],
    });
  }

  async acceptRequest(userId: number, requestId: number): Promise<Friendship> {
    const req = await this.friendshipRepository.findOne({
      where: { id: requestId },
      relations: ['addressee', 'requester'],
    });
    if (!req || req.addressee.id !== userId)
      throw new NotFoundException('Friend request not found');
    if (req.status === FriendshipStatus.ACCEPTED) {
      throw new ConflictException(
        'This friend request has already been accepted.',
      );
    }
    if (req.status === FriendshipStatus.REJECTED) {
      throw new ConflictException(
        'This friend request has already been rejected.',
      );
    }
    req.status = FriendshipStatus.ACCEPTED;
    const updatedFriendship = await this.friendshipRepository.save(req);
    this.eventEmitter.emit(
      FRIEND_REQUEST_ACCEPTED_EVENT,
      new FriendRequestAcceptedEvent(
        updatedFriendship.requester.id,
        updatedFriendship.addressee.id,
        updatedFriendship.id,
      ),
    );
    return updatedFriendship;
  }

  async refuseRequest(userId: number, requestId: number): Promise<void> {
    const req = await this.friendshipRepository.findOne({
      where: { id: requestId },
      relations: ['addressee'],
    });
    if (!req || req.addressee.id !== userId)
      throw new NotFoundException('Friend request not found');

    req.status = FriendshipStatus.REJECTED;
    await this.friendshipRepository.save(req);
  }

  async getFriends(userId: number): Promise<User[]> {
    const friendships = await this.friendshipRepository.find({
      where: [
        { requester: { id: userId }, status: FriendshipStatus.ACCEPTED },
        { addressee: { id: userId }, status: FriendshipStatus.ACCEPTED },
      ],
      relations: ['requester', 'addressee'],
    });
    const friends = friendships.map((friendship) =>
      friendship.requester.id === userId
        ? friendship.addressee
        : friendship.requester,
    );
    return friends;
  }

  private async findFriendship(
    requesterId: number,
    addresseeId: number,
  ): Promise<Friendship | null> {
    return this.friendshipRepository.findOne({
      where: {
        requester: { id: requesterId },
        addressee: { id: addresseeId },
      },
    });
  }
}
