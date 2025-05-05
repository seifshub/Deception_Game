import { Injectable, NotFoundException } from '@nestjs/common';
import {
  DeepPartial,
  FindOptionsWhere,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { GenericEntity } from '../entities/generic.entity';

@Injectable()
export class GenericCrudService<
  Entity extends GenericEntity,
  CreateDTO extends DeepPartial<Entity> = DeepPartial<Entity>,
  UpdateDTO extends DeepPartial<Entity> = DeepPartial<Entity>,
> {
  constructor(private readonly repository: Repository<Entity>) {}

  async findOne(id: number): Promise<Entity> {
    const result = await this.repository.findOne({
      where: { id } as FindOptionsWhere<Entity>,
    });

    if (!result) {
      throw new NotFoundException(`Entity with ID ${id} not found`);
    }
    return result;
  }

  async findAll(): Promise<Entity[]> {
    return this.repository.find();
  }

  async create(data: CreateDTO): Promise<Entity> {
    const item = this.repository.create(data);
    const result = await this.repository.save(item);
    return result;
  }

  async update(id: number, data: UpdateDTO): Promise<Entity> {
    console.log(typeof id);
    const entity = await this.repository.preload({
      id: id,
      ...data,
    });
    if (!entity) {
      throw new NotFoundException(`Entity with ID ${id} not found`);
    }
    return this.repository.save(entity);
  }

  async delete(id: number): Promise<boolean> {
    await this.repository.softDelete(id);
    return true;
  }

  async findAllPaginated(
    page: number = 1,
    limit: number = 10,
  ): Promise<Entity[]> {
    const queryBuilder = this.repository.createQueryBuilder();
    return this.paginate(queryBuilder.select(), page, limit);
  }

  async paginate(
    queryBuilder: SelectQueryBuilder<Entity>,
    page: number,
    limit: number,
  ): Promise<Entity[]> {
    const results = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
    return results;
  }
}
