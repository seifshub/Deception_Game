import { Field, ObjectType } from '@nestjs/graphql';
import { GenericEntity } from '../../common/entities/generic.entity';
import { Column, Entity, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Game } from '../../games/entities/game.entity';
import { Prompt } from '../../prompts/entities/prompt.entity';
import { PlayerResponse } from '../../responses/entities/response.entity';
import { PlayerVote } from '../../votes/entities/votes.entity';

@ObjectType()
@Entity()
export class Round extends GenericEntity {
    @Column()
    roundNumber: number;

    @Field(() => Game)
    @ManyToOne(() => Game, game => game.gameRounds, { onDelete: 'CASCADE' })
    game: Game;

    @Field(() => Prompt, { nullable: true })
    @ManyToOne(() => Prompt, { eager: true, onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'prompt_id' })
    prompt: Prompt;

    @Column({ default: false })
    isCompleted: boolean;

    @OneToMany(() => PlayerResponse, response => response.round)
    playerResponses: PlayerResponse[];

    @OneToMany(() => PlayerVote, vote => vote.round)
    playerVotes: PlayerVote[];

}
