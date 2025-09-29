/**
 * Enhanced Database Connection Manager for Docker Environments
 * Handles connection pooling, health checks, and automatic reconnection
 */

const { Pool } = require('pg');
const databaseConfig = require('../config/database');

class DatabaseConnection {
  constructor() {
    this.pool = null;
    this.isConnected = false;
    this.healthCheckInterval = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000; // 5 seconds
  }

  async connect() {
    try {
      console.log('🔄 Initializing database connection...');
      console.log('Environment info:', databaseConfig.getEnvironmentInfo());

      // Close existing connection if any
      if (this.pool) {
        await this.close();
      }

      // Create new pool with Docker-optimized configuration
      this.pool = new Pool(databaseConfig.config);

      // Set up event handlers
      this.setupEventHandlers();

      // Test connection
      await this.testConnection();

      // Start health monitoring
      this.startHealthMonitoring();

      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      console.log('✅ Database connected successfully');
      console.log(`Connection string: ${databaseConfig.getConnectionString()}`);
      
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      this.isConnected = false;
      
      // In test mode, don't attempt reconnection
      if (process.env.NODE_ENV === 'test') {
        console.log('⚠️ Test mode: Database connection failed, continuing with mock data');
        return false;
      }
      
      // Attempt reconnection if in Docker environment
      if (databaseConfig.isDocker && this.reconnectAttempts < this.maxReconnectAttempts) {
        console.log(`🔄 Attempting reconnection (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);
        await this.scheduleReconnect();
      }
      
      throw error;
    }
  }

  setupEventHandlers() {
    if (!this.pool) return;

    this.pool.on('error', (err) => {
      console.error('❌ Database pool error:', err.message);
      this.isConnected = false;
    });

    this.pool.on('connect', (client) => {
      console.log('✅ New database client connected');
    });

    this.pool.on('remove', (client) => {
      console.log('🔌 Database client removed from pool');
    });
  }

  async testConnection() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(databaseConfig.getHealthCheckQuery());
      console.log('✅ Database health check passed');
      return result;
    } finally {
      client.release();
    }
  }

  async scheduleReconnect() {
    this.reconnectAttempts++;
    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        console.error('Reconnection attempt failed:', error.message);
      }
    }, this.reconnectDelay);
  }

  startHealthMonitoring() {
    // Clear existing interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Check database health every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.testConnection();
        this.isConnected = true;
      } catch (error) {
        console.warn('⚠️ Database health check failed:', error.message);
        this.isConnected = false;
        
        // Attempt reconnection if needed
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          await this.scheduleReconnect();
        }
      }
    }, 30000);
  }

  async query(text, params = []) {
    if (!this.isConnected || !this.pool) {
      throw new Error('Database not connected');
    }

    const client = await this.pool.connect();
    try {
      const startTime = Date.now();
      const result = await client.query(text, params);
      const duration = Date.now() - startTime;
      
      // Log slow queries (> 1 second)
      if (duration > 1000) {
        console.warn(`⚠️ Slow query detected (${duration}ms):`, text.substring(0, 100) + '...');
      }
      
      return result;
    } catch (error) {
      console.error('Database query error:', error.message);
      console.error('Query:', text);
      console.error('Params:', params);
      throw error;
    } finally {
      client.release();
    }
  }

  async getClient() {
    if (!this.isConnected || !this.pool) {
      throw new Error('Database not connected');
    }
    return await this.pool.connect();
  }

  async close() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
    
    this.isConnected = false;
    console.log('🔌 Database connection closed');
  }

  getConnectionInfo() {
    return {
      isConnected: this.isConnected,
      isDocker: databaseConfig.isDocker,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      connectionString: databaseConfig.getConnectionString(),
      environment: databaseConfig.getEnvironmentInfo(),
    };
  }

  async getPoolStats() {
    if (!this.pool) {
      return { error: 'No pool available' };
    }

    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }
}

module.exports = new DatabaseConnection();
