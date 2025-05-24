const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    enum: ["male", "female"],
    required: true
  },
  birthDate: {
    type: Date,
    required: true
  },
  idNumber: {
    type: String,
    required: true,
    unique: true
  },
  education: {
    type: String
  },
  nativePlace: {
    type: String
  },
  address: {
    type: String,
    required: true
  },
  phone: {
    type: String
  },
  position: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  hireDate: {
    type: Date,
    required: true
  },
  salary: {
    type: Number
  },
  insuranceDate: {
    type: Date
  },
  experience: {
    type: String
  },
  rewards: {
    type: String
  },
  injuries: {
    type: String
  },
  additionalInfo: {
    type: String
  },
  idCardFront: {
    type: String // 存儲圖片路徑或URL
  },
  idCardBack: {
    type: String // 存儲圖片路徑或URL
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("employee", EmployeeSchema);
