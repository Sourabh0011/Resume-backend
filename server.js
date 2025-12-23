const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const User = require('./models/User');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Make uploads folder public

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ Connection Error:", err));

// --- MULTER SETUP (File Upload) ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// --- AUTH ROUTES ---

// 1. Sign Up
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({ email, password: hashedPassword });
    res.status(201).json({ message: "User created" });
  } catch (err) {
    res.status(400).json({ error: "User already exists" });
  }
});

// 2. Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ token, email: user.email });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// --- PROTECTED UPLOAD ROUTE ---
app.post('/api/upload', upload.single('resume'), async (req, res) => {
  const { email } = req.body; // In production, get this from JWT
  try {
    const user = await User.findOneAndUpdate(
      { email },
      { $push: { resumes: { fileName: req.file.originalname, filePath: req.file.path } } },
      { new: true }
    );
    res.json({ message: "PDF Uploaded! Our AI (Claude) is processing it.", user });
  } catch (err) {
    res.status(500).json({ error: "Upload failed" });
  }
});

app.listen(5000, () => console.log("🚀 Server running on port 5000"));