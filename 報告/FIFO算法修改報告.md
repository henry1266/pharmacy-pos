# FIFO算法修改報告

## 問題描述
根據用戶提供的截圖和需求，FIFO利潤計算器在計算成本時未按照貨單號從小到大的原則進行扣除，這違反了FIFO（先進先出）的基本原則。

## 問題分析
經過代碼分析，在`backend/utils/fifoCalculator.js`文件中發現，出貨記錄的排序邏輯是按照貨單號從大到小排序，這導致較新的批次被優先扣除。這與FIFO原則相反，FIFO原則要求較舊的批次（貨單號較小的）應該被優先扣除。

原始代碼中的排序邏輯如下：
```javascript
// 出貨記錄按貨單號大到小排序，再按時間排序
stockOut.sort((a, b) => {
  // 先按貨單號大到小排序
  if (a.orderNumber && b.orderNumber) {
    // 提取數字部分進行比較
    const aNum = a.orderNumber.replace(/\D/g, '');
    const bNum = b.orderNumber.replace(/\D/g, '');
    
    if (aNum && bNum) {
      const numComparison = parseInt(bNum) - parseInt(aNum); // 大到小排序
      if (numComparison !== 0) return numComparison;
    }
    
    // 如果數字部分相同或無法比較，則按完整貨單號字母順序排序
    const strComparison = b.orderNumber.localeCompare(a.orderNumber);
    if (strComparison !== 0) return strComparison;
  }
  
  // 如果貨單號相同或無法比較，則按時間排序
  return new Date(a.timestamp) - new Date(b.timestamp);
});
```

## 修改內容
將排序邏輯修改為按照貨單號從小到大排序，確保較舊的批次被優先扣除，符合FIFO原則。

修改後的代碼如下：
```javascript
// 出貨記錄按貨單號小到大排序，再按時間排序
stockOut.sort((a, b) => {
  // 先按貨單號小到大排序
  if (a.orderNumber && b.orderNumber) {
    // 提取數字部分進行比較
    const aNum = a.orderNumber.replace(/\D/g, '');
    const bNum = b.orderNumber.replace(/\D/g, '');
    
    if (aNum && bNum) {
      const numComparison = parseInt(aNum) - parseInt(bNum); // 小到大排序
      if (numComparison !== 0) return numComparison;
    }
    
    // 如果數字部分相同或無法比較，則按完整貨單號字母順序排序
    const strComparison = a.orderNumber.localeCompare(b.orderNumber);
    if (strComparison !== 0) return strComparison;
  }
  
  // 如果貨單號相同或無法比較，則按時間排序
  return new Date(a.timestamp) - new Date(b.timestamp);
});
```

主要修改點：
1. 將排序方向從`parseInt(bNum) - parseInt(aNum)`（大到小）改為`parseInt(aNum) - parseInt(bNum)`（小到大）
2. 將字符串比較方向從`b.orderNumber.localeCompare(a.orderNumber)`改為`a.orderNumber.localeCompare(b.orderNumber)`
3. 更新了註釋，從「大到小排序」改為「小到大排序」

## 預期效果
修改後，FIFO計算時會按照批次號從小到大的順序進行庫存扣除，符合FIFO原則。這意味著較早進貨的批次（貨單號較小的）會被優先扣除，確保庫存成本計算的準確性。

## 提交信息
按照development_collaboration_guidelines中的Conventional Commits規範提交了修改：
```
fix: 修改FIFO算法排序邏輯，確保按照貨單號從小到大排序
```

## 推送結果
修改已成功推送到GitHub倉庫的new分支。
