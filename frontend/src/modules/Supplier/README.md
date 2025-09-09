# 供應商管理模組 (Supplier Management Module)

## 📋 概述

供應商管理模組是一個完整的供應商資料管理系統，支援供應商的基本資訊管理、搜尋、匯入匯出、以及會計科目配對功能。該模組採用現代化的 React 架構設計，實現了高度的模組化和可維護性。

## 🏗️ 架構設計

本模組採用了關注點分離的設計原則，將原本的單一大型組件拆分為多個專門負責的模組：

### 核心設計原則
- **單一責任原則**: 每個文件/組件只負責一個明確的職責
- **可重用性**: Hooks 和組件設計為可在其他地方重用
- **可測試性**: 每個單元都可以獨立進行單元測試
- **類型安全**: 完整的 TypeScript 類型支持

## 📁 文件結構

```
frontend/src/modules/Supplier/
├── README.md                    # 本文檔
├── types/
│   └── supplier.types.ts        # 類型定義
├── hooks/
│   ├── useSupplierManagement.ts # 供應商數據管理 Hook
│   ├── useSupplierForm.ts       # 表單狀態管理 Hook
│   ├── useSupplierSearch.ts     # 搜尋邏輯 Hook
│   ├── useSupplierImport.ts     # 匯入邏輯 Hook
│   └── useSnackbar.ts           # 通知管理 Hook
├── components/
│   ├── SupplierFormDialog.tsx   # 供應商表單對話框
│   ├── SupplierImportDialog.tsx # CSV 匯入對話框
│   ├── SupplierActionButtons.tsx# 操作按鈕組件
│   ├── SupplierDetailPanel.tsx  # 供應商詳情面板
│   └── SupplierSnackbar.tsx     # 通知組件
├── config/
│   └── supplierColumns.tsx      # DataGrid 列定義
├── api/
│   └── ...                      # API 相關文件
└── pages/
    └── SuppliersPage.tsx        # 主頁面組件 (178 行)
```

## 🔧 主要組件說明

### Hooks

#### `useSupplierManagement`
- **責任**: 供應商數據的整體管理
- **功能**:
  - 測試模式和生產模式的數據切換
  - 供應商的增刪改查操作
  - 選擇供應商的狀態管理
  - 錯誤處理和狀態同步

#### `useSupplierForm`
- **責任**: 供應商表單的狀態管理
- **功能**:
  - 表單數據的狀態管理
  - 表單驗證邏輯
  - 編輯模式的切換

#### `useSupplierSearch`
- **責任**: 供應商搜尋功能
- **功能**:
  - 即時搜尋過濾
  - 多字段搜尋支持
  - 搜尋結果的狀態管理

#### `useSupplierImport`
- **責任**: CSV 文件匯入功能
- **功能**:
  - 文件選擇和驗證
  - 匯入進度追蹤
  - 錯誤處理和結果顯示

#### `useSnackbar`
- **責任**: 用戶通知管理
- **功能**:
  - 成功/錯誤消息顯示
  - 通知的自動隱藏
  - 測試模式特殊處理

### 組件

#### `SupplierFormDialog`
- **功能**: 供應商信息的編輯和新增
- **特點**:
  - 響應式設計
  - 會計科目配對集成
  - 表單驗證

#### `SupplierImportDialog`
- **功能**: CSV 文件的批量匯入
- **特點**:
  - 文件格式驗證
  - 匯入結果詳細顯示
  - 模板下載功能

#### `SupplierActionButtons`
- **功能**: 頁面操作按鈕組
- **特點**:
  - 搜尋框集成
  - 響應式佈局
  - 測試模式指示

#### `SupplierDetailPanel`
- **功能**: 供應商詳細信息展示
- **特點**:
  - 會計科目配對顯示
  - 導航集成
  - 編輯快捷操作

#### `SupplierSnackbar`
- **功能**: 全局通知顯示
- **特點**:
  - Material-UI 集成
  - 自動隱藏
  - 多種消息類型支持

## 📊 效能提升

