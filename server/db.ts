import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Get database URL from environment variables
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
}

console.log('Connecting to database with URL:', databaseUrl);

const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test the connection
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('Successfully connected to the database');
        client.release();
    } catch (err) {
        console.error('Error connecting to the database:', err);
        console.log('Please make sure PostgreSQL is running and the credentials are correct');
    }
};

// Run the connection test
testConnection();

export const db = drizzle(pool, { schema });
export { pool };
