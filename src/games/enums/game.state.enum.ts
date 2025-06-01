import { registerEnumType } from "@nestjs/graphql";

export enum GameState {
  PREPARING = 'preparing',
  IN_PROGRESS = 'in_progress',
  ABORTED = 'aborted',
  FINISHED = 'finished'
}

registerEnumType(GameState, {
  name: 'GameState',
});

