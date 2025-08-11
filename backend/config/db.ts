/**
 * @module config/db
 * @description MongoDB數據庫連接配置
 */
import mongoose, { ConnectOptions } from "mongoose";
import config from "config";

/**
 * @description MongoDB連接URI，從配置文件中獲取
 * @type {string}
 */
const db: string = config.get("mongoURI");

/**
 * @description MongoDB客戶端連接選項
 * @type {ConnectOptions}
 */
const clientOptions: ConnectOptions = {
  serverApi: {
    version: "1" as const, // 使用 const 斷言確保version是字面量類型"1"
    strict: true,
    deprecationErrors: true
  },
  connectTimeoutMS: 30000, // 保持增加的超時時間
  serverSelectionTimeoutMS: 30000 // 保持增加的超時時間
};

/**
 * @description 連接到MongoDB數據庫
 * @async
 * @function connectDB
 * @returns {Promise<void>} 連接成功時解析的Promise
 * @throws {Error} 連接失敗時拋出錯誤並終止進程
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

/**
 * @description 導出數據庫連接函數
 */
export default connectDB;