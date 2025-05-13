import { GenericEntity } from '../../common/entities/generic.entity';
import { Column, Entity } from 'typeorm';
import { ObjectType } from '@nestjs/graphql';

@Entity()
@ObjectType()
export class User extends GenericEntity {
  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;
}
