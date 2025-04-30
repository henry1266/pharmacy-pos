const mongoose = require("mongoose");
const config = require("config");
const db = config.get("mongoURI");

// Define client options including serverApi
const clientOptions = {
  serverApi: { 
    version: "1", 
    strict: true, 
    deprecationErrors: true 
  },
  connectTimeoutMS: 30000, // Keep increased timeout
  serverSelectionTimeoutMS: 30000 // Keep increased timeout
};

const connectDB = async () => {
  try {
    console.log("嘗試使用 Mongoose 和 serverApi 選項連接到 MongoDB Atlas...");
    // Connect using the URI and clientOptions
    await mongoose.connect(db, clientOptions);
    
    console.log("MongoDB 連接成功...");
  } catch (err) {
    console.error("MongoDB 連接失敗:", err.message);
    // 終止進程，如果連接失敗
    process.exit(1);
  }
};

module.exports = connectDB;

