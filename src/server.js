require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public'), {
  setHeaders: (res) => {
    res.setHeader('Content-Type-Options', 'nosniff');
  }
}));
// ── Rate limit: max 5 messages per hour per IP ──
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many messages. Please try again in 1 hour.' }
});

// ── Nodemailer (Gmail) ──
const transporter = nodemailer.createTransport({
  host: 'mail.privateemail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((err) => {
  if (err) {
    console.error('❌ Mail connection failed:', err.message);
  } else {
    console.log('✅ Mail server connected and ready!');
  }
});

// ── Input validation ──
function validate(body) {
  const errors = [];
  const { name, email, subject, message } = body;
  if (!name || name.trim().length < 2)    errors.push('Name must be at least 2 characters.');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Enter a valid email address.');
  if (!subject || subject.trim().length < 3) errors.push('Subject must be at least 3 characters.');
  if (!message || message.trim().length < 10) errors.push('Message must be at least 10 characters.');
  if (message && message.trim().length > 2000) errors.push('Message cannot exceed 2000 characters.');
  return errors;
}

// ── POST /api/contact ──
app.post('/api/contact', limiter, async (req, res) => {
  const errors = validate(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors.join(' ') });
  }

  const { name, email, subject, message } = req.body;
  const time = new Date().toLocaleString('en-GB', { timeZone: 'Europe/Skopje' });

  // Email to you (admin)
  const toAdmin = {
    from: `"SportBuddy Contact" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_TO,
    replyTo: email,
    subject: `[SportBuddy] ${subject}`,
    html: `
      <div style="font-family:sans-serif;max-width:580px;margin:0 auto;background:#f5f5f5;padding:20px;border-radius:12px;">
        <div style="background:#1db954;padding:24px 32px;border-radius:10px 10px 0 0;">
          <h2 style="color:#000;margin:0;font-size:20px;">📨 New Contact Message</h2>
          <p style="color:rgba(0,0,0,0.6);margin:4px 0 0;font-size:13px;">sportbuddy.net — Contact Form</p>
        </div>
        <div style="background:#fff;padding:32px;border-radius:0 0 10px 10px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#888;font-size:13px;width:80px;">From:</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-weight:600;">${name}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#888;font-size:13px;">Email:</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;"><a href="mailto:${email}" style="color:#1db954;">${email}</a></td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#888;font-size:13px;">Subject:</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">${subject}</td></tr>
            <tr><td style="padding:10px 0;color:#888;font-size:13px;vertical-align:top;">Message:</td><td style="padding:10px 0;line-height:1.7;color:#333;">${message.replace(/\n/g, '<br>')}</td></tr>
          </table>
          <p style="margin:24px 0 0;color:#aaa;font-size:12px;">Received: ${time} · Hit reply to respond directly to the sender.</p>
        </div>
      </div>
    `,
  };

  // Confirmation email to the user
  const toUser = {
    from: `"SportBuddy" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `We received your message — SportBuddy`,
    html: `
      <div style="font-family:sans-serif;max-width:580px;margin:0 auto;background:#f5f5f5;padding:20px;border-radius:12px;">
        <div style="background:#1db954;padding:24px 32px;border-radius:10px 10px 0 0;">
          <h2 style="color:#000;margin:0;font-size:20px;">✅ Message received!</h2>
        </div>
        <div style="background:#fff;padding:32px;border-radius:0 0 10px 10px;">
          <p style="color:#333;line-height:1.7;margin:0 0 16px;">Hi <strong>${name}</strong>,</p>
          <p style="color:#333;line-height:1.7;margin:0 0 24px;">Thanks for reaching out to SportBuddy! We've received your message and will get back to you within 24 hours.</p>
          <div style="background:#f9fdf9;border-left:4px solid #1db954;border-radius:4px;padding:16px 20px;margin:0 0 24px;">
            <p style="margin:0;color:#555;font-size:14px;"><strong>Your message:</strong><br><em>${message.substring(0, 200)}${message.length > 200 ? '...' : ''}</em></p>
          </div>
          <p style="color:#888;font-size:14px;margin:0;">The SportBuddy Team 🟢</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(toAdmin);
    await transporter.sendMail(toUser);
    console.log(`📬 New message from: ${name} <${email}>`);
    res.json({ success: true, message: 'Message sent successfully!' });
  } catch (err) {
    console.error('❌ Send error:', err.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
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
  console.log(`\n🚀 SportBuddy running on: http://localhost:${PORT}`);
  console.log(`📧 Sending to: ${process.env.EMAIL_TO || '⚠️  not set'}\n`);
});

