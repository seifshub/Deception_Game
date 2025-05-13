import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DeepPartial } from 'typeorm';
import { GenericEntity } from '../entities/generic.entity';
import { GenericCrudService } from '../services/generic.crud.service';
import { Injectable, Type } from '@nestjs/common';
import { capitalize } from '../../helpers/capitalize';

export function GenericResolver<
  T extends Type<GenericEntity> & GenericEntity,
  C extends DeepPartial<T>,
  U extends DeepPartial<T>,
>(entity: T, createInputType: C, updateInputType: U): any {
  @Resolver({ isAbstract: true })
  @Injectable()
  abstract class GenericResolverHost {
    constructor(protected readonly service: GenericCrudService<T, C, U>) {}

    @Query(() => [entity], { name: `${entity.name}s` })
    async findAll(): Promise<T[]> {
      return this.service.findAll();
    }

    @Query(() => entity, { name: entity.name })
    async findOne(@Args('id', { type: () => ID }) id: number): Promise<T> {
      return this.service.findOne(id);
    }

    @Mutation(() => entity, { name: `create${capitalize(entity.name)}` })
    async create(
      @Args({
        type: () => createInputType,
        name: `create${capitalize(entity.name)}Input`,
      })
      data: C,
    ): Promise<T> {
      return this.service.create(data);
    }

    @Mutation(() => entity, { name: `update${capitalize(entity.name)}` })
    async update(
      @Args('id', { type: () => ID }) id: number,
      @Args({
        type: () => updateInputType,
        name: `update${capitalize(entity.name)}Input`,
      })
      data: U,
    ): Promise<T> {
      return this.service.update(id, data);
    }

    @Mutation(() => Boolean, { name: `remove${capitalize(entity.name)}` })
    async remove(@Args('id', { type: () => ID }) id: number): Promise<boolean> {
      return this.service.delete(id);
    }
  }

  return GenericResolverHost;
}
