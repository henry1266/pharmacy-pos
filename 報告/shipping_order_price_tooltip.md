# 出貨單進價提示功能實現報告

## 需求概述

根據用戶的最新需求，在出貨單輸入數量時，不要自動帶入價格，而是在旁邊顯示一個提示框，告訴用戶上次的進價是多少。

## 實現方案

修改出貨單表單中的產品項目輸入組件，使其在輸入數量並按下ENTER鍵時，顯示一個提示框，而不是自動填入總成本。

### 主要修改

在`ItemForm.js`中進行了以下修改：

1. 添加了`priceTooltip`狀態來管理提示框的顯示：
   ```javascript
   const [priceTooltip, setPriceTooltip] = React.useState({
     open: false,
     anchorEl: null,
     price: 0,
     totalCost: 0
   });
   ```

2. 修改了`handleQuantityKeyDown`函數，在按下ENTER鍵時顯示進貨價提示框：
   ```javascript
   const handleQuantityKeyDown = (event) => {
     if (event.key === 'Enter') {
       event.preventDefault();
       
       // 獲取進貨價和計算總成本
       const purchasePrice = getProductPurchasePrice();
       const totalCost = calculateTotalCost(currentItem.dquantity);
       
       // 顯示進貨價提示
       setPriceTooltip({
         open: true,
         anchorEl: event.currentTarget,
         price: purchasePrice,
         totalCost: totalCost
       });
       
       // 聚焦到總成本輸入框
       document.querySelector('input[name="dtotalCost"]')?.focus();
     }
   };
   ```

3. 添加了`handleCloseTooltip`函數來關閉提示框：
   ```javascript
   const handleCloseTooltip = () => {
     setPriceTooltip({
       ...priceTooltip,
       open: false
     });
   };
   ```

4. 添加了Popover組件來顯示進貨價和建議總成本：
   ```javascript
   <Popover
     open={priceTooltip.open}
     anchorEl={priceTooltip.anchorEl}
     onClose={handleCloseTooltip}
     anchorOrigin={{
       vertical: 'bottom',
       horizontal: 'center',
     }}
     transformOrigin={{
       vertical: 'top',
       horizontal: 'center',
     }}
   >
     <Paper sx={{ p: 2, maxWidth: 300 }}>
       <Typography variant="subtitle2" gutterBottom>
         上次進價: {priceTooltip.price} 元
       </Typography>
       <Typography variant="subtitle2" color="primary">
         建議總成本: {priceTooltip.totalCost} 元
       </Typography>
     </Paper>
   </Popover>
   ```

5. 移除了之前的自動填入功能，恢復了原來的`handleQuantityChange`函數：
   ```javascript
   const handleQuantityChange = (e) => {
     handleItemInputChange(e);
   };
   ```

## 功能說明

1. 當用戶選擇一個產品後，系統會記錄該產品的進貨價
2. 當用戶在數量輸入框中輸入數量並按下ENTER鍵時，系統會顯示一個提示框
3. 提示框會顯示該產品的上次進價和建議的總成本（進貨價*數量）
4. 焦點會自動移動到總成本輸入框，用戶可以手動輸入總成本
5. 提示框會在用戶點擊其他地方時自動關閉

## 測試方法

可以通過以下步驟測試此功能：

1. 進入出貨單創建或編輯頁面
2. 選擇一個產品
3. 在數量輸入框中輸入數量並按下ENTER鍵
4. 觀察是否顯示了進價提示框，並且焦點是否移動到總成本輸入框
5. 檢查提示框中顯示的進價和建議總成本是否正確
6. 點擊其他地方，檢查提示框是否自動關閉

## 注意事項

1. 此功能不會自動填入總成本，用戶需要手動輸入
2. 提示框只會在按下ENTER鍵時顯示，不會在輸入數量時自動顯示
3. 如果產品沒有設置進貨價，或進貨價為0，提示框中的進價和建議總成本也會顯示為0
