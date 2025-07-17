const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false
  },
  // Timeout for establishing a new connection
  connectionTimeoutMillis: 5000,
  // Timeout for an idle connection in the pool before it's closed
  idleTimeoutMillis: 30000,
});

/**
 * Listens for errors on idle clients in the pool. This is crucial for
 * catching background errors like network issues or unexpected disconnects.
 */
pool.on('error', (err, client) => {
  console.error('🔴 Unexpected error on idle database client', err);
  // For critical errors, you might want the application to exit
  // process.exit(-1);
});

/**
 * Tests the database connection by acquiring a client and running a simple query.
 */
const testConnection = async () => {
  let client;
  try {
    // Get a client from the pool
    client = await pool.connect();
    // Run a test query
    await client.query('SELECT NOW()');
    console.log('✅ Database connected successfully.');
  } catch (err) {
    console.error('🔴 Failed to connect to the database.');
    // Re-throw the error to be caught by the calling function in index.js
    throw err;
  } finally {
    // IMPORTANT: Always release the client back to the pool
    if (client) {
      client.release();
    }
  }
};

module.exports = { pool, testConnection };