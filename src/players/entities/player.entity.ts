import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Column, Entity, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { GenericEntity } from '../../common/entities/generic.entity';
import { User } from '../../users/entities/user.entity';
import { Game } from '../../games/entities/game.entity';

@ObjectType()
@Entity()
@Unique(['user', 'game']) // Ensures a user can only be a player in a game once
export class Player extends GenericEntity {
  @Field(() => User)
  @ManyToOne(() => User, user => user.playerProfiles, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Field(() => Game)
  @ManyToOne(() => Game, game => game.playerProfiles)
  @JoinColumn({ name: 'game_id' })
  game: Game;

  @Field(() => Int)
  @Column({ default: 0 })
  score: number;

}
