import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ThrottlerStorage, ThrottlerStorageRecord } from '@nestjs/throttler'
import Redis from 'ioredis'

@Injectable()
export class ThrottlerStorageService implements ThrottlerStorage, OnModuleDestroy {
  private readonly redis: Redis

  constructor(config: ConfigService) {
    this.redis = new Redis(config.getOrThrow<string>('REDIS_URL'), {
      lazyConnect: true,
      enableReadyCheck: false,
      maxRetriesPerRequest: 0,
    })
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const hitKey = `throttler:${throttlerName}:${key}:hits`
    const blockKey = `throttler:${throttlerName}:${key}:blocked`

    const blockTtl = await this.redis.pttl(blockKey)
    if (blockTtl > 0) {
      return {
        totalHits: limit + 1,
        timeToExpire: 0,
        isBlocked: true,
        timeToBlockExpire: blockTtl,
      }
    }

    const pipe = this.redis.pipeline()
    pipe.incr(hitKey)
    pipe.pttl(hitKey)
    const results = await pipe.exec()

    const totalHits = results?.[0]?.[1] as number
    let timeToExpire = results?.[1]?.[1] as number

    if (totalHits === 1) {
      await this.redis.pexpire(hitKey, ttl)
      timeToExpire = ttl
    }

    if (totalHits > limit) {
      await this.redis.set(blockKey, '1', 'PX', blockDuration)
      const timeToBlockExpire = await this.redis.pttl(blockKey)
      return {
        totalHits,
        timeToExpire: Math.max(0, timeToExpire),
        isBlocked: true,
        timeToBlockExpire: Math.max(0, timeToBlockExpire),
      }
    }

    return {
      totalHits,
      timeToExpire: Math.max(0, timeToExpire),
      isBlocked: false,
      timeToBlockExpire: 0,
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.redis.disconnect()
  }
}
