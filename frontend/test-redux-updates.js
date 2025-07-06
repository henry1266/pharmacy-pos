const { execSync } = require('child_process');

console.log('🔍 測試 Redux 狀態管理更新...');

try {
  // 1. 檢查 TypeScript 編譯
  console.log('\n📋 1. 檢查 TypeScript 編譯...');
  const result = execSync('npx tsc --noEmit --project frontend/tsconfig.json', { 
    encoding: 'utf8', 
    cwd: 'd:/pharmacy-pos',
    stdio: 'pipe'
  });
  console.log('✅ TypeScript 編譯成功');
  
  // 2. 檢查新增的文件是否存在
  console.log('\n📋 2. 檢查新增的 Redux 文件...');
  const fs = require('fs');
  const path = require('path');
  
  const filesToCheck = [
    'frontend/src/redux/actionTypes.ts',
    'frontend/src/redux/transactionGroupWithEntriesActions.ts',
    'frontend/src/redux/reducers.ts',
    'frontend/src/redux/store.ts',
    'frontend/src/redux/actions.ts'
  ];
  
  filesToCheck.forEach(file => {
    const fullPath = path.join('d:/pharmacy-pos', file);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${file} 存在`);
    } else {
      console.log(`❌ ${file} 不存在`);
    }
  });
  
  // 3. 檢查 Action Types 是否正確定義
  console.log('\n📋 3. 檢查 Action Types 定義...');
  const actionTypesContent = fs.readFileSync('d:/pharmacy-pos/frontend/src/redux/actionTypes.ts', 'utf8');
  
  const requiredActionTypes = [
    'FETCH_TRANSACTION_GROUPS_WITH_ENTRIES_REQUEST',
    'CREATE_TRANSACTION_GROUP_WITH_ENTRIES_SUCCESS',
    'UPDATE_TRANSACTION_GROUP_WITH_ENTRIES_FAILURE',
    'DELETE_TRANSACTION_GROUP_WITH_ENTRIES_REQUEST',
    'VALIDATE_BALANCE_SUCCESS',
    'FETCH_FUNDING_CHAIN_REQUEST'
  ];
  
  requiredActionTypes.forEach(actionType => {
    if (actionTypesContent.includes(actionType)) {
      console.log(`✅ ${actionType} 已定義`);
    } else {
      console.log(`❌ ${actionType} 未定義`);
    }
  });
  
  // 4. 檢查 Reducer 是否正確註冊
  console.log('\n📋 4. 檢查 Reducer 註冊...');
  const storeContent = fs.readFileSync('d:/pharmacy-pos/frontend/src/redux/store.ts', 'utf8');
  
  if (storeContent.includes('transactionGroupWithEntriesReducer')) {
    console.log('✅ transactionGroupWithEntriesReducer 已註冊到 store');
  } else {
    console.log('❌ transactionGroupWithEntriesReducer 未註冊到 store');
  }
  
  if (storeContent.includes('transactionGroupWithEntries: transactionGroupWithEntriesReducer')) {
    console.log('✅ transactionGroupWithEntries 狀態已配置');
  } else {
    console.log('❌ transactionGroupWithEntries 狀態未配置');
  }
  
  // 5. 檢查 Actions 匯出
  console.log('\n📋 5. 檢查 Actions 匯出...');
  const actionsContent = fs.readFileSync('d:/pharmacy-pos/frontend/src/redux/actions.ts', 'utf8');
  
  const requiredExports = [
    'fetchTransactionGroupsWithEntries',
    'createTransactionGroupWithEntries',
    'updateTransactionGroupWithEntries',
    'deleteTransactionGroupWithEntries',
    'validateBalance'
  ];
  
  requiredExports.forEach(exportName => {
    if (actionsContent.includes(exportName)) {
      console.log(`✅ ${exportName} 已匯出`);
    } else {
      console.log(`❌ ${exportName} 未匯出`);
    }
  });
  
  // 6. 檢查 RootState 類型定義
  console.log('\n📋 6. 檢查 RootState 類型定義...');
  const reducersContent = fs.readFileSync('d:/pharmacy-pos/frontend/src/redux/reducers.ts', 'utf8');
  
  if (reducersContent.includes('TransactionGroupWithEntriesState')) {
    console.log('✅ TransactionGroupWithEntriesState 介面已定義');
  } else {
    console.log('❌ TransactionGroupWithEntriesState 介面未定義');
  }
  
  if (reducersContent.includes('transactionGroupWithEntries: TransactionGroupWithEntriesState')) {
    console.log('✅ transactionGroupWithEntries 已加入 RootState');
  } else {
    console.log('❌ transactionGroupWithEntries 未加入 RootState');
  }
  
  console.log('\n🎉 Redux 狀態管理更新測試完成！');
  
} catch (error) {
  console.log('\n❌ 測試過程中發生錯誤:');
  console.log('錯誤詳情:', error.message);
  
  if (error.stdout) {
    console.log('\n編譯輸出:');
    const lines = error.stdout.split('\n');
    const relevantLines = lines.filter(line => 
      line.includes('error TS') || 
      line.includes('transactionGroupWithEntries') ||
      line.includes('TransactionGroupWithEntries')
    ).slice(0, 10);
    console.log(relevantLines.join('\n'));
  }
}