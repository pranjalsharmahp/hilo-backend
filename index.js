// 1. Load environment variables at the very top
require('dotenv').config();

const express = require('express');
const http = require('http');
const {Server}=require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const conversationRoutes = require('./routes/conversations');
const userRoutes = require('./routes/users');

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
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for simplicity; adjust as needed
    methods: ['GET', 'POST'],
  },
});

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

io.on('connection', (socket) => {console.log('A user connected:', socket.id);
  socket.on('joinRoom', (email) => {
    socket.join(email);
    console.log(`User with email ${email} joined room`);
  });

  socket.on('sendMessage', async (messageData) => {
    const {sender_email, receiver_email,content} = messageData;
    try{
      await pool.query(
        'INSERT INTO messages (sender_email, receiver_email, content) VALUES ($1, $2, $3)',
        [sender_email, receiver_email, content]
      );
      await pool.query('INSERT INTO conversations (user1_email,user2_email,last_message,last_sender_email) VALUE ($1,$2,$3,$1)',[sender_email,receiver_email,content]);
      io.to(receiver_email).emit('messageReceived', messageData);
      console.log(`Message sent from ${sender_email} to ${receiver_email}`);
    } catch (error) {
      console.error('Error saving message to database:', error);
    }
  });
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});
// --- API Routes ---

app.get('/', (req, res) => {
  res.send('API is working');
});

app.use('/conversations', conversationRoutes);
app.use('/users', userRoutes);

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

app.get('/messages/between', async (req, res) => {
  console.log('🔎 Raw URL:', req.url);
  console.log('✅ Full query object:', req.query);

  const { user1, user2 } = req.query;
  console.log('📩 user1:', user1);
  console.log('📩 user2:', user2);

  if (!user1 || !user2) {
    console.error('❌ Missing user1 or user2');
    return res.status(400).json({ error: 'Both user1 and user2 are required' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM messages WHERE (sender_email = $1 AND receiver_email = $2) OR (sender_email = $2 AND receiver_email = $1)',
      [user1, user2]
    );
    res.status(200).json({
      message: 'Messages retrieved successfully',
      data: result.rows
    });
  } catch (err) {
    console.error('Error executing /messages/between query:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/messages/:userEmail', async (req, res) => {
  const { userEmail } = req.params;
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
  server.listen(PORT, () => {
    console.log(`🚀 Server + Socket.IO running on port ${PORT}`);
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