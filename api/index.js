require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const UserRequest = require('../models/UserRequest');

const app = express();

// Middleware
app.use(cors({
  origin: "*", // This allows all websites to access the API - best for testing
  methods: ["POST", "GET", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// 1. Connect to MongoDB Atlas
const dbURI = process.env.MONGO_URI;
if (!dbURI) {
    console.error("❌ ERROR: MONGO_URI is missing in .env file.");
    process.exit(1);
}

mongoose.connect(dbURI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB Error:', err.message));

// --- ROUTES ---

// A. Create New Request (Called by Frontend Form)
app.post('/api/request-resume', async (req, res) => {
    try {
        const { email, linkedinUrl } = req.body;
        
        // Save to Database - Status defaults to 'Pending'
        const newEntry = new UserRequest({ email, linkedinUrl, status: 'Pending' });
        await newEntry.save();

        res.status(200).json({ message: "Request saved to database!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to save request" });
    }
});

// B. Get All Requests (For your Stylish Dashboard)
app.get('/api/requests', async (req, res) => {
    try {
        const requests = await UserRequest.find().sort({ createdAt: -1 });
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch requests" });
    }
});

// C. Update Status (To mark as "Sent" from the dashboard)
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

const PORT = process.env.PORT || 5000;
module.exports = app;