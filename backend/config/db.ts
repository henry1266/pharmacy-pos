import mongoose, { ConnectOptions } from "mongoose";
import config from "config";

// 獲取MongoDB連接URI
const db: string = config.get("mongoURI");

// 定義客戶端選項
const clientOptions: ConnectOptions = {
  serverApi: {
    version: "1" as "1", // 使用類型斷言確保version是字面量類型"1"
    strict: true,
    deprecationErrors: true
  },
  connectTimeoutMS: 30000, // 保持增加的超時時間
  serverSelectionTimeoutMS: 30000 // 保持增加的超時時間
};

/**
 * 連接到MongoDB數據庫
 */
const connectDB = async (): Promise<void> => {
  try {
    console.log("嘗試使用 Mongoose 和 serverApi 選項連接到 MongoDB Atlas...");
    // 使用URI和客戶端選項連接
    await mongoose.connect(db, clientOptions);
    
    console.log("MongoDB 連接成功...");
  } catch (err: any) {
    console.error("MongoDB 連接失敗:", err.message);
    // 終止進程，如果連接失敗
    process.exit(1);
  }
};

export default connectDB;