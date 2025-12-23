require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const UserRequest = require('../models/UserRequest');

const app = express();

// 1. ROBUST CORS FOR VERCEL
app.use(cors({
  origin: "*", 
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

app.use(express.json());

// 2. SERVERLESS MONGODB CONNECTION
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    // Note: process.env.MONGO_URI must be set in Vercel Dashboard
    const db = await mongoose.connect(process.env.MONGO_URI);
    isConnected = db.connections[0].readyState;
    console.log('✅ Connected to MongoDB Atlas');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
  }
};

// Middleware to ensure DB is connected
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// --- ROUTES ---
// We remove the "/api" prefix inside the routes because 
// vercel.json handles the "/api" routing for us.

// Root route 
app.get('/', (req, res) => {
  res.status(200).send("🚀 LimitLess API is Live");
});

// A. Create New Request
app.post('/request-resume', async (req, res) => {
    try {
        const { email, linkedinUrl } = req.body;
        if (!email || !linkedinUrl) {
            return res.status(400).json({ error: "Required fields missing" });
        }
        const newEntry = new UserRequest({ email, linkedinUrl, status: 'Pending' });
        await newEntry.save();
        res.status(200).json({ message: "Request saved!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// B. Get All Requests
app.get('/requests', async (req, res) => {
    try {
        const requests = await UserRequest.find().sort({ createdAt: -1 });
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ error: "Fetch failed" });
    }
});

// C. Update Status
app.patch('/requests/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const updatedRequest = await UserRequest.findByIdAndUpdate(
            id, 
            { status: status || 'Sent' }, 
            { new: true }
        );
        res.status(200).json(updatedRequest);
    } catch (error) {
        res.status(500).json({ error: "Update failed" });
    }
});

module.exports = app;