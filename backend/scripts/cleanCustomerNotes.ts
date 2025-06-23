import mongoose from 'mongoose';
import config from 'config';
import Customer from '../models/Customer';

/**
 * 清理客戶備註欄位中被錯誤混入的資料
 * 這個腳本會：
 * 1. 找出備註欄位中包含 "會員等級:", "身分證:", "病史:", "過敏:" 的記錄
 * 2. 解析這些資訊並將其移到正確的欄位
 * 3. 清理備註欄位，只保留真正的備註內容
 */

interface ParsedInfo {
  membershipLevel?: string;
  idCardNumber?: string;
  medicalHistory?: string;
  allergies?: string;
  cleanNotes?: string;
}

/**
 * 解析被污染的備註內容
 */
function parseContaminatedNotes(notes: string): ParsedInfo {
  const result: ParsedInfo = {};
  const lines = notes.split('\n');
  const cleanNotesLines: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('會員等級: ')) {
      result.membershipLevel = trimmedLine.replace('會員等級: ', '').trim();
    } else if (trimmedLine.startsWith('身分證: ')) {
      result.idCardNumber = trimmedLine.replace('身分證: ', '').trim();
    } else if (trimmedLine.startsWith('病史: ')) {
      result.medicalHistory = trimmedLine.replace('病史: ', '').trim();
    } else if (trimmedLine.startsWith('過敏: ')) {
      result.allergies = trimmedLine.replace('過敏: ', '').trim();
    } else if (trimmedLine) {
      // 這是真正的備註內容
      cleanNotesLines.push(trimmedLine);
    }
  }

  result.cleanNotes = cleanNotesLines.join('\n').trim() ?? undefined;
  return result;
}

/**
 * 連接到 MongoDB 資料庫
 */
async function connectToDatabase(): Promise<void> {
  const mongoURI: string = config.get('mongoURI');
  await mongoose.connect(mongoURI, {
    serverApi: {
      version: "1" as const,
      strict: true,
      deprecationErrors: true
    },
    connectTimeoutMS: 30000,
    serverSelectionTimeoutMS: 30000
  });
  console.log('✅ 已連接到 MongoDB');
}

/**
 * 查找被污染的客戶資料
 */
async function findContaminatedCustomers() {
  return await Customer.find({
    notes: {
      $regex: /(會員等級:|身分證:|病史:|過敏:)/,
      $options: 'i'
    }
  });
}

/**
 * 準備客戶更新資料
 */
function prepareCustomerUpdateData(parsedInfo: ParsedInfo, customer: any): any {
  const updateData: any = {};
  
  // 只更新有值的欄位，避免覆蓋現有正確資料
  if (parsedInfo.membershipLevel && !customer.membershipLevel) {
    updateData.membershipLevel = parsedInfo.membershipLevel;
  }
  if (parsedInfo.idCardNumber && !customer.idCardNumber) {
    updateData.idCardNumber = parsedInfo.idCardNumber;
  }
  if (parsedInfo.medicalHistory && !customer.medicalHistory) {
    updateData.medicalHistory = parsedInfo.medicalHistory;
  }
  if (parsedInfo.allergies && (!customer.allergies || customer.allergies.length === 0)) {
    updateData.allergies = [parsedInfo.allergies];
  }
  
  // 更新清理後的備註
  updateData.notes = parsedInfo.cleanNotes ?? '';
  
  return updateData;
}

/**
 * 記錄客戶清理結果
 */
function logCustomerCleaningResult(customer: any, updateData: any): void {
  console.log(`✅ 已清理客戶: ${customer.name}`);
  console.log(`   清理後備註: ${updateData.notes ?? '(空白)'}`);
  if (updateData.membershipLevel) console.log(`   會員等級: ${updateData.membershipLevel}`);
  if (updateData.idCardNumber) console.log(`   身分證: ${updateData.idCardNumber}`);
  if (updateData.medicalHistory) console.log(`   病史: ${updateData.medicalHistory}`);
  if (updateData.allergies) console.log(`   過敏: ${updateData.allergies.join(', ')}`);
}

/**
 * 處理單個客戶的清理
 */
async function processCustomerCleaning(customer: any): Promise<boolean> {
  try {
    console.log(`\n🔧 處理客戶: ${customer.name} (${customer.code})`);
    console.log(`原始備註: ${customer.notes}`);

    // 解析被污染的備註
    const parsedInfo = parseContaminatedNotes(customer.notes ?? '');
    
    // 準備更新資料
    const updateData = prepareCustomerUpdateData(parsedInfo, customer);

    // 執行更新
    await Customer.findByIdAndUpdate(customer._id, updateData);
    
    // 記錄結果
    logCustomerCleaningResult(customer, updateData);
    
    return true;
  } catch (error) {
    console.error(`❌ 處理客戶 ${customer.name} 時發生錯誤:`, error);
    return false;
  }
}

