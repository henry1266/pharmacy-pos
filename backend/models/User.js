const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["admin", "pharmacist", "staff"],
    default: "staff"
  },
  // Add a new field to store user-specific settings
  settings: {
    type: mongoose.Schema.Types.Mixed, // Use Mixed type for flexibility
    default: {}
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("user", UserSchema);

