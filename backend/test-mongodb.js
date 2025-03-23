const mongoose = require('mongoose');

// 連接到區網MongoDB
const mongoURI = 'mongodb://192.168.68.79:27017/pharmacy-pos';

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

// 連接MongoDB並測試數據寫入
async function testMongoDBConnection() {
  try {
    // 連接MongoDB
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('成功連接到區網MongoDB (192.168.68.79)...');
    
    // 創建測試數據
    const testData = new Test({
      name: '測試數據',
      value: '這是一條測試數據，用於驗證MongoDB寫入功能 - ' + new Date().toISOString()
    });
    
    // 保存測試數據
    const savedData = await testData.save();
    console.log('成功寫入測試數據:');
    console.log(JSON.stringify(savedData, null, 2));
    
    // 查詢所有測試數據
    const allData = await Test.find();
    console.log(`數據庫中共有 ${allData.length} 條測試數據:`);
    allData.forEach(item => {
      console.log(`- ${item.name}: ${item.value} (創建於 ${item.date})`);
    });
    
    console.log('測試完成，MongoDB連接和數據寫入功能正常！');
  } catch (err) {
    console.error('MongoDB連接或數據寫入測試失敗:');
    console.error(err.message);
    if (err.name === 'MongoNetworkError') {
      console.error('無法連接到區網MongoDB服務器，請檢查:');
      console.error('1. MongoDB服務器 (192.168.68.79) 是否正在運行');
      console.error('2. 網絡連接是否正常');
      console.error('3. MongoDB服務器是否允許遠程連接');
      console.error('4. 防火牆設置是否允許連接到端口27017');
    }
  } finally {
    // 關閉連接
    await mongoose.disconnect();
    console.log('MongoDB連接已關閉');
  }
}

// 執行測試
testMongoDBConnection();
