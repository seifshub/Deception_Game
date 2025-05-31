import { registerEnumType } from '@nestjs/graphql';

export enum FriendshipStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

registerEnumType(FriendshipStatus, {
  name: 'FriendshipStatus',
  description: 'The current status of a friendship request',
});
