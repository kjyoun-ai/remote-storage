import { Injectable, OnModuleInit } from '@nestjs/common'
import { createClient } from 'redis'
import { DataService } from '../data-service/data-service.interface'

@Injectable()
export class RedisService implements OnModuleInit, DataService {
  private client: any
  private isRedisConfigured = false;

  constructor() {
    // Check if Redis is the selected data store
    this.isRedisConfigured = process.env.DATA_STORE === 'redis';
    console.log(`Redis is ${this.isRedisConfigured ? 'configured' : 'not configured'} as the data store`);
  }

  async onModuleInit() {
    // Only try to connect if Redis is the selected data store
    if (!this.isRedisConfigured) {
      console.log('Redis is not the selected data store. Skipping connection.');
      return;
    }
    
    try {
      console.log('Connecting to Redis...');
      
      // Only create client if Redis URL is provided
      if (!process.env.REDIS_URL) {
        console.log('No REDIS_URL provided. Redis connection skipped.');
        return;
      }
      
      this.client = createClient({
        url: process.env.REDIS_URL,
        password: process.env.REDIS_PASSWORD,
        socket: {
          reconnectStrategy: (retries) => {
            // Limit reconnection attempts to prevent infinite loops
            if (retries > 5) {
              console.log(`Maximum Redis reconnection attempts (${retries}) reached. Giving up.`);
              return false; // stop trying to reconnect
            }
            // Use exponential backoff
            const delay = Math.min(1000 * 2 ** retries, 30000);
            console.log(`Redis reconnection attempt ${retries + 1} in ${delay}ms`);
            return delay;
          }
        }
      });
      
      this.client.on('error', (err) => {
        console.log('Redis Client Error', err);
      });
      
      await this.client.connect();
      console.log('Connected to Redis successfully');
    } catch (e) {
      console.log('Failed to connect to Redis database', e);
      // Prevent further Redis operations
      this.isRedisConfigured = false;
    }
  }

  async get(key: string) {
    // Check if Redis is configured and client is available
    if (!this.isRedisConfigured || !this.client) {
      console.log('Redis is not the selected data store or client is not initialized');
      return null;
    }
    
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (e) {
      console.log(`Error getting key ${key} from Redis`, e);
      return null;
    }
  }

  async set(key: string, value: any) {
    // Check if Redis is configured and client is available
    if (!this.isRedisConfigured || !this.client) {
      console.log('Redis is not the selected data store or client is not initialized');
      return null;
    }
    
    try {
      return await this.client.set(key, JSON.stringify(value));
    } catch (e) {
      console.log(`Error setting key ${key} in Redis`, e);
      return null;
    }
  }

  async delete(key: string) {
    // Check if Redis is configured and client is available
    if (!this.isRedisConfigured || !this.client) {
      console.log('Redis is not the selected data store or client is not initialized');
      return null;
    }
    
    try {
      return await this.client.del(key);
    } catch (e) {
      console.log(`Error deleting key ${key} from Redis`, e);
      return null;
    }
  }
}
