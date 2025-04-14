# 出貨單進價提示功能優化報告

## 需求概述

根據用戶的最新需求，需要使用Tooltip而不是Popover來顯示進價提示，並且只在游標位於總成本輸入框時才顯示提示。

## 實現方案

修改出貨單表單中的產品項目輸入組件，使用與數量輸入框相同的Tooltip方式來顯示進價提示。

### 主要修改

在`ItemForm.js`中進行了以下修改：

1. 移除了之前的priceTooltip狀態和Popover組件
2. 添加了`getPriceTooltipText`函數來生成提示文本：
   ```javascript
   const getPriceTooltipText = () => {
     if (!currentItem.product || !currentItem.dquantity) return "請先選擇產品並輸入數量";
     
     const purchasePrice = getProductPurchasePrice();
     const totalCost = calculateTotalCost(currentItem.dquantity);
     
     return `上次進價: ${purchasePrice} 元\n建議總成本: ${totalCost} 元`;
   };
   ```

3. 在總成本輸入框外添加了Tooltip組件：
   ```javascript
   <Tooltip 
     title={
       <Box component="div" sx={{ whiteSpace: 'pre-line', p: 1 }}>
         {getPriceTooltipText()}
       </Box>
     }
     placement="top"
     arrow
   >
     <TextField
       fullWidth
       label="總成本"
       name="dtotalCost"
       type="number"
       value={currentItem.dtotalCost}
       onChange={handleItemInputChange}
       inputProps={{ min: 0 }}
       onKeyDown={(event) => {
         // 當按下ENTER鍵時
         if (event.key === 'Enter') {
           event.preventDefault();
           // 如果所有必填欄位都已填寫，則添加項目
           if (currentItem.did && currentItem.dname && currentItem.dquantity && currentItem.dtotalCost !== '' && isInventorySufficient()) {
             handleAddItem();
             // 添加項目後，將焦點移回商品選擇欄位
             setTimeout(() => {
               const productInput = document.getElementById('product-select');
               if (productInput) {
                 productInput.focus();
                 console.log('ENTER鍵：焦點已設置到商品選擇欄位', productInput);
               } else {
                 console.error('找不到商品選擇欄位元素');
               }
             }, 200);
           } else {
             // 如果有欄位未填寫，顯示錯誤提示
             console.error('請填寫完整的藥品項目資料或庫存不足');
           }
         }
       }}
     />
   </Tooltip>
   ```

4. 簡化了`handleQuantityKeyDown`函數，只負責焦點跳轉：
   ```javascript
   const handleQuantityKeyDown = (event) => {
     if (event.key === 'Enter') {
       event.preventDefault();
       // 聚焦到總成本輸入框
       document.querySelector('input[name="dtotalCost"]')?.focus();
     }
   };
   ```

## 功能說明

1. 當用戶選擇一個產品並輸入數量後，系統會記錄該產品的進貨價
2. 當用戶將游標懸停在總成本輸入框上時，會顯示一個Tooltip提示
3. 提示框會顯示該產品的上次進價和建議的總成本（進貨價*數量）
4. 當用戶按下ENTER鍵時，焦點會從數量輸入框跳轉到總成本輸入框
5. 用戶可以手動輸入總成本

## 測試方法

可以通過以下步驟測試此功能：

1. 進入出貨單創建或編輯頁面
2. 選擇一個產品
3. 在數量輸入框中輸入數量並按下ENTER鍵
4. 觀察焦點是否移動到總成本輸入框
5. 將游標懸停在總成本輸入框上，檢查是否顯示了進價提示
6. 檢查提示中顯示的進價和建議總成本是否正確

## 注意事項

1. 此功能不會自動填入總成本，用戶需要手動輸入
2. 提示只會在游標懸停在總成本輸入框上時顯示
3. 如果產品沒有設置進貨價，或進貨價為0，提示中的進價和建議總成本也會顯示為0
4. 如果用戶未選擇產品或未輸入數量，提示會顯示"請先選擇產品並輸入數量"
