import { GenericEntity } from '../../common/entities/generic.entity';
import { Column, Entity, ManyToMany, OneToMany, Unique } from 'typeorm';
import { ObjectType, registerEnumType } from '@nestjs/graphql';
import { UQ_USER_EMAIL, UQ_USER_USERNAME } from '../users.constants';
import { Role } from '../enums/role.enum';
import { Game } from 'src/games/entities/game.entity';

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

  @Column({ enum: Role, default: Role.Regular })
  role: Role;

  @OneToMany(() => Game, game => game.host)
  hostedGames: Game[];

  @ManyToMany(() => Game, game => game.players)
  joinedGames: Game[];
}
