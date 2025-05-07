import { Injectable, OnModuleInit } from '@nestjs/common'
import { createClient } from 'redis'
import { DataService } from '../data-service/data-service.interface'

@Injectable()
export class RedisService implements OnModuleInit, DataService {
  private client: any

  constructor() {}

  async onModuleInit() {
    // Only try to connect if Redis is the selected data store
    if (process.env.DATA_STORE !== 'redis') {
      console.log('Redis is not the selected data store. Skipping connection.')
      return;
    }
    
    try {
      console.log('Connecting to Redis...');
      this.client = await createClient({
        url: process.env.REDIS_URL,
        password: process.env.REDIS_PASSWORD,
      })
        .on('error', (err) => console.log('Redis Client Error', err))
        .connect()
      console.log('Connected to Redis successfully');
    } catch (e) {
      console.log('Failed to connect to Redis database', e)
    }
  }

  async get(key: string) {
    const value = await this.client.get(key)
    return value ? JSON.parse(value) : null
  }

  async set(key: string, value: any) {
    return this.client.set(key, JSON.stringify(value))
  }

  async delete(key: string) {
    return this.client.del(key)
  }
}
