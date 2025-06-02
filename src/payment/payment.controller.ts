import {
  Controller,
  Post,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Headers,
  Body,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { StripeService } from '../stripe/stripe.service';
import { PaymentService } from './payment.service';
import { ConfigType } from '@nestjs/config';
import Stripe from 'stripe';
import { AuthType } from '../auth/enums/auth-type.enums';
import { Auth } from '../auth/decorators/auth.decorator';
import AppConfig from '../config/app.config';
import { CHECKOUT_SESSION_COMPLETED } from './constants/payment.constants';

@Auth(AuthType.None)
@Controller('stripe')
export class PaymentController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly paymentService: PaymentService,
    @Inject(AppConfig.KEY)
    private readonly appConfig: ConfigType<typeof AppConfig>,
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handleStripeWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('stripe-signature') signature: string,
    @Body() body: Buffer,
  ) {
    const endpointSecret = this.appConfig.stripe.webhookSigningSecret!;

    let event: Stripe.Event;
    try {
      event = this.stripeService.constructEvent(
        body,
        signature,
        endpointSecret,
      );
    } catch (err) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .send(`Webhook Error: ${err.message}`);
    }

    if (event.type === CHECKOUT_SESSION_COMPLETED) {
      const session = event.data.object as Stripe.Checkout.Session;
      await this.paymentService.handleCheckoutSessionCompleted(session);
    }

    res.status(HttpStatus.NO_CONTENT).send();
  }
}
