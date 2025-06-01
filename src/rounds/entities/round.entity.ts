import { Field, ObjectType } from '@nestjs/graphql';
import { GenericEntity } from '../../common/entities/generic.entity';
import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { Game } from '../../games/entities/game.entity';
import { Prompt } from '../../prompts/entities/prompt.entity';

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
}
