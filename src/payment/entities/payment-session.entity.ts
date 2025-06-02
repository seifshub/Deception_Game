import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { GenericEntity } from '../../common/entities/generic.entity';
import { User } from '../../users/entities/user.entity';
import { ObjectType } from '@nestjs/graphql';

@Entity()
@ObjectType()
export class PaymentSession extends GenericEntity {
  @Column({ type: 'varchar', unique: true })
  @Index()
  stripeSessionId: string;

  @Column({ type: 'int' })
  stripeExpiresAt: number;

  @Column({ type: 'boolean', default: false })
  completed: boolean;

  @ManyToOne(() => User, (user) => user.paymentSessions, {
    onDelete: 'CASCADE',
  })
  user: User;
}
