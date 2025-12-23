require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const User = require('../models/User'); 

const app = express();

// 1. ROBUST CORS (Keep as is, it's correct)
app.use(cors({
  origin: "*", 
  methods: ["GET", "POST", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// 2. SERVERLESS MONGODB CONNECTION (Keep as is, it's correct)
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    const db = await mongoose.connect(process.env.MONGO_URI);
    isConnected = db.connections[0].readyState;
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ Connection Error:", err.message);
  }
};

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// --- ROUTES ---

// Change: Add a leading slash check or use a router to be safe.
// To fix the 404, we define routes BOTH with and without the /api prefix 
// or simply use the version that matches your fetch call exactly.

app.get('/', (req, res) => res.send("🚀 LimitLess Auth API is Live"));

// 1. Sign Up
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword });
    res.status(201).json({ message: "User created" });
  } catch (err) {
    res.status(400).json({ error: "User already exists" });
  }
});

// 2. Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.json({ token, email: user.email });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

// 3. Status Route
app.get('/api/requests', async (req, res) => {
    try {
        const UserRequest = require('../models/UserRequest'); 
        const requests = await UserRequest.find().sort({ createdAt: -1 });
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ error: "Fetch failed" });
    }
});

// 4. Create Resume Request (This was missing in your latest snippet!)
// Ensure this matches your frontend fetch: https://.../api/request-resume
app.post('/api/request-resume', async (req, res) => {
    try {
        const UserRequest = require('../models/UserRequest');
        const { email, linkedinUrl } = req.body;
        const newEntry = new UserRequest({ email, linkedinUrl, status: 'Pending' });
        await newEntry.save();
        res.status(200).json({ message: "Request saved!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to save" });
    }
});

app.patch('/api/requests/:id', async (req, res) => {
    try {
        const UserRequest = require('../models/UserRequest');
        const { id } = req.params;
        const updated = await UserRequest.findByIdAndUpdate(id, { status: 'Sent' }, { new: true });
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ error: "Update failed" });
    }
});

module.exports = app;