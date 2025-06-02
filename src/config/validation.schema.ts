import * as Joi from 'joi';

export const validationSchema = Joi.object({
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_USERNAME: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_NAME: Joi.string().required(),
  SESSION_SECRET: Joi.string().required(),
  STRIPE_SECRET_KEY: Joi.string().required(),
  STRIPE_CURRENCY: Joi.string().required(),
  STRIPE_WEBHOOK_SIGNING_SECRET: Joi.string().required(),
  STRIPE_WEBHOOK_ROUTE: Joi.string().required(),
  FRONTEND_URL: Joi.string().required(),
});
