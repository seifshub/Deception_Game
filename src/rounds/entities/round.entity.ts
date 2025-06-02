import { Field, ObjectType } from '@nestjs/graphql';
import { GenericEntity } from '../../common/entities/generic.entity';
import { Column, Entity, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Game } from '../../games/entities/game.entity';
import { Prompt } from '../../prompts/entities/prompt.entity';
import { Answer } from 'src/answers/answers.entity';

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

    @Field(() => Answer, { nullable: true })
    @OneToMany(() => Answer, answer => answer.round, { eager: true, cascade: true })
    @JoinColumn({ name: 'round_id' })
    answers: Answer[];

    @Column({ default: false })
    isCompleted: boolean;
}
