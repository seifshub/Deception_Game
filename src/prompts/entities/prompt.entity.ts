import { ObjectType, Field } from '@nestjs/graphql';
import { Column, Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn, JoinTable } from 'typeorm';
import { GenericEntity } from '../../common/entities/generic.entity';
import { Topic } from '../../topics/entities/topic.entity';


@Entity()
@ObjectType()
export class Prompt extends GenericEntity {
    
    @Column()
    prompt_content: string;

    @Column()
    correct_answer: string;

    @Column()
    source: string;

    @ManyToOne(() => Topic, topic => topic.prompts, { eager: true})
    topic: Topic;
}