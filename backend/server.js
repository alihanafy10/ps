require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// Store io in app to use it in controllers
app.set('io', io);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Clients must emit a 'joinLounge' event with their loungeId after connecting
  socket.on('joinLounge', (loungeId) => {
    socket.join(loungeId);
    console.log(`Socket ${socket.id} joined lounge ${loungeId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/devices', require('./routes/deviceRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/sessions', require('./routes/sessionRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/lounges', require('./routes/loungeRoutes'));
app.use('/api/shifts', require('./routes/shiftRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/public', require('./routes/publicRoutes'));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
