import { ObjectType, Field } from '@nestjs/graphql';
import { GenericEntity } from '../../common/entities/generic.entity';
import { Column, Entity } from 'typeorm';

@ObjectType()
@Entity()
export class Item extends GenericEntity {
  @Field(() => String, { description: 'Example field (placeholder)' })
  @Column()
  description: string;
}
