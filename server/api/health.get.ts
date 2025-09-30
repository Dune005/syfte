import { db } from '../utils/database/connection';

export default defineEventHandler(async (event) => {
  try {
    const startTime = Date.now();
    
    // Test database connection
    const dbCheck = await db.execute('SELECT 1 as test');
    const dbResponseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        connected: true,
        responseTime: `${dbResponseTime}ms`
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB'
      },
      version: process.env.npm_package_version || '1.0.0'
    };

  } catch (error: any) {
    console.error('Health check failed:', error);
    
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      database: {
        connected: false
      }
    };
  }
});