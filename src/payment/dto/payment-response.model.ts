import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PaymentResponse {
  @Field()
  checkoutUrl: string;

  @Field()
  sessionId: string;
}
