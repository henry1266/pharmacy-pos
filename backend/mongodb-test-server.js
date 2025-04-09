const mongoose = require('mongoose');
const http = require('http');
const fs = require('fs');
const path = require('path');

// 讀取配置文件
const getMongoDBConfig = () => {
  try {
    // 嘗試讀取配置文件
    const configPath = path.join(__dirname, 'config', 'mongodb.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return config;
    }
  } catch (err) {
    console.error('讀取配置文件失敗:', err);
  }
  
  // 默認配置
  return {
    host: '192.168.68.79',
    port: 27017,
    database: 'pharmacy-pos'
  };
};

// 獲取MongoDB配置
const config = getMongoDBConfig();
const mongoURI = `mongodb://${config.host}:${config.port}/${config.database}`;

// 創建一個簡單的測試模型
const TestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const Test = mongoose.model('test', TestSchema);

// 創建一個簡單的HTTP服務器來顯示測試結果
const server = http.createServer(async (req, res) => {
  // 處理API請求
  if (req.method === 'POST' && req.url === '/api/config/mongodb') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const config = JSON.parse(body);
        
        // 確保目錄存在
        const configDir = path.join(__dirname, 'config');
        if (!fs.existsSync(configDir)) {
          fs.mkdirSync(configDir, { recursive: true });
        }
        
        // 寫入配置文件
        fs.writeFileSync(
          path.join(configDir, 'mongodb.json'),
          JSON.stringify(config, null, 2)
        );
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: '配置已保存' }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: err.message }));
      }
      return;
    });
    return;
  }
  
  // 顯示測試頁面
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  
  res.write('<h1>MongoDB 連接測試</h1>');
  res.write('<pre>');
  
  // 重新讀取配置
  const currentConfig = getMongoDBConfig();
  const currentMongoURI = `mongodb://${currentConfig.host}:${currentConfig.port}/${currentConfig.database}`;
  
  try {
    // 設置較短的超時時間，避免長時間等待
    const connectOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5秒超時
      socketTimeoutMS: 5000
    };
    
    res.write(`嘗試連接到MongoDB (${currentConfig.host})...\n`);
    
    // 連接MongoDB
    await mongoose.connect(currentMongoURI, connectOptions);
    res.write(`成功連接到MongoDB (${currentConfig.host})!\n\n`);
    
    // 創建測試數據
    const testData = new Test({
      name: '測試數據',
      value: '這是一條測試數據，用於驗證MongoDB寫入功能 - ' + new Date().toISOString()
    });
    
    // 保存測試數據
    res.write('嘗試寫入測試數據...\n');
    const savedData = await testData.save();
    res.write('成功寫入測試數據:\n');
    res.write(JSON.stringify(savedData, null, 2) + '\n\n');
    
    // 查詢所有測試數據
    const allData = await Test.find();
    res.write(`數據庫中共有 ${allData.length} 條測試數據:\n`);
    allData.forEach(item => {
      res.write(`- ${item.name}: ${item.value} (創建於 ${item.date})\n`);
    });
    
    res.write('\n測試完成，MongoDB連接和數據寫入功能正常！');
  } catch (err) {
    res.write('MongoDB連接或數據寫入測試失敗:\n');
    res.write(err.message + '\n\n');
    
    if (err.name === 'MongoNetworkError' || err.message.includes('timed out')) {
      res.write(`無法連接到MongoDB服務器 (${currentConfig.host})，可能的原因:\n`);
      res.write(`1. MongoDB服務器 (${currentConfig.host}) 是否正在運行\n`);
      res.write('2. 網絡連接是否正常\n');
      res.write('3. MongoDB服務器是否允許遠程連接\n');
      res.write('4. 防火牆設置是否允許連接到端口27017\n');
      res.write('5. 您的應用是否在同一區網內運行\n\n');
      
      res.write('建議解決方案:\n');
      res.write('1. 確認MongoDB服務器設置允許遠程連接\n');
      res.write('2. 檢查防火牆設置\n');
      res.write('3. 在同一區網內運行應用\n');
      res.write('4. 考慮使用MongoDB Atlas等雲數據庫服務\n');
    }
  } finally {
    // 關閉連接
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      res.write('\nMongoDB連接已關閉');
    }
  }
  
  res.write('</pre>');
  res.end();
});

// 啟動服務器
const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`測試服務器運行在 http://localhost:${PORT}`);
  console.log('請訪問此地址查看MongoDB連接測試結果');
  console.log(`當前MongoDB連接: ${mongoURI}`);
});
