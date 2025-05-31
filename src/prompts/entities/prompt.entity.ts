import { ObjectType, Field } from '@nestjs/graphql';
import { Column, Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn, JoinTable } from 'typeorm';
import { GenericEntity } from '../../common/entities/generic.entity';
import { Topic } from '../../topics/entities/topic.entity';


@Entity()
@ObjectType()
export class Prompt extends GenericEntity {
    
    @Column()
    promptContent: string;

    @Column()
    correctAnswer: string;

    @ManyToOne(() => Topic, topic => topic.prompts, { eager: false})
    topic: Topic;
}