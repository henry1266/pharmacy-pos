# AccountingDataGrid 配置

## 📋 概述

本目錄包含 AccountingDataGrid 的配置文件，用於定義表格的列配置和其他設置。

## 🏗️ 文件說明

### columns.tsx
定義 DataGrid 的列配置，包括列標題、寬度、渲染方式等。

## 🚀 使用方式

columns.tsx 導出了 `createColumns` 函數，該函數接收一組回調函數，返回列配置數組：

```tsx
import { createColumns } from '@/modules/accounting3/components/ui/AccountingDataGrid/config/columns';

const columns = createColumns({
  onEdit: handleEdit,
  onView: handleView,
  onDelete: handleDelete,
  // 其他回調函數...
});

// 在 DataGrid 中使用
<DataGrid
  columns={columns}
  // 其他屬性...
/>
```

## 🔧 自定義列

如需添加或修改列，可以編輯 columns.tsx 文件：

```tsx
// 添加新列
export const createColumns = (callbacks) => [
  // 現有列...
  
  // 添加新列
  {
    field: 'newField',
    headerName: '新欄位',
    width: 150,
    renderCell: (params) => (
      <div>{params.row.newField}</div>
    )
  }
];
```

## 🎯 設計原則

1. **可配置性**: 列定義應該易於配置和自定義
2. **性能優化**: 列渲染函數應該使用 React.memo 或其他優化技術
3. **一致性**: 保持列樣式和行為的一致性

---

**最後更新**: 2025-08-07  
**維護者**: 開發團隊