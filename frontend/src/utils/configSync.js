import axios from 'axios';

/**
 * 將MongoDB設定同步到後端
 * @param {string} mongodbIp - MongoDB伺服器IP地址
 * @returns {Promise<Object>} - 同步結果
 */
export const syncMongoDBConfig = async (mongodbIp) => {
  try {
    const config = {
      host: mongodbIp,
      port: 27017,
      database: 'pharmacy-pos'
    };
    
    const response = await axios.post('/api/config/mongodb', config);
    return response.data;
  } catch (error) {
    console.error('同步MongoDB設定失敗:', error);
    throw error;
  }
};

export default {
  syncMongoDBConfig
};
