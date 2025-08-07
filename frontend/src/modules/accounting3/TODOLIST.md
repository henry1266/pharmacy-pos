# `/accounting3/transaction` 性能優化 TODO LIST

## 前端優化

### 立即優化項目
- [x] 移除 `AccountingDataGridWithEntries3.tsx` 中多餘的平板小螢幕判斷
- [x] 實現 DataGrid 虛擬化滾動
  ```tsx
  <DataGrid
    // 現有配置...
    rowBuffer={10} // 優化虛擬滾動，減少預渲染的行數
  />
  ```
- [x] 移除或簡化行動畫效果
  ```tsx
  // 簡化行樣式，移除動畫相關樣式
  '& .MuiDataGrid-row': {
    bgcolor: 'background.paper'
  }

### 中期優化項目

- [ ] 使用 `useMemo` 記憶化複雜計算結果

  ```tsx
  // 優化 renderIntegratedFundingStatus 函數
  const memoizedFundingStatus = useMemo(() => 
    renderIntegratedFundingStatus(group), 
    [group._id, group.referencedByInfo, group.fundingSourceUsages]
  );
  ```

- [ ] 使用 `useCallback` 記憶化事件處理函數
- [ ] 添加 debounce 處理搜索輸入

  ```tsx
  // 添加 debounce 處理搜索
  const debouncedSearch = useDebounce(filter.search, 500);
  
  useEffect(() => {
    // 使用 debouncedSearch 而不是 filter.search
    // ...
  }, [debouncedSearch, /* 其他依賴 */]);
  ```
  
- [x] 優化 `TransactionPage.tsx` 中的數據加載邏輯
  ```tsx
  // 分離數據獲取邏輯
  const loadInitialData = useCallback(async () => {
    // 使用 Promise.all 並行加載數據
    await Promise.all([
      dispatch(fetchTransactionGroupsWithEntries() as any),
      dispatch(fetchAccounts2() as any),
      dispatch(fetchOrganizations2() as any)
    ]);
  }, [dispatch]);
  
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);
  ```
- [x] 移除開發環境日誌輸出（生產環境）
  ```tsx
  // 使用條件日誌
  if (process.env.NODE_ENV === 'development') {
    console.log('開發環境日誌');
  }
  ```

## 後端優化

### 立即優化項目
- [x] 實現真正的分頁機制
  ```javascript
  // 前端實現
  <DataGrid
    pagination
    paginationMode="server"
    page={filter.page - 1} // DataGrid 頁碼從 0 開始，而 API 從 1 開始
    pageSize={filter.limit}
    onPageChange={(newPage) => handleFilterChange('page', newPage + 1)}
    onPageSizeChange={(newPageSize) => handleFilterChange('limit', newPageSize)}
    rowCount={pagination?.total || 0} // 使用後端返回的總記錄數
    rowsPerPageOptions={[25, 50, 100]}
    initialState={{
      pagination: {
        pageSize: 25,
      },
    }}
  />
  
  // API 請求
  const params = {
    organizationId,
    page: filter.page,
    limit: filter.limit // 默認為 25
  };
  ```
- [ ] 實現數據投影，只返回列表視圖所需字段
  ```javascript
  // 列表視圖只返回必要字段
  const listFields = {
    _id: 1,
    description: 1,
    transactionDate: 1,
    organizationId: 1,
    status: 1,
    groupNumber: 1,
    totalAmount: 1,
    // 不返回完整的 entries 數組
    entries: { $slice: 2 } // 只返回前兩個分錄用於顯示流向
  };
  ```

### 中期優化項目
- [ ] 優化數據庫索引
  ```javascript
  // 為常用查詢字段添加索引
  db.transactionGroups.createIndex({ organizationId: 1, transactionDate: -1 });
  db.transactionGroups.createIndex({ status: 1 });
  db.transactionGroups.createIndex({ description: "text", invoiceNo: "text", groupNumber: "text" });
  ```
- [ ] 實現數據緩存
  ```javascript
  // 使用 Redis 緩存查詢結果
  const getCachedTransactions = async (query, page, limit) => {
    const cacheKey = `transactions:${JSON.stringify(query)}:${page}:${limit}`;
    
    // 嘗試從緩存獲取
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // 從數據庫獲取
    const result = await fetchTransactionsFromDB(query, page, limit);
    
    // 存入緩存，設置過期時間
    await redisClient.set(cacheKey, JSON.stringify(result), 'EX', 300); // 5分鐘過期
    
    return result;
  };
  ```
- [ ] 批量獲取相關數據
  ```javascript
  // 創建複合 API 端點，一次返回多種數據
  router.get('/accounting-dashboard', async (req, res) => {
    // 並行獲取多種數據
    const [transactions, accounts, organizations] = await Promise.all([
      getTransactions(req.query),
      getAccounts(),
      getOrganizations()
    ]);
    
    res.json({
      transactions,
      accounts,
      organizations
    });
  });
  ```
- [ ] 優化 API 響應壓縮
  ```javascript
  // 啟用 GZIP 壓縮
  app.use(compression());
  ```

## 監控與測試
- [ ] 添加前端性能監控
- [ ] 添加後端 API 性能監控
- [ ] 進行負載測試，確認優化效果