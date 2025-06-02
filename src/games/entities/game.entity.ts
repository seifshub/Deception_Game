import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import { GenericEntity } from '../../common/entities/generic.entity';
import { Column, Entity, ManyToOne, JoinColumn, Unique, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { GameState } from '../enums/game.state.enum';
import { GameSubstate } from '../enums/game.substate.enum';
import { Visibility } from '../enums/game.visibilty.enum';
import { Round } from '../../rounds/entities/round.entity';
import { Player } from '../../players/entities/player.entity';


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
    
    @Column({
        default: 3
    })
    totalRounds: number;

    @Field(() => User, { description: 'The host of the game' })
    @ManyToOne(() => User, user => user.hostedGames, { eager: true })
    @JoinColumn({ name: 'host_id' })
    host: User;   
     
    @OneToMany(() => Player, player => player.game, { eager: true, cascade: true })
    @JoinColumn({ name: 'game_id' })
    playerProfiles: Player[];

    @Field(() => [Round], { description: 'Rounds in the game', nullable: true })
    @OneToMany(() => Round, round => round.game, { eager:true, cascade: true })
    @JoinColumn({ name: 'game_id' })
    gameRounds: Round[];

}