### 拆分前後對比
- **拆分前**: 單一文件 797 行
- **拆分後**: 主文件 178 行，總共 12 個專門文件
- **減少比例**: 77.5%
- **編譯狀態**: ✅ 成功通過
- **Bundle 大小**: 1.33 MB (JS) + 9.18 kB (CSS)

### 架構優勢
1. **代碼組織**: 更清晰的文件結構
2. **維護成本**: 降低維護和修改的複雜度
3. **重用性**: 組件和 Hook 可在其他模組重用
4. **測試覆蓋**: 更容易進行單元測試
5. **開發效率**: 並行開發和功能迭代

## 🚀 使用指南

### 基本使用
```tsx
import SuppliersPage from './modules/Supplier/pages/SuppliersPage';

// 在路由中直接使用
<Route path="/suppliers" element={<SuppliersPage />} />
```

### 自定義 Hook 使用
```tsx
import { useSupplierManagement } from './modules/Supplier/hooks/useSupplierManagement';

const MyComponent = () => {
  const {
    suppliers,
    loading,
    handleSaveSupplier,
    handleDeleteSupplier
  } = useSupplierManagement();

  // 使用供應商數據...
};
```

### 組件重用
```tsx
import SupplierFormDialog from './modules/Supplier/components/SupplierFormDialog';

const MyPage = () => {
  return (
    <SupplierFormDialog
      open={dialogOpen}
      onClose={handleClose}
      editMode={isEditing}
      currentSupplierState={supplierData}
      onInputChange={handleInputChange}
      onSave={handleSave}
    />
  );
};
```

## 🧪 測試指南

### Hook 測試
```typescript
import { renderHook } from '@testing-library/react';
import { useSupplierManagement } from './hooks/useSupplierManagement';

test('should load suppliers', () => {
  const { result } = renderHook(() => useSupplierManagement());
  expect(result.current.suppliers).toBeDefined();
});
```

### 組件測試
```typescript
import { render, screen } from '@testing-library/react';
import SupplierFormDialog from './components/SupplierFormDialog';

test('should render form dialog', () => {
  render(<SupplierFormDialog {...props} />);
  expect(screen.getByText('供應商編號')).toBeInTheDocument();
});
```

## 🔧 開發指南

### 添加新功能
1. 確定功能屬於哪個關注點
2. 在對應的 Hook 或組件中實現
3. 更新類型定義（如需要）
4. 添加適當的測試

### 代碼規範
- 使用 TypeScript 進行類型檢查
- 遵循 ESLint 配置
- 組件名稱使用 PascalCase
- Hook 名稱使用 camelCase 並以 `use` 開頭

### 性能優化建議
- 使用 `React.memo` 避免不必要的重新渲染
- 使用 `useCallback` 和 `useMemo` 優化計算
- 合理使用依賴項數組

## 📈 未來擴展

### 計劃功能
- [ ] 供應商分類管理
- [ ] 批量操作支持
- [ ] 進階搜尋和篩選
- [ ] 供應商評價系統
- [ ] 供應商統計報表

### 架構改進
- [ ] GraphQL API 集成
- [ ] 狀態管理庫集成 (Zustand/Redux)
- [ ] 組件庫提取
- [ ] 國際化支持

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request！請確保：
1. 遵循現有的代碼風格
2. 添加適當的測試
3. 更新相關文檔
4. 通過所有測試和編譯檢查

---

## 📝 開發者資訊

**拆分工作完成日期**: 2025-09-03
**原始組件大小**: 797 行
**重構後主組件大小**: 178 行
**總文件數量**: 12 個文件
**編譯狀態**: ✅ 成功

---

**🏆 架構重構完成！**

本次重構成功將一個龐大的單一組件拆分為高度模組化的架構，大幅提升了代碼的可維護性、可測試性和可擴展性。

---

**✍️ 架構設計與代碼重構**

**Expert Full-Stack Architect & Code Quality Coach**

*代碼品質優化，架構設計卓越*

*讓複雜變得簡單，讓簡單變得優雅*

**Kevin Gao** 🏗️⚡