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

app.post('/messages', async (req, res) => {
  const { sender, receiver, content } = req.body;
  if (!sender || !receiver || !content) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO messages (sender_email, receiver_email, content) VALUES ($1, $2, $3) RETURNING *',
      [sender, receiver, content]
    );
    res.status(201).json({
      message: 'Message sent successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error executing /messages query:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/messages', async (req, res) => {
  const {userEmail}=req.query;
  if (!userEmail) {
    return res.status(400).json({ error: 'User email is required' });
  }
  try {
    const result = await pool.query(
      'SELECT * FROM messages WHERE sender_email = $1 OR receiver_email = $1',
      [userEmail]
    );
    res.status(200).json({
      message: 'Messages retrieved successfully',
      data: result.rows
    });
  } catch (err) {
    console.error('Error executing /messages query:', err);
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