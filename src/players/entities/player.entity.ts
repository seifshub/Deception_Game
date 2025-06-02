import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Column, Entity, ManyToOne, JoinColumn, Unique, OneToMany } from 'typeorm';
import { GenericEntity } from '../../common/entities/generic.entity';
import { User } from '../../users/entities/user.entity';
import { Game } from '../../games/entities/game.entity';
import { Answer } from 'src/answers/answers.entity';
import { Vote } from 'src/votes/entities/vote.entity';

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

  @Field(() => Answer, { nullable: true })
  @OneToMany(() => Answer, answer => answer.player, { eager: true, cascade: true })
  @JoinColumn({ name: 'player_id' })
  answers: Answer[];
  
  @Field(() => Int)
  @Column({ default: 0 })
  score: number;

  @Field(() => [Vote], { nullable: true })
  @OneToMany(() => Vote, vote => vote.player, { eager: true, cascade: true })
  votes: Vote[];
}