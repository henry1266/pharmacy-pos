import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  TextField, 
  Tooltip,
  Box,
  Button,
  Grid
} from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import axios from 'axios';
import FIFOSimulationDialog from './FIFOSimulationDialog';

/**
 * 價格提示組件 - 用於顯示總成本相關提示的通用組件
 * @param {Object} props - 組件屬性
 * @param {Object} props.currentItem - 當前項目數據
 * @param {Function} props.handleItemInputChange - 處理項目輸入變更的函數
 * @param {Function} props.getProductPurchasePrice - 獲取產品進價的函數
 * @param {Function} props.calculateTotalCost - 計算總成本的函數
 * @param {number | string} props.healthInsurancePrice - 產品的健保價
 * @param {number | string} props.healthInsurancePayment - 計算後的健保給付金額
 * @param {Function} props.isInventorySufficient - 檢查庫存是否足夠的函數
 * @param {Function} props.handleAddItem - 處理添加項目的函數
 * @returns {React.ReactElement} 價格提示組件
 */
const PriceTooltip = ({
  currentItem,
  handleItemInputChange,
  getProductPurchasePrice,
  calculateTotalCost,
  healthInsurancePrice, // Added new prop
  healthInsurancePayment, // Added new prop
  isInventorySufficient,
  handleAddItem
}) => {
  // FIFO模擬相關狀態
  const [simulationDialogOpen, setSimulationDialogOpen] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 生成進價提示文本
  const getPriceTooltipText = () => {
    if (!currentItem.product || currentItem.dquantity === undefined || currentItem.dquantity === null || currentItem.dquantity === '') return "請先選擇產品並輸入數量";
    
    const purchasePrice = getProductPurchasePrice();
    const totalCost = Math.round(calculateTotalCost(currentItem.dquantity));
    let tooltipText = `上次進價: ${purchasePrice} 元\n建議總成本: ${totalCost} 元`;

    // Add health insurance information if available
    if (healthInsurancePrice !== undefined && healthInsurancePrice !== null && healthInsurancePrice !== 0) {
      tooltipText += `\n健保價: ${healthInsurancePrice} 元`;
    }
    if (healthInsurancePayment !== undefined && healthInsurancePayment !== null && healthInsurancePayment !== '0.00') {
      tooltipText += `\n健保給付: ${healthInsurancePayment} 元`;
    }
    
    return tooltipText;
  };

  // 處理FIFO模擬按鈕點擊
  const handleSimulateFIFO = async () => {
    // 檢查是否已選擇產品和輸入數量
    if (!currentItem.product || currentItem.dquantity === undefined || currentItem.dquantity === null || currentItem.dquantity === '') {
      setError('請先選擇產品並輸入數量');
      setSimulationDialogOpen(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSimulationDialogOpen(true);

      // 調用後端API進行FIFO模擬
      const response = await axios.post('/api/fifo/simulate', {
        productId: currentItem.product,
        quantity: currentItem.dquantity
      });

      setSimulationResult(response.data);
    } catch (err) {
      console.error('FIFO模擬錯誤:', err);
      setError(err.response?.data?.msg || '模擬FIFO成本失敗');
    } finally {
      setLoading(false);
    }
  };

  // 關閉模擬對話框
  const handleCloseSimulationDialog = () => {
    setSimulationDialogOpen(false);
  };

  // 應用模擬成本
  const handleApplyCost = (cost) => {
    // 創建一個模擬事件對象
    const event = {
      target: {
        name: 'dtotalCost',
        value: cost.toFixed(2)
      }
    };
    
    // 調用處理項目輸入變更的函數
    handleItemInputChange(event);
    
    // 關閉對話框
    setSimulationDialogOpen(false);
  };

  return (
    <>
      <Grid container spacing={1}>
        <Grid item xs={12}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<CalculateIcon />}
            onClick={handleSimulateFIFO}
            fullWidth
            sx={{ mb: 1 }}
            disabled={!currentItem.product || currentItem.dquantity === undefined || currentItem.dquantity === null || currentItem.dquantity === ''}
          >
            FIFO模擬計算
          </Button>
        </Grid>
        <Grid item xs={12}>
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
                  
                  // 如果總成本為空且已選擇產品和輸入數量，則觸發FIFO模擬按鈕的點擊
                  if (currentItem.dtotalCost === '' && currentItem.product && (currentItem.dquantity !== undefined && currentItem.dquantity !== null && currentItem.dquantity !== '')) {
                    console.log('總成本為空，觸發FIFO模擬按鈕點擊');
                    handleSimulateFIFO();
                    return;
                  }
                  
                  // 如果所有必填欄位都已填寫，則添加項目
                  if (currentItem.did && currentItem.dname && (currentItem.dquantity !== undefined && currentItem.dquantity !== null && currentItem.dquantity !== '') && currentItem.dtotalCost !== '' && isInventorySufficient()) {
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
        </Grid>
      </Grid>

      {/* FIFO模擬結果對話框 */}
      <FIFOSimulationDialog
        open={simulationDialogOpen}
        onClose={handleCloseSimulationDialog}
        simulationResult={simulationResult}
        loading={loading}
        error={error}
        onApplyCostAndAdd={handleApplyCost}
      />
    </>
  );
};

// 添加 PropTypes 驗證
PriceTooltip.propTypes = {
  currentItem: PropTypes.shape({
    product: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    dquantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    dtotalCost: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    dname: PropTypes.string,
    did: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }).isRequired,
  handleItemInputChange: PropTypes.func.isRequired,
  getProductPurchasePrice: PropTypes.func.isRequired,
  calculateTotalCost: PropTypes.func.isRequired,
  healthInsurancePrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  healthInsurancePayment: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  isInventorySufficient: PropTypes.func.isRequired,
  handleAddItem: PropTypes.func.isRequired
};

export default PriceTooltip;
