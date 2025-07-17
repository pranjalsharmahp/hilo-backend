// 1. Load environment variables at the very top
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// 2. Import your database pool and connection test function
const { pool, testConnection } = require('./db/db');

/**
 * Global error handler for uncaught exceptions.
 * Prevents the application from crashing silently.
 */
process.on('uncaughtException', (err) => {
  console.error('🔴 Uncaught Exception:', err);
  process.exit(1);
});

/**
 * Global error handler for unhandled promise rejections.
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('🔴 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const app = express();

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

// --- API Routes ---

app.get('/', (req, res) => {
  res.send('API is working');
});

// An example route that correctly handles potential database errors
app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.status(200).json({
      message: 'Database connection is healthy.',
      time: result.rows[0].now,
    });
  } catch (err) {
    console.error('Error executing /db-test query:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


/**
 * Starts the Express server.
 */
const startServer = () => {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
};


// 3. Main execution block
// First, test the database connection.
// If it succeeds, start the server.
testConnection()
  .then(() => {
    startServer();
  })
  .catch(err => {
    console.error('🔴 Application failed to start due to database connection error:', err.message);
    // The process will exit due to the 'unhandledRejection' handler
  });