// UserRequest.js
const mongoose = require('mongoose');

const UserRequestSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true 
  },
  linkedinUrl: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    default: 'Pending' // This helps you track which ones you've finished
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('UserRequest', UserRequestSchema);