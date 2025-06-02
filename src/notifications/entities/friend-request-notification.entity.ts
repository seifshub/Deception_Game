import { ObjectType } from '@nestjs/graphql';
import { Notification } from './notification.entity';
import { Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Friendship } from '../../users/entities/friendship.entity';

@Entity()
@ObjectType()
export class FriendRequestNotification extends Notification {
  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  sender: User;

  @ManyToOne(() => Friendship, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  friendship: Friendship;
}
