import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import { GenericEntity } from '../../common/entities/generic.entity';
import { Column, Entity, ManyToOne, ManyToMany, JoinTable, JoinColumn, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { GameState } from '../enums/game.state.enum';
import { GameSubstate } from '../enums/game.substate.enum';
import { Visibility } from '../enums/game.visibilty.enum';


@ObjectType()
@Entity()
@Unique('UQ_GAME_NAME', ['name'])
export class Game extends GenericEntity {
    @Column()
    name: string;

    @Field(() => GameState, { nullable: true })
    @Column({
        type: 'enum',
        enum: GameState,
        default: GameState.PREPARING,
    })
    status: GameState;

    @Field(() => GameSubstate, { nullable: true })
    @Column({
        type: 'enum',
        enum: GameSubstate,
        default: GameSubstate.NA,
    })
    substate: GameSubstate;

    @Field(() => Visibility, { nullable: true })
    @Column({
        type: 'enum',
        enum: Visibility,
        default: Visibility.PUBLIC,
    })
    visibility: Visibility;

    @Column({
        default: 3,
        comment: 'The number of players required to start the game'
    })
    size: number;

    @Field(() => User, { description: 'The host of the game' })
    @ManyToOne(() => User, user => user.hostedGames, { eager: true })
    @JoinColumn({ name: 'host_id' })
    host: User;

    @Field(() => [User] , { description: 'Players in the game' })
    @ManyToMany(() => User, user => user.joinedGames, { eager: true })
    @JoinTable({
        name: 'game_players',
        joinColumn: { name: 'game_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'player_id', referencedColumnName: 'id' }
    })
    players: User[];


}