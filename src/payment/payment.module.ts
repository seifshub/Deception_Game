import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentResolver } from './payment.resolver';
import { PaymentController } from './payment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentSession } from './entities/payment-session.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentSession]), UsersModule],
  providers: [PaymentService, PaymentResolver],
  controllers: [PaymentController],
})
export class PaymentModule {}
