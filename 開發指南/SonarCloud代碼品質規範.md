# SonarCloud 代碼品質規範

> 基於 pharmacy-pos 專案的 SonarCloud 問題修復經驗，整理出的代碼品質最佳實踐指南。

---

## 一、可選鏈表達式 (Optional Chaining)

### 規則：javascript:S6582
**優先使用可選鏈表達式，更簡潔且易讀**

**✅ 正確做法：**
```javascript
// 使用可選鏈操作符
if (record.employeeId?._id) {
  // 處理邏輯
}

// 檢查嵌套屬性
if (matchingRecord?.employeeId?.name) {
  employeeName = matchingRecord.employeeId.name;
}

// 方法調用
if (isNaN(recordDate?.getTime())) {
  // 錯誤處理
}
```

**❌ 錯誤做法：**
```javascript
// 使用傳統的 && 檢查
if (record.employeeId && record.employeeId._id) {
  // 處理邏輯
}

// 冗長的嵌套檢查
if (matchingRecord && matchingRecord.employeeId && matchingRecord.employeeId.name) {
  employeeName = matchingRecord.employeeId.name;
}
```

---

## 二、函數嵌套深度控制

### 規則：javascript:S2004
**重構代碼，避免函數嵌套超過 4 層**

**✅ 正確做法：**
```javascript
// 提取事件處理函數
const handleApproveRecord = async (record) => {
  try {
    await overtimeRecordService.updateOvertimeRecord(record._id, {
      status: 'approved'
    });
    setSuccessMessage('加班記錄已核准');
    fetchOvertimeRecords();
  } catch (err) {
    setError(err.message);
  }
};

// 在 JSX 中使用簡潔的引用
<IconButton onClick={() => handleApproveRecord(record)}>
  <CheckCircleIcon />
</IconButton>
```

**❌ 錯誤做法：**
```javascript
// 深度嵌套的匿名函數
<IconButton
  onClick={() => {
    setSelectedRecord(record);
    overtimeRecordService.updateOvertimeRecord(record._id, {
      status: 'approved'
    }).then(() => {
      setSuccessMessage('加班記錄已核准');
      fetchOvertimeRecords();
    }).catch(err => {
      setError(err.message);
    });
  }}
>
  <CheckCircleIcon />
</IconButton>
```

---

## 三、冗餘賦值避免

### 規則：javascript:S4165
**避免冗餘的變數賦值**

**✅ 正確做法：**
```javascript
// 聲明變數但不初始化，在 switch 中賦值
let hours;
switch(record.shift) {
  case 'morning': hours = 3.5; break;
  case 'afternoon': hours = 3; break;
  case 'evening': hours = 1.5; break;
  default: hours = 0;
}
```

**❌ 錯誤做法：**
```javascript
// 冗餘的初始賦值
let hours = 0;
switch(record.shift) {
  case 'morning': hours = 3.5; break;
  case 'afternoon': hours = 3; break;
  case 'evening': hours = 1.5; break;
  default: hours = 0; // 這裡的賦值是冗餘的
}
```

---

## 四、未使用導入清理

### 規則：javascript:S1128
**移除未使用的導入**

**✅ 正確做法：**
```javascript
// 只導入實際使用的模組
import React, { useState, useEffect } from 'react';
import { Button, Dialog } from '@mui/material';
import employeeService from '../../services/employeeService';
```

**❌ 錯誤做法：**
```javascript
// 包含未使用的導入
import React, { useState, useEffect } from 'react';
import { Button, Dialog } from '@mui/material';
import employeeService from '../../services/employeeService';
import { getSchedules } from '../../services/employeeScheduleService'; // 未使用
```

---

## 五、認知複雜度控制

### 最佳實踐
**將複雜的業務邏輯拆分為更小的函數**

**✅ 正確做法：**
```javascript
// 使用自定義 Hook 分離業務邏輯
const useOvertimeManager = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const fetchRecords = useCallback(async () => {
    // 獲取記錄邏輯
  }, []);
  
  return { records, loading, fetchRecords };
};

// 在組件中使用
const OvertimeManager = () => {
  const { records, loading, fetchRecords } = useOvertimeManager();
  // 簡化的組件邏輯
};
```

**❌ 錯誤做法：**
```javascript
// 將所有邏輯放在一個大組件中
const OvertimeManager = () => {
  // 1500+ 行的巨大組件
  // 包含所有狀態管理、API 調用、UI 渲染邏輯
};
```

---

## 六、React 最佳實踐

### 1. 組件大小控制
- **單個組件不超過 300 行**
- **單個函數不超過 40 行**
- **使用自定義 Hook 分離業務邏輯**

### 2. 性能優化
```javascript
// 使用 React.memo 避免不必要的重渲染
const OvertimeRecord = React.memo(({ record, onEdit, onDelete }) => {
  // 組件邏輯
});

// 使用 useCallback 穩定函數引用
const handleEdit = useCallback((record) => {
  // 編輯邏輯
}, []);

// 使用 useMemo 緩存計算結果
const filteredRecords = useMemo(() => {
  return records.filter(record => record.status === 'approved');
}, [records]);
```

### 3. PropTypes 驗證
```javascript
// 為所有組件添加 PropTypes
OvertimeManager.propTypes = {
  isAdmin: PropTypes.bool,
  employeeId: PropTypes.string
};
```

---

## 七、代碼審查檢查清單

### 提交前自檢
- [ ] 是否有未使用的導入？
- [ ] 是否使用了可選鏈操作符？
- [ ] 函數嵌套是否超過 4 層？
- [ ] 是否有冗餘的變數賦值？
- [ ] 組件大小是否合理（<300 行）？
- [ ] 是否添加了 PropTypes 驗證？

### SonarCloud 品質門檻
- **可維護性等級**: A
- **可靠性等級**: A  
- **安全性等級**: A
- **代碼覆蓋率**: >80%
- **重複代碼**: <3%

---

## 八、工具配置建議

### ESLint 規則
```json
{
  "rules": {
    "prefer-optional-chaining": "error",
    "max-depth": ["error", 4],
    "max-lines-per-function": ["error", 40],
    "max-lines": ["error", 300],
    "no-unused-vars": "error"
  }
}
```

### SonarCloud 配置
```properties
# sonar-project.properties
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.coverage.exclusions=**/*.test.js,**/*.spec.js
sonar.cpd.exclusions=**/*.test.js,**/*.spec.js
```

---

## 結語

> **代碼品質不是一次性的工作，而是持續的實踐。**

遵循這些規範可以：
- 提高代碼可讀性和可維護性
- 減少潛在的 bug 和安全風險
- 通過 SonarCloud 品質檢查
- 提升團隊開發效率

請將這些規範納入日常開發流程，並在代碼審查中嚴格執行。