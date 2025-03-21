const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  address: {
    type: String
  },
  birthdate: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  medicalHistory: {
    type: String
  },
  allergies: {
    type: [String]
  },
  points: {
    type: Number,
    default: 0
  },
  membershipLevel: {
    type: String,
    enum: ['regular', 'silver', 'gold', 'platinum'],
    default: 'regular'
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('customer', CustomerSchema);
