const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const { exec } = require('child_process'); // <-- Add this line

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

app.use(cors());
app.use(express.json());

// MongoDB Atlas connection
mongoose.connect('mongodb+srv://missari:missari123@cluster0.2uqs2.mongodb.net/chatapp?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch((error) => console.error('MongoDB connection error:', error));

// Define User and Message schemas
const UserSchema = new mongoose.Schema({ username: String });
const MessageSchema = new mongoose.Schema({
  sender: String,
  receiver: String,
  content: String,
  timestamp: { type: Date, default: Date.now },
});

const User = mongoose.model('User', UserSchema);
const Message = mongoose.model('Message', MessageSchema);

// Login route (POST)
app.post('/login', async (req, res) => {
  const { username } = req.body;
  let user = await User.findOne({ username });
  if (!user) {
    user = new User({ username });
    await user.save();
  }
  res.json(user);
});

// Get all users
app.get('/users', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// Get messages between two users
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

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');

  // Handle sending messages
  socket.on('send_message', async (data) => {
    const newMsg = new Message(data);
    await newMsg.save();
    io.emit('receive_message', data);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start the server
server.listen(3000, () => {
  console.log('Backend running on http://localhost:3000');

  // Open Google in a new tab (works on macOS, Windows, and Linux)
  const url = 'https://www.google.com';

  // Windows
  if (process.platform === 'win32') {
    exec(`start ${url}`);
  }
  // macOS
  else if (process.platform === 'darwin') {
    exec(`open ${url}`);
  }
  // Linux
  else if (process.platform === 'linux') {
    exec(`xdg-open ${url}`);
  }
});
