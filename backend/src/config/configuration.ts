export default () => ({
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  REDIS_URL: process.env.REDIS_URL,
  PORT: process.env.PORT ? Number(process.env.PORT) : 3000,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
});