import { ObjectType } from '@nestjs/graphql';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { GenericEntity } from '../../common/entities/generic.entity';
import { Topic } from '../../topics/entities/topic.entity';
import { PlayerResponse } from '../../responses/entities/response.entity';
import { PlayerVote } from '../../votes/entities/votes.entity';


@Entity()
@ObjectType()
export class Prompt extends GenericEntity {

    @Column()
    promptContent: string;

    @Column()
    correctAnswer: string;

    @Column({ default: true })
    isActive: boolean;

    @ManyToOne(() => Topic, topic => topic.prompts, { eager: false })
    topic: Topic;

    @OneToMany(() => PlayerResponse, response => response.prompt)
    playerResponses: PlayerResponse[];

    @OneToMany(() => PlayerVote, vote => vote.prompt)
    playerVotes: PlayerVote[];
}