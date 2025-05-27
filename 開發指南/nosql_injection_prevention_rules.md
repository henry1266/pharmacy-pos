# NoSQL 注入防護規則

## 概述

本文件列出了防止 NoSQL 注入攻擊的最佳實踐規則，這些規則已應用於 pharmacy-pos 專案中的所有路由檔案。遵循這些規則可以有效防止惡意使用者透過操縱查詢參數進行 NoSQL 注入攻擊。

## 安全查詢規則

### 1. 使用查詢物件包裝所有查詢參數

**✅ 正確做法：**
```javascript
// 使用查詢物件包裝參數
const user = await User.findOne({ _id: req.params.id.toString() });
```

**❌ 錯誤做法：**
```javascript
// 直接傳入參數
const user = await User.findById(req.params.id);
```

### 2. 對所有查詢參數進行型態轉換

**✅ 正確做法：**
```javascript
// 將參數轉換為字串
if (shift) query.shift = shift.toString();

// 在查詢物件中轉換參數
const category = await AccountingCategory.findOne({ name: name.toString() });
```

**❌ 錯誤做法：**
```javascript
// 未進行型態轉換
if (shift) query.shift = shift;

// 直接使用參數
const category = await AccountingCategory.findOne({ name });
```

### 3. 在比較操作中也要進行型態轉換

**✅ 正確做法：**
```javascript
// 在比較操作中轉換參數
const existingCategory = await AccountingCategory.findOne({
  name,
  _id: { $ne: req.params.id.toString() }
});
```

**❌ 錯誤做法：**
```javascript
// 未在比較操作中轉換參數
const existingCategory = await AccountingCategory.findOne({
  name,
  _id: { $ne: req.params.id }
});
```

### 4. 避免使用 findById 方法，改用 findOne 搭配查詢物件

**✅ 正確做法：**
```javascript
// 使用 findOne 搭配查詢物件
const category = await AccountingCategory.findOne({ _id: req.params.id.toString() });
```

**❌ 錯誤做法：**
```javascript
// 使用 findById 方法
const category = await AccountingCategory.findById(req.params.id);
```

### 5. 對日期類型參數進行適當處理

**✅ 正確做法：**
```javascript
// 適當處理日期參數
if (startDate) query.date.$gte = new Date(startDate);
if (endDate) query.date.$lte = new Date(endDate);
```

## 實施範例

以下是從專案中提取的實際範例，展示了如何正確實施這些規則：

### 範例 1：基本查詢

```javascript
// 從 accounting.js
if (shift) query.shift = shift.toString();
const accountingRecords = await Accounting.find(query).sort({ date: -1, shift: 1 });
```

### 範例 2：ID 查詢

```javascript
// 從 accountingCategories.js
const category = await AccountingCategory.findOne({ _id: req.params.id.toString() });
```

### 範例 3：複雜查詢條件

```javascript
// 從 accountingCategories.js
const existingCategory = await AccountingCategory.findOne({
  name: name.toString(),
  _id: { $ne: req.params.id.toString() }
});
```

## 結論

遵循上述規則可以有效防止 NoSQL 注入攻擊，提高應用程式的安全性。在開發過程中，應始終將這些規則應用於所有資料庫查詢操作。
