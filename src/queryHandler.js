/**
 * Enhanced Tennis Query Handler for Docker Database Integration
 * Comprehensive overhaul with proper architecture, error handling, and Docker support
 */

const databaseConnection = require('./database/connection');
const queryService = require('./services/queryService');
const databaseConfig = require('./config/database');

class TennisQueryHandler {
  constructor() {
    this.isInitialized = false;
    this.initializationPromise = null;
  }

  async initialize() {
    if (this.isInitialized) {
      return true;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._performInitialization();
    return this.initializationPromise;
  }

  async _performInitialization() {
    try {
      console.log('🚀 Initializing Tennis Query Handler...');
      
      // Initialize database connection
      await databaseConnection.connect();
      
      this.isInitialized = true;
      console.log('✅ Tennis Query Handler initialized successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Tennis Query Handler:', error.message);
      this.isInitialized = false;
      throw error;
    }
  }

  // Main query processing method
  async processQuery(question, userId = null) {
    try {
      // Ensure handler is initialized
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Validate input
      if (!question || typeof question !== 'string' || question.trim().length === 0) {
        return {
          error: 'Invalid query',
          message: 'Please provide a valid question',
          timestamp: new Date().toISOString()
        };
      }

      console.log(`🎾 Processing tennis query: "${question}"`);
      
      // Process the query through the service layer
      const result = await queryService.processQuery(question, userId);
      
      // Add metadata
      const response = {
        ...result,
        queryId: this.generateQueryId(),
        processedAt: new Date().toISOString(),
        handler: 'enhanced',
        version: '2.0.0'
      };

      console.log('✅ Query processed successfully');
      return response;
    } catch (error) {
      console.error('❌ Error in processQuery:', error.message);
      
      // Return structured error response
      return {
        error: 'Query processing failed',
        message: 'Unable to process your tennis query at this time',
        details: error.message,
        timestamp: new Date().toISOString(),
        handler: 'enhanced',
        version: '2.0.0'
      };
    }
  }

  // Health check method
  async getHealthStatus() {
    try {
      const dbInfo = databaseConnection.getConnectionInfo();
      const cacheStats = queryService.getCacheStats();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: {
          connected: dbInfo.isConnected,
          isDocker: dbInfo.isDocker,
          reconnectAttempts: dbInfo.reconnectAttempts
        },
        cache: cacheStats,
        handler: 'enhanced',
        version: '2.0.0'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        handler: 'enhanced',
        version: '2.0.0'
      };
    }
  }

  // Database connection status
  async getDatabaseStatus() {
    try {
      const dbInfo = databaseConnection.getConnectionInfo();
      const poolStats = await databaseConnection.getPoolStats();
      
      return {
        ...dbInfo,
        poolStats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Clear all caches
  async clearCaches() {
    try {
      queryService.clearCache();
      console.log('✅ All caches cleared');
      return {
        success: true,
        message: 'All caches cleared successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error clearing caches:', error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get system statistics
  async getSystemStats() {
    try {
      const dbInfo = databaseConnection.getConnectionInfo();
      const poolStats = await databaseConnection.getPoolStats();
      const cacheStats = queryService.getCacheStats();
      
      return {
        database: {
          ...dbInfo,
          poolStats
        },
        cache: cacheStats,
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version,
          platform: process.platform
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Generate unique query ID
  generateQueryId() {
    return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Graceful shutdown
  async shutdown() {
    try {
      console.log('🔄 Shutting down Tennis Query Handler...');
      await databaseConnection.close();
      this.isInitialized = false;
      console.log('✅ Tennis Query Handler shutdown complete');
    } catch (error) {
      console.error('❌ Error during shutdown:', error.message);
    }
  }
}

// Create and export singleton instance
const tennisQueryHandler = new TennisQueryHandler();

// Export the main query processing function (backward compatibility)
async function processTennisQuery(question, userId = null) {
  return await tennisQueryHandler.processQuery(question, userId);
}

// Export enhanced functions
async function getHealthStatus() {
  return await tennisQueryHandler.getHealthStatus();
}

async function getDatabaseStatus() {
  return await tennisQueryHandler.getDatabaseStatus();
}

async function clearCaches() {
  return await tennisQueryHandler.clearCaches();
}

async function getSystemStats() {
  return await tennisQueryHandler.getSystemStats();
}

async function shutdown() {
  return await tennisQueryHandler.shutdown();
}

module.exports = {
  TennisQueryHandler,
  processTennisQuery,
  tennisQueryHandler,
  // Enhanced functions
  getHealthStatus,
  getDatabaseStatus,
  clearCaches,
  getSystemStats,
  shutdown
};