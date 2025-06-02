import { ConfigType } from '@nestjs/config';
import AppConfig from '../config/app.config';
import Stripe from 'stripe';
import { STRIPE_CLIENT } from './constants/stripe.constants';
import { Module, Global } from '@nestjs/common';
import { StripeService } from './stripe.service';

@Global()
@Module({
  providers: [
    {
      provide: STRIPE_CLIENT,
      useFactory: (config: ConfigType<typeof AppConfig>) => {
        const secretKey = config.stripe.secretKey!;
        return new Stripe(secretKey);
      },
      inject: [AppConfig.KEY],
    },
    StripeService,
  ],
  exports: [StripeService],
})
export class StripeModule {}
