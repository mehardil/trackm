import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Database connection parameters
const pool = new Pool({
    user: 'postgres',
    password: 'adm1n#Mobi',
    host: 'localhost',
    port: 5433,
    database: 'trackm',
    ssl: false,
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
