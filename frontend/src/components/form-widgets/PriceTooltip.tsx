import React, { useState, ChangeEvent, KeyboardEvent } from 'react';
import {
  TextField,
  Tooltip,
  Box,
  Button
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import CalculateIcon from '@mui/icons-material/Calculate';
import axios from 'axios';
import FIFOSimulationDialog, { SimulationResult } from './FIFOSimulationDialog';

/**
 * 當前項目介面
 */
interface CurrentItem {
  product?: string | number;
  dquantity?: string | number;
  dtotalCost?: string | number;
  dname?: string;
  did?: string | number;
  [key: string]: any;
}

/**
 * 價格提示組件屬性
 */
interface PriceTooltipProps {
  currentItem: CurrentItem;
  handleItemInputChange: (event: { target: { name: string; value: any } }) => void;
  getProductPurchasePrice: () => number;
  calculateTotalCost: (quantity: number | string) => number;
  healthInsurancePrice?: string | number;
  healthInsurancePayment?: string | number;
  isInventorySufficient: () => boolean;
  handleAddItem: () => void;
}

/**
 * 價格提示組件 - 用於顯示總成本相關提示的通用組件
 */
const PriceTooltip: React.FC<PriceTooltipProps> = ({
  currentItem,
  handleItemInputChange,
  getProductPurchasePrice,
  calculateTotalCost,
  healthInsurancePrice,
  healthInsurancePayment,
  isInventorySufficient,
  handleAddItem
}) => {
  // FIFO模擬相關狀態
  const [simulationDialogOpen, setSimulationDialogOpen] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 生成進價提示文本
  const getPriceTooltipText = (): string => {
    if (!currentItem.product || currentItem.dquantity === undefined || currentItem.dquantity === null || currentItem.dquantity === '') 
      return "請先選擇產品並輸入數量";
    
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
  const handleSimulateFIFO = async (): Promise<void> => {
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
    } catch (err: any) {
      console.error('FIFO模擬錯誤:', err);
      setError(err.response?.data?.msg || '模擬FIFO成本失敗');
    } finally {
      setLoading(false);
    }
  };

  // 關閉模擬對話框
  const handleCloseSimulationDialog = (): void => {
    setSimulationDialogOpen(false);
  };

  // 應用模擬成本
  const handleApplyCost = (result: SimulationResult): void => {
    // 創建一個模擬事件對象
    const event = {
      target: {
        name: 'dtotalCost',
        value: result.totalCost.toFixed(2)
      }
    };
    
    // 調用處理項目輸入變更的函數
    handleItemInputChange(event);
    
    // 關閉對話框
    setSimulationDialogOpen(false);
  };

  // 處理鍵盤事件
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
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
  };

  return (
    <>
      <Grid container spacing={1}>
        <Grid xs={12}>
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
        <Grid xs={12}>
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
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleItemInputChange({
                target: {
                  name: e.target.name,
                  value: e.target.value
                }
              })}
              inputProps={{ min: 0 }}
              onKeyDown={handleKeyDown}
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
        error={error || undefined}
        onApplyCostAndAdd={handleApplyCost}
      />
    </>
  );
};

export default PriceTooltip;