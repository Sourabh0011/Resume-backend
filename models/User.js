const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resumes: [{
    fileName: String,
    filePath: String, // Path to where the PDF is stored
    status: { type: String, default: 'Processing' }, // Mock status
    uploadedAt: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('User', UserSchema);