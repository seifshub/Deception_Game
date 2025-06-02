import { Resolver, Mutation } from '@nestjs/graphql';
import { PaymentService } from './payment.service';
import { PaymentResponse } from './dto/payment-response.model';
import { ActiveUser } from '../auth/decorators/active-user.decorator';

@Resolver()
export class PaymentResolver {
  constructor(private readonly paymentService: PaymentService) {}

  @Mutation(() => PaymentResponse, {
    description:
      'Creates a Stripe Checkout Session for a one-time “lifetime premium” purchase',
  })
  async createPayment(
    @ActiveUser('sub') userId: number,
  ): Promise<PaymentResponse> {
    return this.paymentService.createPaymentSession(userId);
  }
}
