require('dotenv').config();
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const userRoutes = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');
const { initSocket } = require('./socket');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors({ origin: 'https://mongchat.netlify.app' }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);

// Basic health check route
app.get('/', (req, res) => {
  res.json({
    message: 'Server is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    databaseState: mongoose.connection.readyState
  });
});

// 404 for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// Central error handler (Express 5 forwards async errors here)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || 'Server error.';
  if (err.name === 'ValidationError' || err.name === 'CastError') status = 400;
  if (status === 500) {
    console.error(err);
    message = 'Server error.';
  }
  res.status(status).json({ success: false, message });
});

// Realtime (Socket.IO) on the same HTTP server
initSocket(server);

// Connect to MongoDB
if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in .env file');
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI, {
    dbName: process.env.DB_NAME || 'chatapp',
  })
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected.');
});
