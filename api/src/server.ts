import 'reflect-metadata'
import * as dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

import './infrastructure/di/container'
import { AppDataSource } from './infrastructure/database/data-source'
import { AppServer } from './API'

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  APP_URL: z.string().default('http://localhost:5173'),
  PUBLIC_APP_URL: z.string().default('http://localhost:3001'),
  DATABASE_URL: z.string(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),
  REDIS_URL: z.string(),
  R2_ENDPOINT: z.string(),
  R2_ACCESS_KEY_ID: z.string(),
  R2_SECRET_ACCESS_KEY: z.string(),
  R2_BUCKET: z.string(),
  R2_PUBLIC_URL: z.string().default(''),
  SMTP_HOST: z.string(),
  SMTP_PORT: z.string().default('587'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('noreply@hira.com'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),
})

async function bootstrap(): Promise<void> {
  const env = EnvSchema.safeParse(process.env)
  if (!env.success) {
    console.error('[hira-api] Invalid environment:', env.error.flatten())
    process.exit(1)
  }

  await AppDataSource.initialize()
  if (process.env.NODE_ENV === 'production') {
    await AppDataSource.runMigrations()
  }
  console.log('[hira-api] database connected')

  new AppServer().listen(Number(env.data.PORT))

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`[hira-api] received ${signal}, shutting down`)
    try {
      await AppDataSource.destroy()
    } catch (err) {
      console.error('[hira-api] error during shutdown', err)
    } finally {
      process.exit(0)
    }
  }
  process.on('SIGTERM', () => void shutdown('SIGTERM'))
  process.on('SIGINT', () => void shutdown('SIGINT'))
}

bootstrap().catch((err) => {
  console.error('[hira-api] fatal startup error', err)
  process.exit(1)
})
