import { Column, Entity, OneToMany } from 'typeorm';
import { Field, ObjectType } from '@nestjs/graphql';
import { GenericEntity } from '../../common/entities/generic.entity';
import { Prompt } from '../../prompts/entities/prompt.entity';

@Entity()
@ObjectType()
export class Topic extends GenericEntity {
    @Column({ unique: true })
    name: string;

    @Column({ nullable: true })
    description?: string;

    @OneToMany(() => Prompt, prompt => prompt.topic)
    prompts?: Prompt[];
}