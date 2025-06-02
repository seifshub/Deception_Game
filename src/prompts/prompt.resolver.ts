import { Resolver, Mutation, Args, Query, ID, Int } from '@nestjs/graphql';
import { GenericResolver } from '../common/resolvers/generic.resolver';
import { Type, UseGuards } from '@nestjs/common';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import { ActiveUserData } from '../auth/interfaces/active-user-data.interface';
import { SessionGuard } from '../auth/guards/session.guard';
import { Prompt } from './entities/prompt.entity';
import { CreatePromptInput } from './dtos/create-prompt.input';
import { PromptsService } from './prompts.service';
import { UpdatePromptInput } from './dtos/update-prompt.input';
import { Roles } from 'src/auth/access-control/decorators/roles.decorator';
import { Role } from 'src/users/enums/role.enum';
import { RolesGuard } from 'src/auth/access-control/guards/roles.guard';

@Roles(Role.Admin)
@UseGuards(SessionGuard, RolesGuard)
@Resolver(() => Prompt)
export class PromptsResolver extends GenericResolver(
    Prompt as Type<Prompt> & Prompt,
    CreatePromptInput,
    UpdatePromptInput
) {
    constructor(private readonly promptService: PromptsService) {
        super(promptService);
    }

    @Mutation(() => Prompt)
    async create(
        @Args('createInput') createInput: CreatePromptInput,
        @ActiveUser() user: ActiveUserData,
    ): Promise<Prompt> {
        return this.promptService.createPrompt(createInput);
    }

    @Mutation(() => Boolean)
    async deletePrompt(@Args('id', { type: () => Int }) id: number): Promise<boolean> {
        await this.promptsService.deletePrompt(id);
        return true;
    }

    @Query(() => [Prompt])
    async promptsByTopic(
        @Args('topicId', { type: () => Int }) topicId: number,
    ): Promise<Prompt[]> {
        return this.promptsService.findByTopic(topicId);
    }

    @Mutation(() => Prompt)
    async activatePrompt(@Args('id', { type: () => Int }) id: number): Promise<Prompt> {
        return this.promptsService.activatePrompt(id);
    }

    @Mutation(() => Prompt)
    async deactivatePrompt(@Args('id', { type: () => Int }) id: number): Promise<Prompt> {
        return this.promptsService.deactivatePrompt(id);
    }
}