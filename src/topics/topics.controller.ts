import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { TopicsService } from './topics.service';
import { CreateTopicInput } from './dtos/create-topic.input';
import { Topic } from './entities/topic.entity';

@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Post()
  async createTopic(@Body() createDto: CreateTopicInput): Promise<Topic> {
    return this.topicsService.createTopic(createDto);
  }

  @Get('random')
  async getRandomTopic(): Promise<Topic> {
    return this.topicsService.getRandomTopic();
  }

  @Get('random-multiple')
  async getRandomTopics(
    @Query('count') count = 3,
  ): Promise<Topic[]> {
    return this.topicsService.getRandomTopics(Number(count));
  }

  @Get('active')
  async findActiveTopics(): Promise<Topic[]> {
    return this.topicsService.findActiveTopics();
  }

  @Get('inactive')
  async findInactiveTopics(): Promise<Topic[]> {
    return this.topicsService.findInactiveTopics();
  }

  @Get('with-prompt-count')
  async getTopicsWithPromptCount(): Promise<any[]> {
    return this.topicsService.getTopicsWithPromptCount();
  }

  @Get('count')
  async countAllTopics(): Promise<{ count: number }> {
    const count = await this.topicsService.countAllTopics();
    return { count };
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number): Promise<Topic> {
    return this.topicsService.findById(id);
  }

  @Put('activate/:id')
  async activateTopic(@Param('id', ParseIntPipe) id: number): Promise<Topic> {
    return this.topicsService.activateTopic(id);
  }

  @Put('deactivate/:id')
  async deactivateTopic(@Param('id', ParseIntPipe) id: number): Promise<Topic> {
    return this.topicsService.deactivateTopic(id);
  }

  @Delete(':id')
  async deleteTopic(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    await this.topicsService.deleteWithValidation(id);
    return { message: `Topic with ID ${id} deleted.` };
  }
}
