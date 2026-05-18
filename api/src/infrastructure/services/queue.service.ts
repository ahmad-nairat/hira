import { injectable } from 'tsyringe'
import Redis from 'ioredis'

export interface IQueueService {
  publish(stream: string, payload: Record<string, unknown>): Promise<void>
}

@injectable()
export class RedisQueueService implements IQueueService {
  private readonly client: Redis

  constructor() {
    this.client = new Redis(process.env.REDIS_URL as string, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    })
  }

  async publish(stream: string, payload: Record<string, unknown>): Promise<void> {
    const fields = Object.entries(payload).flatMap(([k, v]) => [k, JSON.stringify(v)])
    await this.client.xadd(stream, '*', ...fields)
  }
}
