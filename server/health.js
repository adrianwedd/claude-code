// Health check endpoints for production monitoring
const express = require('express');
const router = express.Router();
const redis = require('redis');
const { Pool } = require('pg');

// Initialize connections for health checks
let redisClient;
let pgPool;

const initializeHealthChecks = () => {
  // Redis client for health checks
  redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  redisClient.on('error', (err) => {
    console.error('Redis health check client error:', err);
  });

  // PostgreSQL pool for health checks
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 2, // Minimal pool for health checks
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
};

// Basic health check
router.get('/health', async (req, res) => {
  const startTime = Date.now();
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {}
  };

  try {
    // Memory usage check
    const memUsage = process.memoryUsage();
    health.checks.memory = {
      status: 'ok',
      used: Math.round((memUsage.heapUsed / 1024 / 1024) * 100) / 100,
      total: Math.round((memUsage.heapTotal / 1024 / 1024) * 100) / 100,
      external: Math.round((memUsage.external / 1024 / 1024) * 100) / 100
    };

    // CPU usage estimation
    const cpuUsage = process.cpuUsage();
    health.checks.cpu = {
      status: 'ok',
      user: cpuUsage.user,
      system: cpuUsage.system
    };

    // Redis connectivity check
    if (redisClient) {
      try {
        await redisClient.ping();
        health.checks.redis = { status: 'ok', connection: 'connected' };
      } catch (error) {
        health.checks.redis = { status: 'error', error: error.message };
        health.status = 'degraded';
      }
    } else {
      health.checks.redis = { status: 'not_configured' };
    }

    // Database connectivity check
    if (pgPool) {
      try {
        const client = await pgPool.connect();
        await client.query('SELECT 1');
        client.release();
        health.checks.database = { status: 'ok', connection: 'connected' };
      } catch (error) {
        health.checks.database = { status: 'error', error: error.message };
        health.status = 'degraded';
      }
    } else {
      health.checks.database = { status: 'not_configured' };
    }

    // Response time
    health.responseTime = Date.now() - startTime;

    // Determine overall status
    const hasErrors = Object.values(health.checks).some(check => check.status === 'error');
    if (hasErrors) {
      health.status = 'degraded';
    }

    res.status(health.status === 'ok' ? 200 : 503).json(health);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      responseTime: Date.now() - startTime
    });
  }
});

// Readiness check for Kubernetes/container orchestration
router.get('/ready', async (req, res) => {
  try {
    // More stringent checks for readiness
    const checks = [];

    // Redis readiness
    if (redisClient) {
      checks.push(redisClient.ping());
    }

    // Database readiness
    if (pgPool) {
      const client = await pgPool.connect();
      checks.push(client.query('SELECT 1'));
      client.release();
    }

    await Promise.all(checks);
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Liveness check for Kubernetes
router.get('/live', (req, res) => {
  // Simple liveness check - if we can respond, we're alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Metrics endpoint for Prometheus
router.get('/metrics', async (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    let metrics = `# HELP nodejs_memory_heap_used_bytes Node.js heap memory usage
# TYPE nodejs_memory_heap_used_bytes gauge
nodejs_memory_heap_used_bytes ${memUsage.heapUsed}

# HELP nodejs_memory_heap_total_bytes Node.js heap memory total
# TYPE nodejs_memory_heap_total_bytes gauge
nodejs_memory_heap_total_bytes ${memUsage.heapTotal}

# HELP nodejs_memory_external_bytes Node.js external memory usage
# TYPE nodejs_memory_external_bytes gauge
nodejs_memory_external_bytes ${memUsage.external}

# HELP nodejs_cpu_user_seconds_total Node.js CPU user time
# TYPE nodejs_cpu_user_seconds_total counter
nodejs_cpu_user_seconds_total ${cpuUsage.user / 1000000}

# HELP nodejs_cpu_system_seconds_total Node.js CPU system time
# TYPE nodejs_cpu_system_seconds_total counter
nodejs_cpu_system_seconds_total ${cpuUsage.system / 1000000}

# HELP nodejs_process_uptime_seconds Node.js process uptime
# TYPE nodejs_process_uptime_seconds gauge
nodejs_process_uptime_seconds ${process.uptime()}

# HELP nodejs_version_info Node.js version information
# TYPE nodejs_version_info gauge
nodejs_version_info{version="${process.version}"} 1
`;

    // Add WebSocket connection metrics if available
    if (global.socketStats) {
      metrics += `
# HELP websocket_connections_total Total WebSocket connections
# TYPE websocket_connections_total gauge
websocket_connections_total ${global.socketStats.connections || 0}

# HELP websocket_messages_total Total WebSocket messages
# TYPE websocket_messages_total counter
websocket_messages_total ${global.socketStats.messages || 0}
`;
    }

    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    console.error('Metrics endpoint error:', error);
    res.status(500).send('Error generating metrics');
  }
});

module.exports = { router, initializeHealthChecks };