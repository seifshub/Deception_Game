import { Test, TestingModule } from '@nestjs/testing';
import { PlayerVoteService } from './votes.service';

describe('PlayerVoteService', () => {
  let service: PlayerVoteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlayerVoteService],
    }).compile();

    service = module.get<PlayerVoteService>(PlayerVoteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
