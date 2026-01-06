import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

// Parse DATABASE_URL 
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

const url = new URL(databaseUrl);

// Create connection pool - optimized for production
const connection = mysql.createPool({
  host: url.hostname,
  database: url.pathname.substring(1), // Remove leading /
  user: url.username,
  password: url.password,
  charset: 'utf8mb4',
  // Production-optimierte Pool-Größe
  connectionLimit: process.env.NODE_ENV === 'production' ? 20 : 10,
  queueLimit: 0,
  // Performance-Optimierungen
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  // Connection-Timeout Settings
  connectTimeout: 10000,
  waitForConnections: true,
  maxIdle: 10,
  idleTimeout: 60000
});

export const db = drizzle(connection, { schema, mode: 'default' });

// Test connection function
export async function testConnection() {
  try {
    await connection.execute('SELECT 1');
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}