import { Module } from '@nestjs/common';
import { GenericCrudService } from './services/generic.crud.service';

@Module({
  providers: [GenericCrudService]
})
export class CommonModule {}
