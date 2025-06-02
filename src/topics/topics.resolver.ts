import { Resolver, Mutation, Args, Query, ID, Int } from '@nestjs/graphql';
import { GenericResolver } from '../common/resolvers/generic.resolver';
import { Type } from '@nestjs/common';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import { ActiveUserData } from '../auth/interfaces/active-user-data.interface';
import { Topic } from './entities/topic.entity';
import { CreateTopicInput } from './dtos/create-topic.input';
import { TopicsService } from './topics.service';
import { UpdateTopicInput } from './dtos/update-topic.input';
import { Roles } from 'src/auth/access-control/decorators/roles.decorator';
import { Role } from 'src/users/enums/role.enum';

@Roles(Role.Admin)
@Resolver(() => Topic)
export class TopicsResolver extends GenericResolver(
  Topic as Type<Topic> & Topic,
  CreateTopicInput,
  UpdateTopicInput
) {
  constructor(private readonly topicService: TopicsService) {
    super(topicService);
  }

  @Mutation(() => Topic)
  async create(
    @Args('createInput') createInput: CreateTopicInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Topic> {
    return this.topicService.createTopic(createInput);
  }
  @Query(() => [Topic])
  async activeTopics(): Promise<Topic[]> {
    return this.topicService.findActiveTopics();
  }

  @Query(() => [Topic])
  async inactiveTopics(): Promise<Topic[]> {
    return this.topicService.findInactiveTopics();
  }

  @Query(() => Topic)
  async topic(@Args('id', { type: () => Int }) id: number): Promise<Topic> {
    return this.topicService.findById(id);
  }

  @Mutation(() => Topic)
  async activateTopic(@Args('id', { type: () => Int }) id: number): Promise<Topic> {
    return this.topicService.activateTopic(id);
  }

  @Mutation(() => Topic)
  async deactivateTopic(@Args('id', { type: () => Int }) id: number): Promise<Topic> {
    return this.topicService.deactivateTopic(id);
  }

  @Query(() => Topic)
  async randomTopic(): Promise<Topic> {
    return this.topicService.getRandomTopic();
  }

  @Query(() => [Topic])
  async randomTopics(@Args('count', { type: () => Int, defaultValue: 3 }) count: number): Promise<Topic[]> {
    return this.topicService.getRandomTopics(count);
  }

  @Mutation(() => Boolean)
  async deleteTopic(@Args('id', { type: () => Int }) id: number): Promise<boolean> {
    await this.topicService.deleteWithValidation(id);
    return true;
  }

  @Query(() => Int)
  async totalTopics(): Promise<number> {
    return this.topicService.countAllTopics();
  }

  @Query(() => [Topic])
  async topicsWithPromptCount(): Promise<any[]> {
    return this.topicService.getTopicsWithPromptCount();
  }
}