# 藥局POS系統

這是一個專為藥局設計的POS（銷售點）系統，提供藥品管理、供應商管理、銷售和庫存追蹤等功能。

## 安裝說明

### 後端安裝
```bash
cd backend
npm install
npm run server
```

### 前端安裝
```bash
cd frontend
npm install
npm start
```

## 功能特點

### 供應商管理
- 添加、編輯和刪除供應商
- CSV批量匯入供應商數據
- 詳細的供應商信息管理

### 產品管理
- 支持商品和藥品兩種產品類型
- 商品：包含國際條碼等特有屬性
- 藥品：包含健保碼、健保價等特有屬性
- 產品庫存管理

### 銷售功能
- 簡易銷售界面
- 銷售記錄追蹤
- 銷售報表

## 使用指南

### 供應商CSV匯入
1. 在「供應商管理」頁面點擊「匯入CSV」按鈕
2. 下載CSV模板或按照以下格式準備CSV文件：
   - 必填欄位：shortCode(簡碼), name(供應商名稱)
   - 可選欄位：code(供應商編號), contactPerson(聯絡人), phone(電話), email(電子郵件), address(地址), taxId(稅號), paymentTerms(付款條件), notes(備註)
3. 上傳CSV文件並點擊「匯入」按鈕
4. 查看匯入結果摘要

