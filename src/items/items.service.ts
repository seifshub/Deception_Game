import { Injectable } from '@nestjs/common';
import { CreateItemInput } from './dto/create-item.input';
import { UpdateItemInput } from './dto/update-item.input';
import { GenericCrudService } from '../common/services/generic.crud.service';
import { Item } from './entities/item.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ItemsService extends GenericCrudService<
  Item,
  CreateItemInput,
  UpdateItemInput
> {
  constructor(
    @InjectRepository(Item) private readonly itemRepository: Repository<Item>,
  ) {
    super(itemRepository);
  }
}
