import { ObjectType, Field } from '@nestjs/graphql';
import { Entity, Column, ManyToOne, JoinColumn, Unique, Index, OneToMany } from 'typeorm';
import { GenericEntity } from '../../common/entities/generic.entity';
import { User } from '../../users/entities/user.entity';
import { Prompt } from '../../prompts/entities/prompt.entity';
import { ResponseStatus } from '../enums';
import { Game } from '../../games/entities/game.entity';
import { PlayerVote } from '../../votes/entities/votes.entity';
import { UQ_PLAYER_RESPONSE_UNIQUE } from '../responses.constants';

@ObjectType()
@Entity()
@Unique(UQ_PLAYER_RESPONSE_UNIQUE, ['game', 'round', 'player'])
@Index(['game', 'round'])
export class PlayerResponse extends GenericEntity {
    @Field(() => String, { description: 'The fake answer submitted by the player' })
    @Column({
        type: 'text',
        nullable: true,
        comment: 'the fake answer. null if timed out'
    })
    response: string;

    @Column({
        type: 'int',
        comment: 'The round number this response belongs to'
    })
    round: number;

    @Field(() => ResponseStatus)
    @Column({
        type: 'enum',
        enum: ResponseStatus,
        default: ResponseStatus.DRAFT,
    })
    status: ResponseStatus;

    @Field(() => Date, { nullable: true })
    @Column({
        type: 'timestamp',
        nullable: true,
    })
    submittedAt: Date;

    @Field(() => Number, { description: 'Points earned from this response (players fooled)' })
    @Column({
        type: 'int',
        default: 0,
    })
    points: number;

    @Field(() => User, { description: 'Player who submitted this response' })
    @ManyToOne(() => User, user => user.playerResponses, { eager: true })
    @JoinColumn({ name: 'player_id' })
    player: User;

    @Field(() => Game, { description: 'Game this response belongs to' })
    @ManyToOne(() => Game, game => game.playerResponses, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'game_id' })
    game: Game;

    @Field(() => Prompt, { description: 'Prompt this response answers' })
    @ManyToOne(() => Prompt, prompt => prompt.playerResponses, { eager: true })
    @JoinColumn({ name: 'prompt_id' })
    prompt: Prompt;

    @OneToMany(() => PlayerVote, vote => vote.votedResponse)
    votes: PlayerVote[];
}