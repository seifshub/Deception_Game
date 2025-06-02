import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import {
  STRIPE_CANCEL_URL_SUFFIX,
  STRIPE_CLIENT,
  STRIPE_SUCCESS_URL_SUFFIX,
} from './constants/stripe.constants';
import AppConfig from '../config/app.config';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class StripeService {
  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripeClient: Stripe,
    @Inject(AppConfig.KEY)
    private readonly appConfig: ConfigType<typeof AppConfig>,
  ) {}

  async createCheckoutSession(
    userId: number,
    amount: number,
  ): Promise<Stripe.Checkout.Session> {
    const currency = this.appConfig.stripe.currency!;
    const priceInCents = amount;
    const domain = this.appConfig.frontend.url;

    try {
      const params: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency,
              product_data: {
                name: 'Lifetime Premium Access',
                description: 'Unlock premium features forever',
              },
              unit_amount: priceInCents,
            },
            quantity: 1,
          },
        ],
        metadata: {
          userId: userId.toString(),
        },
        success_url: `${domain}${STRIPE_SUCCESS_URL_SUFFIX}`,
        cancel_url: `${domain}${STRIPE_CANCEL_URL_SUFFIX}`,
      };
      return await this.stripeClient.checkout.sessions.create(params);
    } catch (err) {
      throw new HttpException(
        `Failed to create Stripe Checkout session: ${err.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async retrieveCheckoutSession(
    sessionId: string,
  ): Promise<Stripe.Checkout.Session> {
    try {
      return await this.stripeClient.checkout.sessions.retrieve(sessionId);
    } catch (err: any) {
      throw new HttpException(
        `Failed to retrieve Stripe Checkout session: ${err.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  constructEvent(
    payload: Buffer,
    signature: string,
    endpointSecret: string,
  ): Stripe.Event {
    try {
      return this.stripeClient.webhooks.constructEvent(
        payload,
        signature,
        endpointSecret,
      );
    } catch (err) {
      throw new HttpException(
        `Webhook signature verification failed: ${err.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
