# FIFO分佈明細排序修改報告

## 問題描述

根據用戶提供的截圖和反饋，FIFO分佈明細中存在兩個問題：

1. 有兩筆2024年8月的批次（2024/08/17/003和2024/08/06/02）被安插在2025年的批次之間，這違反了時間順序
2. 用戶希望FIFO分佈明細預設由大到小來檢視，而不是之前修改的從小到大排序

## 問題分析

經過代碼分析，發現問題出在前端顯示FIFO分佈明細時沒有對批次進行排序，而是直接顯示後端返回的順序。雖然我們之前修改了後端的出貨記錄排序邏輯為從小到大，但這並不影響FIFO分佈明細中批次的顯示順序。

在`FIFOProfitCalculator.js`文件中，FIFO分佈明細的顯示代碼如下：

```javascript
{fifoData.fifoMatches
  .filter(match => new Date(match.outTime).getTime() === new Date(item.saleTime).getTime())
  .flatMap(match => 
    match.costParts.map((part, partIndex) => (
      <TableRow key={partIndex}>
        <TableCell>
          {part.orderNumber ? (
            <Link
              component={RouterLink}
              to={
                part.orderType === 'purchase'
                  ? `/purchase-orders/${part.orderId}`
                  : '#'
              }
              sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
            >
              {part.orderType === 'purchase' && <ShoppingCartIcon fontSize="small" sx={{ mr: 0.5 }} />}
              {part.orderNumber}
            </Link>
          ) : (
            new Date(part.batchTime).toLocaleDateString()
          )}
        </TableCell>
        <TableCell align="right">{part.quantity}</TableCell>
        <TableCell align="right">${part.unit_price.toFixed(2)}</TableCell>
        <TableCell align="right">${(part.unit_price * part.quantity).toFixed(2)}</TableCell>
      </TableRow>
    ))
  )
}
```

可以看到，代碼直接使用了`match.costParts`而沒有進行任何排序，這導致批次顯示順序可能混亂。

## 修改內容

為了解決這個問題，我在前端對FIFO分佈明細的`costParts`進行了排序，確保按照批次號從大到小顯示：

```javascript
{fifoData.fifoMatches
  .filter(match => new Date(match.outTime).getTime() === new Date(item.saleTime).getTime())
  .flatMap(match => {
    // 對costParts進行排序，按照批次號從大到小排序
    const sortedCostParts = [...match.costParts].sort((a, b) => {
      // 提取數字部分進行比較
      const aNum = a.orderNumber ? a.orderNumber.replace(/\D/g, '') : '';
      const bNum = b.orderNumber ? b.orderNumber.replace(/\D/g, '') : '';
      
      if (aNum && bNum) {
        // 從大到小排序
        return parseInt(bNum) - parseInt(aNum);
      }
      
      // 如果無法比較數字，則按時間從新到舊排序
      return new Date(b.batchTime) - new Date(a.batchTime);
    });
    
    return sortedCostParts.map((part, partIndex) => (
      <TableRow key={partIndex}>
        <TableCell>
          {part.orderNumber ? (
            <Link
              component={RouterLink}
              to={
                part.orderType === 'purchase'
                  ? `/purchase-orders/${part.orderId}`
                  : '#'
              }
              sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
            >
              {part.orderType === 'purchase' && <ShoppingCartIcon fontSize="small" sx={{ mr: 0.5 }} />}
              {part.orderNumber}
            </Link>
          ) : (
            new Date(part.batchTime).toLocaleDateString()
          )}
        </TableCell>
        <TableCell align="right">{part.quantity}</TableCell>
        <TableCell align="right">${part.unit_price.toFixed(2)}</TableCell>
        <TableCell align="right">${(part.unit_price * part.quantity).toFixed(2)}</TableCell>
      </TableRow>
    ));
  })
}
```

主要修改點：

1. 添加了對`costParts`的排序邏輯，創建了`sortedCostParts`變量
2. 排序邏輯首先提取批次號的數字部分進行比較，按照從大到小的順序排序
3. 如果無法比較數字（例如批次號格式不同或沒有批次號），則按照時間從新到舊排序
4. 使用排序後的`sortedCostParts`來渲染FIFO分佈明細

## 預期效果

修改後，FIFO分佈明細將按照批次號從大到小排序，較新的批次（如2025年的批次）會顯示在較舊的批次（如2024年的批次）之前。這樣可以解決用戶看到的2024年8月批次被安插在2025年批次之間的問題，並符合用戶希望FIFO分佈明細預設由大到小檢視的需求。

## 提交信息

按照development_collaboration_guidelines中的Conventional Commits規範提交了修改：
```
fix: 修改FIFO分佈明細排序邏輯，確保按照批次號從大到小排序
```

## 推送結果

修改已成功推送到GitHub倉庫的new分支。
