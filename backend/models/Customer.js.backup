const mongoose = require("mongoose");

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
    enum: ["male", "female", "other"]
  },
  medicalHistory: {
    type: String
  },
  allergies: {
    type: [String]
  },
  idCardNumber: { // Replaced points with idCardNumber
    type: String,
    default: ""
  },
  membershipLevel: {
    type: String,
    enum: ["regular", "silver", "gold", "platinum"],
    default: "regular"
  },
  date: {
    type: Date,
    default: Date.now
  },
  note: {
    type: String // Add note field
  }
});

module.exports = mongoose.model("customer", CustomerSchema);

