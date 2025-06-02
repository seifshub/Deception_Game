import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { StripeService } from '../stripe/stripe.service';
import { User } from '../users/entities/user.entity';
import Stripe from 'stripe';
import { PaymentSession } from './entities/paymen-session.entity';

@Injectable()
export class PaymentService {
  PREMIUM_PRICE: number = 2000;

  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly stripeService: StripeService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PaymentSession)
    private readonly sessionRepository: Repository<PaymentSession>,
  ) {}

  async createPaymentSession(
    userId: number,
  ): Promise<{ checkoutUrl: string; sessionId: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.isPremium) {
      throw new BadRequestException('User is already premium');
    }

    const nowUnix = Math.floor(Date.now() / 1000);

    const existingSession = await this.sessionRepository.findOne({
      where: {
        user: { id: userId },
        completed: false,
        stripeExpiresAt: MoreThan(nowUnix),
      },
      order: { createdAt: 'DESC' },
    });

    if (existingSession) {
      let stripeSess: Stripe.Checkout.Session | null = null;
      try {
        stripeSess = await this.stripeService.retrieveCheckoutSession(
          existingSession.stripeSessionId,
        );
      } catch (err) {
        this.logger.warn(
          `Could not retrieve Stripe session ${existingSession.stripeSessionId}: ${err.message}`,
        );
      }

      if (stripeSess) {
        const { payment_status, status, expires_at } = stripeSess;
        if (
          payment_status === 'unpaid' &&
          status === 'open' &&
          typeof expires_at === 'number' &&
          expires_at > nowUnix
        ) {
          return {
            checkoutUrl: stripeSess.url!,
            sessionId: stripeSess.id,
          };
        }
        this.logger.log(
          `Existing session ${existingSession.stripeSessionId} cannot be reused: ` +
            `payment_status=${payment_status}, status=${status}, expires_at=${expires_at} (now=${nowUnix})`,
        );
      }
    }

    const session: Stripe.Checkout.Session =
      await this.stripeService.createCheckoutSession(
        userId,
        this.PREMIUM_PRICE,
      );

    const newSession = this.sessionRepository.create({
      stripeSessionId: session.id,
      stripeExpiresAt:
        session.expires_at || Math.floor(Date.now() / 1000 + 24 * 60 * 60),
      completed: false,
      user: user,
    });
    await this.sessionRepository.save(newSession);

    return {
      checkoutUrl: session.url!,
      sessionId: session.id,
    };
  }

  async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const metadata = session.metadata || {};
    const userIdString = metadata.userId;
    if (!userIdString) {
      this.logger.error('No userId in session metadata');
      return;
    }

    const userId = parseInt(userIdString, 10);
    if (isNaN(userId)) {
      this.logger.error(`Invalid userId in metadata: ${userIdString}`);
      return;
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      this.logger.error(`User not found for ID ${userId}`);
      return;
    }

    const paymentSession = await this.sessionRepository.findOne({
      where: { stripeSessionId: session.id },
      relations: ['user'],
    });
    if (!paymentSession) {
      this.logger.error(
        `Could not find PaymentSession for Stripe ID ${session.id}`,
      );
      return;
    }

    paymentSession.completed = true;
    await this.sessionRepository.save(paymentSession);

    user.isPremium = true;
    await this.userRepository.save(user);
    this.logger.log(`User ${userId} has been upgraded to premium.`);
  }
}
