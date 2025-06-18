import axios from 'axios';

/**
 * MongoDB配置介面
 */
interface MongoDBConfig {
  host: string;
  port: number;
  database: string;
}

/**
 * 同步結果介面
 */
interface SyncResult {
  success: boolean;
  message: string;
  [key: string]: any;
}

/**
 * 將MongoDB設定同步到後端
 * @param {string} mongodbIp - MongoDB伺服器IP地址
 * @returns {Promise<SyncResult>} - 同步結果
 */
export const syncMongoDBConfig = async (mongodbIp: string): Promise<SyncResult> => {
  try {
    const config: MongoDBConfig = {
      host: mongodbIp,
      port: 27017,
      database: 'pharmacy-pos'
    };
    
    const response = await axios.post<SyncResult>('/api/config/mongodb', config);
    return response.data;
  } catch (error: any) {
    console.error('同步MongoDB設定失敗:', error);
    throw error;
  }
};

const configSync = {
  syncMongoDBConfig
};

export default configSync;