import React from 'react';
import { 
  TextField, 
  Tooltip,
  Box
} from '@mui/material';

/**
 * 價格提示組件 - 用於顯示總成本相關提示的通用組件
 * @param {Object} props - 組件屬性
 * @param {Object} props.currentItem - 當前項目數據
 * @param {Function} props.handleItemInputChange - 處理項目輸入變更的函數
 * @param {Function} props.getProductPurchasePrice - 獲取產品進價的函數
 * @param {Function} props.calculateTotalCost - 計算總成本的函數
 * @param {Function} props.isInventorySufficient - 檢查庫存是否足夠的函數
 * @param {Function} props.handleAddItem - 處理添加項目的函數
 * @returns {React.ReactElement} 價格提示組件
 */
const PriceTooltip = ({
  currentItem,
  handleItemInputChange,
  getProductPurchasePrice,
  calculateTotalCost,
  isInventorySufficient,
  handleAddItem
}) => {
  // 生成進價提示文本
  const getPriceTooltipText = () => {
    if (!currentItem.product || !currentItem.dquantity) return "請先選擇產品並輸入數量";
    
    const purchasePrice = getProductPurchasePrice();
    const totalCost = Math.round(calculateTotalCost(currentItem.dquantity));
    return `上次進價: ${purchasePrice} 元\n建議總成本: ${totalCost} 元`;
  };

  return (
    <Tooltip 
      title={
        <Box component="div" sx={{ whiteSpace: 'pre-line', p: 1 , fontSize: '1.2rem'}}>
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
  );
};

export default PriceTooltip;
