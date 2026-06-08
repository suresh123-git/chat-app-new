import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  MONGO_URI: Joi.string().required(),
  JWT_SECRET: Joi.string().min(8).required(),
  REDIS_URL: Joi.string().optional().allow(''),
  PORT: Joi.number().optional(),
  ALLOWED_ORIGINS: Joi.string().optional().allow(''),
  NODE_ENV: Joi.string().optional().allow('development', 'production', 'test'),
});
