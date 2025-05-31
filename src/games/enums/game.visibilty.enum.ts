import { registerEnumType } from "@nestjs/graphql";

export enum Visibility {
    PUBLIC = 'public',
    PRIVATE = 'private',
    FRIENDS_ONLY = 'friends_only'
}

registerEnumType(Visibility, {
    name: 'Visibility',
    description: 'Visibility of the game,public or private or friends only',
});