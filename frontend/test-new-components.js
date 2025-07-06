// 測試新創建的內嵌分錄組件 TypeScript 編譯
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 測試新創建的內嵌分錄組件 TypeScript 編譯...\n');

// 檢查組件文件是否存在
const componentsToCheck = [
  'src/components/accounting2/DoubleEntryFormWithEntries.tsx',
  'src/components/accounting2/TransactionGroupFormWithEntries.tsx'
];

console.log('📁 檢查組件文件是否存在:');
let allFilesExist = true;

componentsToCheck.forEach(componentPath => {
  const fullPath = path.join(__dirname, componentPath);
  const exists = fs.existsSync(fullPath);
  console.log(`  ${exists ? '✅' : '❌'} ${componentPath}`);
  if (!exists) {
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ 部分組件文件不存在，請檢查文件路徑');
  process.exit(1);
}

console.log('\n🔧 執行 TypeScript 編譯檢查...');

try {
  // 執行 TypeScript 編譯檢查
  const result = execSync('npx tsc --noEmit --pretty', {
    cwd: __dirname,
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  console.log('✅ TypeScript 編譯檢查通過！');
  console.log('\n📊 編譯結果:');
  if (result.trim()) {
    console.log(result);
  } else {
    console.log('  沒有編譯錯誤或警告');
  }
  
} catch (error) {
  console.log('❌ TypeScript 編譯檢查失敗！');
  console.log('\n📋 錯誤詳情:');
  console.log(error.stdout || error.message);
  
  // 分析錯誤類型
  const errorOutput = error.stdout || error.message;
  if (errorOutput.includes('Cannot find module')) {
    console.log('\n💡 建議: 檢查模組匯入路徑是否正確');
  }
  if (errorOutput.includes('Type') && errorOutput.includes('is not assignable')) {
    console.log('\n💡 建議: 檢查 TypeScript 類型定義是否匹配');
  }
  if (errorOutput.includes('Property') && errorOutput.includes('does not exist')) {
    console.log('\n💡 建議: 檢查介面定義是否完整');
  }
  
  process.exit(1);
}

console.log('\n🎯 測試完成！新組件 TypeScript 編譯正常。');