import { Test, TestingModule } from '@nestjs/testing';
import { GenericCrudService } from './generic.crud.service';

describe('GenericCrudService', () => {
  let service: GenericCrudService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GenericCrudService],
    }).compile();

    service = module.get<GenericCrudService>(GenericCrudService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
