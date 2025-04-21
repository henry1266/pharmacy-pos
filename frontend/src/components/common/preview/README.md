# 通用預覽組件 (ItemPreview)

這個通用預覽組件用於顯示各種類型的訂單或項目詳情，支持表格和列表兩種顯示變體，並提供豐富的自定義選項。

## 功能特點

- 支持表格和列表兩種顯示變體
- 處理加載狀態、錯誤處理和無數據狀態
- 提供豐富的自定義選項，如自定義列配置、項目渲染函數、總計計算等
- 支持備註顯示
- 支持項目數量限制和"更多項目"提示
- 響應式設計，適應不同屏幕尺寸

## 使用方法

### 基本用法

```jsx
import ItemPreview from '../common/preview/ItemPreview';

// 基本用法
<ItemPreview
  data={orderData}
  loading={loading}
  error={error}
  title="訂單詳情"
  columns={columns}
  itemsKey="items"
/>
```

### 表格變體 (默認)

```jsx
// 表格變體
<ItemPreview
  data={orderData}
  loading={loading}
  error={error}
  title="訂單詳情"
  columns={[
    { key: 'name', label: '產品名稱' },
    { key: 'quantity', label: '數量', align: 'right' },
    { key: 'price', label: '單價', align: 'right' },
    { key: 'amount', label: '金額', align: 'right' }
  ]}
  itemsKey="items"
  variant="table"
/>
```

### 列表變體

```jsx
// 列表變體
<ItemPreview
  data={orderData}
  loading={loading}
  error={error}
  title="訂單詳情"
  itemsKey="items"
  variant="list"
/>
```

### 自定義渲染

```jsx
// 自定義項目渲染
<ItemPreview
  data={orderData}
  loading={loading}
  error={error}
  title="訂單詳情"
  itemsKey="items"
  renderItem={(item, index) => (
    <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
      <Typography variant="body2">
        {item.name} (#{item.id})
      </Typography>
      <Typography variant="body2" color="textSecondary">
        數量: {item.quantity} | 金額: {item.amount.toLocaleString()} 元
      </Typography>
    </Box>
  )}
/>
```

## 屬性說明

| 屬性名 | 類型 | 默認值 | 說明 |
|--------|------|--------|------|
| data | Object | - | 預覽數據 |
| loading | boolean | false | 是否正在加載 |
| error | string | - | 錯誤信息 |
| title | string | '預覽詳情' | 預覽標題 |
| columns | Array | [] | 表格列配置 |
| itemsKey | string | 'items' | 數據項目的鍵名 |
| renderItem | function | - | 自定義項目渲染函數 |
| getTotal | function | - | 計算總計的函數 |
| emptyText | string | '沒有項目' | 無數據時顯示的文本 |
| variant | string | 'table' | 預覽樣式變體 ('table' 或 'list') |
| containerProps | Object | {} | 容器組件的額外屬性 |
| maxItems | number | 5 | 最大顯示項目數 |
| notes | string | - | 備註內容 |
| notesKey | string | 'notes' | 備註的鍵名 |

## 列配置說明

表格變體的列配置支持以下屬性：

| 屬性名 | 類型 | 默認值 | 說明 |
|--------|------|--------|------|
| key | string | - | 數據項目的鍵名 |
| label | string | - | 列標題 |
| align | string | 'left' | 對齊方式 ('left', 'center', 'right') |
| render | function | - | 自定義渲染函數 |

## 實際應用示例

### 銷售訂單預覽

```jsx
import ItemPreview from '../common/preview/ItemPreview';

const SalesPreview = ({ sale, loading, error }) => {
  const columns = [
    { key: 'name', label: '產品名稱', render: (item) => item.product?.name || item.name },
    { key: 'quantity', label: '數量', align: 'right' },
    { key: 'price', label: '單價', align: 'right', render: (item) => item.price?.toFixed(2) || '0.00' },
    { key: 'amount', label: '金額', align: 'right', render: (item) => (item.amount || (item.price * item.quantity))?.toFixed(2) || '0.00' }
  ];

  const getTotal = (data) => {
    return data.totalAmount || 
      (data.items && data.items.reduce((sum, item) => sum + (item.amount || (item.price * item.quantity) || 0), 0));
  };

  return (
    <ItemPreview
      data={sale}
      loading={loading}
      error={error}
      title="銷售訂單詳情"
      columns={columns}
      itemsKey="items"
      getTotal={getTotal}
      emptyText="沒有產品項目"
      variant="table"
      notes={sale?.notes}
    />
  );
};
```

### 出貨單預覽

```jsx
import ItemPreview from '../common/preview/ItemPreview';

const ShippingOrderPreview = ({ shippingOrder, loading, error }) => {
  const columns = [
    { key: 'dname', label: '藥品名稱', render: (item) => item.dname || item.name },
    { key: 'did', label: '藥品代碼', render: (item) => item.did || item.id },
    { key: 'dquantity', label: '數量', align: 'right', render: (item) => item.dquantity || item.quantity },
    { key: 'dtotalCost', label: '金額', align: 'right', render: (item) => (item.dtotalCost || item.totalCost || 0).toLocaleString() }
  ];

  return (
    <ItemPreview
      data={shippingOrder}
      loading={loading}
      error={error}
      title="出貨單預覽"
      columns={columns}
      itemsKey="items"
      emptyText="無藥品項目"
      variant="table"
      notes={shippingOrder?.notes}
    />
  );
};
```
