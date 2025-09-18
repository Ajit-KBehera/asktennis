const { createClient } = require('redis');

class Cache {
  constructor() {
    this.client = null;
  }

  async connect() {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.error('Redis server connection refused');
            return new Error('Redis server connection refused');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            console.error('Redis retry time exhausted');
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            console.error('Redis max retry attempts reached');
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected successfully');
      });

      this.client.on('ready', () => {
        console.log('✅ Redis ready for operations');
      });

      this.client.on('end', () => {
        console.log('Redis connection ended');
      });

      await this.client.connect();
      
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      // Don't throw error - cache is optional
      console.log('⚠️  Continuing without cache...');
    }
  }

  async get(key) {
    if (!this.client || !this.client.isOpen) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 3600) {
    if (!this.client || !this.client.isOpen) {
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      await this.client.setEx(key, ttlSeconds, serializedValue);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async del(key) {
    if (!this.client || !this.client.isOpen) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async exists(key) {
    if (!this.client || !this.client.isOpen) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  async flush() {
    if (!this.client || !this.client.isOpen) {
      return false;
    }

    try {
      await this.client.flushAll();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    if (!this.client || !this.client.isOpen) {
      return { connected: false, keys: 0, memory: 'N/A' };
    }

    try {
      const info = await this.client.info('memory');
      const keys = await this.client.dbSize();
      
      return {
        connected: true,
        keys: keys,
        memory: info,
        uptime: await this.client.info('server').then(info => info.match(/uptime_in_seconds:(\d+)/)?.[1] || 'N/A')
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { connected: true, keys: 'N/A', memory: 'N/A', error: error.message };
    }
  }

  /**
   * Set with automatic expiration based on data type
   */
  async setSmart(key, value, dataType = 'general') {
    if (!this.client || !this.client.isOpen) {
      return false;
    }

    try {
      // Set different expiration times based on data type
      let ttl = 3600; // Default 1 hour
      
      switch (dataType) {
        case 'ranking':
          ttl = 1800; // 30 minutes for rankings (more dynamic)
          break;
        case 'player':
          ttl = 7200; // 2 hours for player data (less dynamic)
          break;
        case 'tournament':
          ttl = 3600; // 1 hour for tournament data
          break;
        case 'query':
          ttl = 1800; // 30 minutes for query results
          break;
        default:
          ttl = 3600; // 1 hour default
      }

      await this.client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Get with fallback handling
   */
  async getSmart(key) {
    if (!this.client || !this.client.isOpen) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }


  async close() {
    if (this.client && this.client.isOpen) {
      await this.client.quit();
      console.log('Redis connection closed');
    }
  }
}

module.exports = new Cache();
