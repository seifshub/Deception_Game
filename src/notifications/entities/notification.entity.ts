import { User } from '../../users/entities/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { GenericEntity } from '../../common/entities/generic.entity';
import { NotificationType } from '../enums/notification-type.enum';
import { Field, ObjectType } from '@nestjs/graphql';

@Entity()
@ObjectType({ isAbstract: true })
export abstract class Notification extends GenericEntity {
  @Column()
  title: string;

  @Column()
  content: string;

  @Field(() => User, { nullable: false })
  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ default: false })
  isRead: boolean;
}
