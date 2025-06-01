import { registerEnumType } from "@nestjs/graphql";

export enum GameSubstate {
    NA = 'n/a',
    CHOOSING_TOPIC = 'choosing_topic',
    GIVING_ANSWER = 'giving_answer',
    VOTING = 'voting',
    SHOWING_RESULTS = 'showing_results'
}

registerEnumType(GameSubstate ,{
    name: 'GameSubstate',
});

