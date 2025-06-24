import mongoose from 'mongoose';
import OvertimeRecord from '../models/OvertimeRecord';
import Employee from '../models/Employee';

// 連接到數據庫
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://xinga:xinga@cluster0.mongodb.net/pharmacy-pos?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoURI, {
      serverApi: {
        version: '1' as const,
        strict: true,
        deprecationErrors: true,
      }
    });
    console.log('MongoDB 連接成功');
  } catch (err) {
    console.error('MongoDB 連接失敗:', err);
    process.exit(1);
  }
};

const testOvertimeRecords = async () => {
  await connectDB();
  
  try {
    console.log('=== 測試獨立加班記錄查詢 ===');
    
    // 1. 查詢所有獨立加班記錄
    const allRecords = await OvertimeRecord.find({}).populate('employeeId', 'name');
    console.log(`總共有 ${allRecords.length} 筆獨立加班記錄`);
    
    if (allRecords.length > 0) {
      console.log('前 3 筆記錄:');
      allRecords.slice(0, 3).forEach((record, index) => {
        console.log(`${index + 1}. ID: ${record._id}`);
        console.log(`   員工: ${record.employeeId?.name || '未知'}`);
        console.log(`   日期: ${record.date}`);
        console.log(`   時數: ${record.hours}`);
        console.log(`   狀態: ${record.status}`);
        console.log('---');
      });
    }
    
    // 2. 查詢 2025年5月的記錄
    const startDate = new Date(2025, 4, 1); // 2025年5月1日
    const endDate = new Date(2025, 4, 31, 23, 59, 59); // 2025年5月31日
    
    console.log(`\n=== 查詢 2025年5月 (${startDate.toISOString()} 到 ${endDate.toISOString()}) ===`);
    
    const mayRecords = await OvertimeRecord.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).populate('employeeId', 'name');
    
    console.log(`2025年5月有 ${mayRecords.length} 筆記錄`);
    
    if (mayRecords.length > 0) {
      mayRecords.forEach((record, index) => {
        console.log(`${index + 1}. 員工: ${record.employeeId?.name || '未知'}, 日期: ${record.date}, 時數: ${record.hours}, 狀態: ${record.status}`);
      });
    }
    
    // 3. 按狀態統計
    const statusStats = await OvertimeRecord.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('\n=== 按狀態統計 ===');
    statusStats.forEach(stat => {
      console.log(`${stat._id}: ${stat.count} 筆`);
    });
    
    // 4. 按月份統計
    const monthStats = await OvertimeRecord.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
    
    console.log('\n=== 按月份統計 ===');
    monthStats.forEach(stat => {
      console.log(`${stat._id.year}年${stat._id.month}月: ${stat.count} 筆`);
    });
    
  } catch (error) {
    console.error('查詢失敗:', error);
  } finally {
    await mongoose.disconnect();
    console.log('數據庫連接已關閉');
  }
};

testOvertimeRecords();