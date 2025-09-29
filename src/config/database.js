/**
 * Database Configuration for Docker and Local Development
 * Handles environment detection and connection configuration
 */

class DatabaseConfig {
  constructor() {
    this.isDocker = this.detectDockerEnvironment();
    this.config = this.buildConfig();
  }

  detectDockerEnvironment() {
    // Check for Docker environment indicators
    return (
      process.env.DATABASE_URL ||
      process.env.DB_HOST === 'db' ||
      process.env.DB_HOST === 'postgres' ||
      process.env.NODE_ENV === 'production' ||
      process.env.DOCKER_ENV === 'true' ||
      process.env.KUBERNETES_SERVICE_HOST ||
      process.env.RAILWAY_ENVIRONMENT ||
      process.env.VERCEL ||
      process.env.HEROKU_APP_NAME
    );
  }

  buildConfig() {
    const baseConfig = {
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      acquireTimeoutMillis: 10000,
      createTimeoutMillis: 10000,
      destroyTimeoutMillis: 5000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200,
    };

    if (process.env.DATABASE_URL) {
      // Production/Docker with DATABASE_URL
      return {
        ...baseConfig,
        connectionString: process.env.DATABASE_URL,
        ssl: this.getSSLConfig(),
      };
    }

    // Local development or Docker with individual variables
    const host = this.isDocker ? 'db' : (process.env.DB_HOST || 'localhost');
    const port = parseInt(process.env.DB_PORT || '5432');
    const database = process.env.DB_NAME || (this.isDocker ? 'asktennis_local' : 'asktennis');
    const user = process.env.DB_USER || 'postgres';
    const password = process.env.DB_PASSWORD || 'postgres';

    return {
      ...baseConfig,
      host,
      port,
      database,
      user,
      password,
      ssl: this.getSSLConfig(),
    };
  }

  getSSLConfig() {
    if (process.env.NODE_ENV === 'production' || process.env.DATABASE_URL) {
      return { rejectUnauthorized: false };
    }
    return false;
  }

  getConnectionString() {
    if (process.env.DATABASE_URL) {
      return process.env.DATABASE_URL;
    }

    const { host, port, database, user, password } = this.config;
    return `postgresql://${user}:${password}@${host}:${port}/${database}`;
  }

  getHealthCheckQuery() {
    return 'SELECT 1 as health_check';
  }

  getEnvironmentInfo() {
    return {
      isDocker: this.isDocker,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      ssl: this.config.ssl,
    };
  }
}

module.exports = new DatabaseConfig();
