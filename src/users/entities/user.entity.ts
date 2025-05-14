import { GenericEntity } from '../../common/entities/generic.entity';
import { Column, Entity, Unique } from 'typeorm';
import { ObjectType } from '@nestjs/graphql';
import { UQ_USER_EMAIL, UQ_USER_USERNAME } from '../users.constants';

@Entity()
@ObjectType()
@Unique(UQ_USER_USERNAME, ['username'])
@Unique(UQ_USER_EMAIL, ['email'])
export class User extends GenericEntity {
  @Column()
  email: string;

  @Column()
  username: string;

  @Column()
  password: string;
}
