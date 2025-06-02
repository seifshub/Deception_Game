import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { GenericEntity } from '../../common/entities/generic.entity';
import { Player } from '../../players/entities/player.entity';
import { Answer } from '../../answers/answers.entity';

@ObjectType()
@Entity()
export class Vote extends GenericEntity {
  @Field(() => Player)
  @ManyToOne(() => Player, player => player.votes)
  @JoinColumn({ name: 'player_id' })
  player: Player;

  @Field(() => Answer, { nullable: true })
  @ManyToOne(() => Answer, answer => answer.votes, { nullable: true, eager: true })
  @JoinColumn({ name: 'answer_id' })
  answer: Answer;

  @Field(() => Boolean)
  @Column({ default: false })
  isRight: boolean;

  @Field(() => Int)
  @Column()
  roundNumber: number;
}
