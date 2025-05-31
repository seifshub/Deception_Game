import { GenericEntity } from '../../common/entities/generic.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { FriendshipStatus } from '../enums/friendship-status.enum';
import { ObjectType } from '@nestjs/graphql';

@Entity()
@ObjectType()
export class Friendship extends GenericEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  requester: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  addressee: User;

  @Column({ enum: FriendshipStatus, default: FriendshipStatus.PENDING })
  status: FriendshipStatus;
}
