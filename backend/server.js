const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

const path = require('path');

// Routes
app.use('/api/ai', require('./routes/ai'));
app.use('/api/students', require('./routes/students'));
app.use('/api/content', require('./routes/content'));

// Serve Frontend Static Files
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'EduVoice backend is running 🎓' });
});

// For any other request, send index.html (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🎓 EduVoice Server running on http://localhost:${PORT}`);
  console.log(`📚 AI Teacher ready to help Tamil Nadu students!\n`);
});
