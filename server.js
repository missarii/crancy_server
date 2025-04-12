const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Socket.IO setup with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection (direct string)
mongoose.connect('mongodb+srv://missari:missari123@cluster0.2uqs2.mongodb.net/chatapp?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB Atlas'))
.catch((error) => console.error('❌ MongoDB connection error:', error));

// Mongoose models
const User = mongoose.model('User', new mongoose.Schema({ username: String }));
const Message = mongoose.model('Message', new mongoose.Schema({
  sender: String,
  receiver: String,
  content: String,
  timestamp: { type: Date, default: Date.now },
}));

// Google redirect route
app.get('/', (req, res) => {
  res.redirect('https://www.google.com');
});

// API routes
app.post('/login', async (req, res) => {
  const { username } = req.body;
  let user = await User.findOne({ username });
  if (!user) {
    user = new User({ username });
    await user.save();
  }
  res.json(user);
});

app.get('/users', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

app.get('/messages/:sender/:receiver', async (req, res) => {
  const { sender, receiver } = req.params;
  const messages = await Message.find({
    $or: [
      { sender, receiver },
      { sender: receiver, receiver: sender }
    ]
  }).sort({ timestamp: 1 });
  res.json(messages);
});

// Socket.IO handlers
io.on('connection', (socket) => {
  console.log('🔌 Client connected');

  socket.on('send_message', async (data) => {
    const newMsg = new Message(data);
    await newMsg.save();
    io.emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('❎ Client disconnected');
  });
});

// Start server on port 4000
const PORT = 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
