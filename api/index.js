require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const UserRequest = require('../models/UserRequest');

const app = express();

// 1. IMPROVED CORS CONFIGURATION
// Since you are using a custom domain, explicitly allowing it is safer.
app.use(cors({
  origin: ["https://resume.sourabh.info", "https://resume-backend-umber.vercel.app"],
  methods: ["POST", "GET", "PATCH", "OPTIONS"],
  credentials: true
}));

app.use(express.json());

// 2. MONGODB CONNECTION (Serverless Optimized)
// In Vercel, we connect once and reuse the connection to avoid "too many connections" errors.
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    const db = await mongoose.connect(process.env.MONGO_URI);
    isConnected = db.connections[0].readyState;
    console.log('✅ Connected to MongoDB Atlas');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
  }
};

// Middleware to ensure DB is connected before processing any request
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// --- ROUTES ---

// Root route to verify API status
app.get('/', (req, res) => {
  res.status(200).send("🚀 LimitLess API is Live and Connected");
});

// A. Create New Request
app.post('/api/request-resume', async (req, res) => {
    try {
        const { email, linkedinUrl } = req.body;
        if (!email || !linkedinUrl) {
            return res.status(400).json({ error: "Email and LinkedIn URL are required" });
        }
        
        const newEntry = new UserRequest({ email, linkedinUrl, status: 'Pending' });
        await newEntry.save();

        res.status(200).json({ message: "Request saved to database!" });
    } catch (error) {
        console.error("POST Error:", error);
        res.status(500).json({ error: "Failed to save request" });
    }
});

// B. Get All Requests
app.get('/api/requests', async (req, res) => {
    try {
        const requests = await UserRequest.find().sort({ createdAt: -1 });
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch requests" });
    }
});

// C. Update Status
app.patch('/api/requests/:id', async (req, res) => {
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
        res.status(500).json({ error: "Failed to update status" });
    }
});

// Export the app for Vercel
module.exports = app;