import { ObjectType } from "@nestjs/graphql";
import { GenericEntity } from "src/common/entities/generic.entity";
import { Player } from "src/players/entities/player.entity";
import { Round } from "src/rounds/entities/round.entity";
import { Vote } from "src/votes/entities/vote.entity";
import { Column, Entity, ManyToOne, OneToMany } from "typeorm";

@ObjectType()
@Entity()
export class Answer extends GenericEntity{

    @Column()
    content : string;

    @ManyToOne(() => Player, player => player.answers, { onDelete: 'CASCADE' })
    player: Player;    
    
    @ManyToOne(() => Round, round => round.answers, { onDelete: 'CASCADE' })
    round: Round;

    @OneToMany(() => Vote, vote => vote.answer)
    votes: Vote[];
}


