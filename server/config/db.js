const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');

const connectDB = async () => {
  try {
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('MongoDB 連接成功...');
  } catch (err) {
    console.error('MongoDB 連接失敗:', err.message);
    // 終止進程，如果連接失敗
    process.exit(1);
  }
};

module.exports = connectDB;
