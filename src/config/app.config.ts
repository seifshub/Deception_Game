import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  environment: process.env.NODE_ENV || 'development',
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT!),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    name: process.env.DATABASE_NAME,
    synchronize: process.env.DATABASE_SYNCHRONIZATION === 'true',
  },
  session: {
    secret: process.env.SESSION_SECRET,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    currency: process.env.STRIPE_CURRENCY,
    webhookSigningSecret: process.env.STRIPE_WEBHOOK_SIGNING_SECRET,
    webhookRoute: process.env.STRIPE_WEBHOOK_ROUTE,
  },
  frontend: {
    url: process.env.FRONTEND_URL,
  },
}));
