import { Injectable } from '@nestjs/common';
import { GenericCrudService } from '../common/services/generic.crud.service';
import { Topic } from './entities/topic.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';


@Injectable()
export class TopicsService extends GenericCrudService<Topic>
{
    constructor(
        @InjectRepository(Topic)
        private readonly topicRepository: Repository<Topic>,
    ) 
    {
        super(topicRepository)
    }

}
