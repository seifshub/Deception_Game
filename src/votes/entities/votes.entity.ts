import { ObjectType, Field } from '@nestjs/graphql';
import { Entity, Column, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { GenericEntity } from '../../common/entities/generic.entity';
import { User } from '../../users/entities/user.entity';
import { Game } from '../../games/entities/game.entity';
import { Prompt } from '../../prompts/entities/prompt.entity';
import { PlayerResponse } from '../../responses/entities/response.entity';
import { VoteStatus, VoteType } from '../enums';





@ObjectType()
@Entity()
@Index(['game', 'round']) 
export class PlayerVote extends GenericEntity {
    @Field(() => Number, { description: 'Current round number' })
    @Column({
        type: 'int',
        comment: 'The round number this vote belongs to'
    })
    round: number;

    @Field(() => VoteStatus, { description: 'Status of the vote' })
    @Column({
        type: 'enum',
        enum: VoteStatus,
        default: VoteStatus.NOT_VOTED,
        comment: 'Whether player voted, timed out, or is ineligible'
    })
    status: VoteStatus;

    @Field(() => VoteType, { nullable: true, description: 'Type of answer voted for' })
    @Column({
        type: 'enum',
        enum: VoteType,
        nullable: true,
        comment: 'Whether they voted for correct answer or fake answer'
    })
    vote_type: VoteType;

    @Field(() => String, { nullable: true, description: 'The answer text they voted for' })
    @Column({
        type: 'text',
        nullable: true,
        comment: 'The actual answer text they selected - null if no vote'
    })
    selected_answer: string;

    @Field(() => Date, { nullable: true, description: 'When the vote was cast' })
    @Column({
        type: 'timestamp',
        nullable: true,
        comment: 'Timestamp when player cast their vote'
    })
    voted_at: Date;

    @Field(() => Number, { description: 'Points earned from this vote' })
    @Column({
        type: 'int',
        default: 0,
        comment: 'Points earned for voting correctly (usually for correct answer)'
    })
    points: number;

    @Field(() => User, { description: 'Player who cast this vote' })
    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'player_id' })
    player: User;

    @Field(() => Game, { description: 'Game this vote belongs to' })
    @ManyToOne(() => Game, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'game_id' })
    game: Game;

    @Field(() => Prompt, { description: 'Prompt this vote is for' })
    @ManyToOne(() => Prompt, { eager: true })
    @JoinColumn({ name: 'prompt_id' })
    prompt: Prompt;

    @Field(() => PlayerResponse, { nullable: true, description: 'The fake response voted for (if applicable)' })
    @ManyToOne(() => PlayerResponse, { nullable: true })
    @JoinColumn({ name: 'voted_response_id' })
    voted_response: PlayerResponse;
}