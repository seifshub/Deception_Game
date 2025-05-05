import { Resolver } from '@nestjs/graphql';
import { ItemsService } from './items.service';
import { Item } from './entities/item.entity';
import { CreateItemInput } from './dto/create-item.input';
import { UpdateItemInput } from './dto/update-item.input';
import { GenericResolver } from '../common/resolvers/generic.resolver';
import { Type } from '@nestjs/common';

@Resolver(() => Item)
export class ItemsResolver extends GenericResolver(
  Item as Type<Item> & Item,
  CreateItemInput,
  UpdateItemInput,
) {
  constructor(private itemService: ItemsService) {
    super(itemService);
  }
}
