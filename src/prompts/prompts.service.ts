import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Prompt } from './entities/prompt.entity';
import { Repository } from 'typeorm';
import { GenericCrudService } from '../common/services/generic.crud.service';

@Injectable()
export class PromptsService extends GenericCrudService<Prompt> {
    constructor(
        @InjectRepository(Prompt)
        private readonly promptRepository: Repository<Prompt>,
    ) {
        super(promptRepository);
    }
    

}
