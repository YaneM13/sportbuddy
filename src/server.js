require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const MESSAGES_FILE = path.join(__dirname, '../data/messages.json');

// ── Ensure data directory exists ──
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(MESSAGES_FILE)) fs.writeFileSync(MESSAGES_FILE, '[]');

// ── Trust proxy (Railway) ──
app.set('trust proxy', 1);

// ── Middleware ──
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ── Rate limit ──
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many messages. Please try again in 1 hour.' }
});

// ── Input validation ──
function validate(body) {
  const errors = [];
  const { name, email, subject, message } = body;
  if (!name || name.trim().length < 2) errors.push('Name must be at least 2 characters.');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Enter a valid email address.');
  if (!subject || subject.trim().length < 3) errors.push('Subject must be at least 3 characters.');
  if (!message || message.trim().length < 10) errors.push('Message must be at least 10 characters.');
  if (message && message.trim().length > 2000) errors.push('Message cannot exceed 2000 characters.');
  return errors;
}

// ── POST /api/contact ──
app.post('/api/contact', limiter, (req, res) => {
  const errors = validate(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors.join(' ') });
  }

  const { name, email, subject, message } = req.body;
  const newMessage = {
    id: Date.now(),
    name: name.trim(),
    email: email.trim(),
    subject: subject.trim(),
    message: message.trim(),
    time: new Date().toISOString(),
    read: false
  };

  try {
    const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
    messages.unshift(newMessage);
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
    console.log(`New message from: ${name} <${email}>`);
    res.json({ success: true, message: 'Message sent successfully!' });
  } catch (err) {
    console.error('Save error:', err.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// ── GET /api/messages (Admin only) ──
app.get('/api/messages', (req, res) => {
  const adminPass = req.headers['x-admin-pass'];
  if (adminPass !== process.env.ADMIN_PASS) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  try {
    const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error reading messages.' });
  }
});

// ── DELETE /api/messages/:id (Admin only) ──
app.delete('/api/messages/:id', (req, res) => {
  const adminPass = req.headers['x-admin-pass'];
  if (adminPass !== process.env.ADMIN_PASS) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  try {
    const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
    const filtered = messages.filter(m => m.id !== parseInt(req.params.id));
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(filtered, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting message.' });
  }
});

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', site: 'sportbuddy.net', time: new Date().toISOString() });
});

// ── Serve frontend ──
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 SportBuddy running on: http://localhost:${PORT}\n`);
});