/**
 * 記錄清理統計結果
 */
function logCleaningStatistics(cleanedCount: number, errorCount: number, totalCount: number): void {
  console.log(`\n📊 清理完成統計:`);
  console.log(`   成功清理: ${cleanedCount} 筆`);
  console.log(`   發生錯誤: ${errorCount} 筆`);
  console.log(`   總計處理: ${totalCount} 筆`);
}

/**
 * 主要清理函數
 */
async function cleanCustomerNotes() {
  try {
    // 連接資料庫
    await connectToDatabase();

    // 找出所有包含被污染備註的客戶
    const contaminatedCustomers = await findContaminatedCustomers();

    console.log(`🔍 找到 ${contaminatedCustomers.length} 筆被污染的客戶資料`);

    if (contaminatedCustomers.length === 0) {
      console.log('✅ 沒有發現被污染的資料，無需清理');
      return;
    }

    let cleanedCount = 0;
    let errorCount = 0;

    // 逐一處理每個被污染的客戶
    for (const customer of contaminatedCustomers) {
      const success = await processCustomerCleaning(customer);
      if (success) {
        cleanedCount++;
      } else {
        errorCount++;
      }
    }

    // 記錄統計結果
    logCleaningStatistics(cleanedCount, errorCount, contaminatedCustomers.length);

  } catch (error) {
    console.error('❌ 清理過程中發生錯誤:', error);
  } finally {
    // 關閉資料庫連接
    await mongoose.disconnect();
    console.log('🔌 已斷開 MongoDB 連接');
  }
}

/**
 * 預覽模式 - 只顯示會被清理的資料，不實際執行
 */
async function previewCleanup() {
  try {
    // 連接資料庫
    const mongoURI: string = config.get('mongoURI');
    await mongoose.connect(mongoURI, {
      serverApi: {
        version: "1" as const,
        strict: true,
        deprecationErrors: true
      },
      connectTimeoutMS: 30000,
      serverSelectionTimeoutMS: 30000
    });
    console.log('✅ 已連接到 MongoDB (預覽模式)');

    // 找出所有包含被污染備註的客戶
    const contaminatedCustomers = await Customer.find({
      notes: {
        $regex: /(會員等級:|身分證:|病史:|過敏:)/,
        $options: 'i'
      }
    });

    console.log(`🔍 預覽: 找到 ${contaminatedCustomers.length} 筆被污染的客戶資料\n`);

    // 顯示前 5 筆作為預覽
    const previewCount = Math.min(5, contaminatedCustomers.length);
    for (let i = 0; i < previewCount; i++) {
      const customer = contaminatedCustomers[i];
      console.log(`📋 客戶 ${i + 1}: ${customer.name} (${customer.code})`);
      console.log(`   原始備註: ${customer.notes}`);
      
      const parsedInfo = parseContaminatedNotes(customer.notes ?? '');
      console.log(`   解析結果:`);
      console.log(`     清理後備註: ${parsedInfo.cleanNotes || '(空白)'}`);
      if (parsedInfo.membershipLevel) console.log(`     會員等級: ${parsedInfo.membershipLevel}`);
      if (parsedInfo.idCardNumber) console.log(`     身分證: ${parsedInfo.idCardNumber}`);
      if (parsedInfo.medicalHistory) console.log(`     病史: ${parsedInfo.medicalHistory}`);
      if (parsedInfo.allergies) console.log(`     過敏: ${parsedInfo.allergies}`);
      console.log('');
    }

    if (contaminatedCustomers.length > previewCount) {
      console.log(`... 還有 ${contaminatedCustomers.length - previewCount} 筆資料`);
    }

  } catch (error) {
    console.error('❌ 預覽過程中發生錯誤:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 已斷開 MongoDB 連接');
  }
}

// 主程式
async function main() {
  const args = process.argv.slice(2);
  const isPreview = args.includes('--preview') || args.includes('-p');

  console.log('🧹 客戶備註欄位清理工具');
  console.log('================================');

  if (isPreview) {
    console.log('📋 執行預覽模式...\n');
    await previewCleanup();
  } else {
    console.log('⚠️  即將執行實際清理，這會修改資料庫資料！');
    console.log('💡 如需預覽，請使用: npm run clean-customer-notes -- --preview\n');
    
    // 給用戶 5 秒時間取消
    console.log('⏰ 5 秒後開始清理...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await cleanCustomerNotes();
  }
}

// 執行主程式
if (require.main === module) {
  main().catch(console.error);
}

export { cleanCustomerNotes, previewCleanup };