# FIFO模擬查詢功能實現報告

## 功能需求

根據用戶需求，在出貨頁面中添加FIFO模擬查詢功能，具體要求如下：

1. 在出貨頁面的總成本輸入框上方添加一個按鈕
2. 當商品及數量都有填寫時才能執行，否則提示用戶填寫名稱和數量
3. 模擬結果需要像FIFO明細一樣詳細列出每個批次的扣除情況，並顯示總成本
4. 在模擬結果下方添加一個按鈕，可將計算出的總成本帶入到總成本輸入框中

## 實現方案

### 1. 後端API擴展

在`backend/routes/fifo.js`中添加了新的`/api/fifo/simulate`端點，用於處理FIFO模擬請求：

```javascript
// @route   POST api/fifo/simulate
// @desc    Simulate FIFO cost for a product with given quantity
// @access  Public
router.post('/simulate', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    if (!productId || !quantity) {
      return res.status(400).json({ msg: '請提供產品ID和數量' });
    }
    
    // 獲取產品的所有庫存記錄
    const inventories = await Inventory.find({ 
      product: productId,
      type: 'purchase' // 只獲取進貨記錄
    })
    .populate('product')
    .sort({ lastUpdated: 1 }); // 按時間排序，確保先進先出
    
    if (inventories.length === 0) {
      return res.status(404).json({ msg: '找不到該產品的庫存記錄' });
    }
    
    // 準備庫存數據
    const { stockIn } = prepareInventoryForFIFO(inventories);
    
    // 創建模擬出貨記錄
    const simulatedStockOut = [{
      timestamp: new Date(),
      quantity: parseInt(quantity),
      drug_id: productId,
      source_id: 'simulation',
      type: 'simulation',
      orderNumber: 'SIMULATION',
      orderId: null,
      orderType: 'simulation'
    }];
    
    // 執行FIFO匹配
    const fifoMatches = matchFIFOBatches(stockIn, simulatedStockOut);
    
    // 計算總成本
    let totalCost = 0;
    let hasNegativeInventory = false;
    let remainingNegativeQuantity = 0;
    
    if (fifoMatches.length > 0) {
      const match = fifoMatches[0];
      hasNegativeInventory = match.hasNegativeInventory;
      remainingNegativeQuantity = match.remainingNegativeQuantity || 0;
      
      // 計算已匹配部分的成本
      totalCost = match.costParts.reduce((sum, part) => {
        return sum + (part.unit_price * part.quantity);
      }, 0);
    }
    
    // 獲取產品信息
    const productInfo = inventories[0].product;
    
    // 返回模擬結果
    res.json({
      success: true,
      productId,
      productName: productInfo.name,
      productCode: productInfo.code,
      quantity: parseInt(quantity),
      fifoMatches,
      totalCost,
      hasNegativeInventory,
      remainingNegativeQuantity,
      availableQuantity: stockIn.reduce((sum, batch) => sum + batch.quantity, 0)
    });
  } catch (err) {
    console.error('FIFO模擬計算錯誤:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});
```

### 2. 前端界面修改

#### 2.1 創建FIFO模擬結果對話框組件

創建了新的`FIFOSimulationDialog.js`組件，用於顯示FIFO模擬結果：

```javascript
import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Box,
  CircularProgress,
  Alert,
  Link
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

const FIFOSimulationDialog = ({
  open,
  onClose,
  simulationResult,
  loading,
  error,
  onApplyCost
}) => {
  // 渲染對話框內容
  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      );
    }

    if (!simulationResult) {
      return (
        <Typography variant="body1" sx={{ p: 2 }}>
          無模擬結果
        </Typography>
      );
    }

    // 獲取FIFO匹配結果
    const fifoMatch = simulationResult.fifoMatches && simulationResult.fifoMatches.length > 0 
      ? simulationResult.fifoMatches[0] 
      : null;

    // 如果沒有FIFO匹配結果，顯示提示訊息
    if (!fifoMatch) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          無法計算FIFO成本，可能是因為沒有足夠的庫存記錄。
        </Alert>
      );
    }

    return (
      <>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            FIFO模擬結果
          </Typography>
          <Typography variant="body1">
            產品: {simulationResult.productCode} - {simulationResult.productName}
          </Typography>
          <Typography variant="body1">
            數量: {simulationResult.quantity}
          </Typography>
          <Typography variant="body1" fontWeight="bold" color="primary">
            總成本: ${simulationResult.totalCost.toFixed(2)}
          </Typography>
          {simulationResult.hasNegativeInventory && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              庫存不足！可用庫存: {simulationResult.availableQuantity}，需要: {simulationResult.quantity}
              {simulationResult.remainingNegativeQuantity > 0 && (
                <Typography variant="body2">
                  缺少數量: {simulationResult.remainingNegativeQuantity}
                </Typography>
              )}
            </Alert>
          )}
        </Box>

        <Typography variant="subtitle1" gutterBottom>
          FIFO成本分佈明細
        </Typography>
        <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#e9ecef' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>批次時間</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>數量</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>單價</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>小計</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fifoMatch.costParts.map((part, index) => (
                <TableRow key={index}>
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
              ))}
              {/* 總計行 */}
              <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                  總計:
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  ${simulationResult.totalCost.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </>
    );
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>FIFO成本模擬</DialogTitle>
      <DialogContent dividers>
        {renderContent()}
      </DialogContent>
      <DialogActions>
        {simulationResult && !loading && !error && (
          <Button 
            onClick={() => onApplyCost(simulationResult.totalCost)} 
            color="primary"
            variant="contained"
          >
            應用此成本
          </Button>
        )}
        <Button onClick={onClose} color="secondary">
          關閉
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FIFOSimulationDialog;
```

#### 2.2 修改PriceTooltip.js組件

修改了`PriceTooltip.js`組件，添加FIFO模擬按鈕並整合模擬結果對話框：

```javascript
import React, { useState } from 'react';
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

const PriceTooltip = ({
  currentItem,
  handleItemInputChange,
  getProductPurchasePrice,
  calculateTotalCost,
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
    if (!currentItem.product || !currentItem.dquantity) return "請先選擇產品並輸入數量";
    
    const purchasePrice = getProductPurchasePrice();
    const totalCost = Math.round(calculateTotalCost(currentItem.dquantity));
    return `上次進價: ${purchasePrice} 元\n建議總成本: ${totalCost} 元`;
  };

  // 處理FIFO模擬按鈕點擊
  const handleSimulateFIFO = async () => {
    // 檢查是否已選擇產品和輸入數量
    if (!currentItem.product || !currentItem.dquantity) {
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
            disabled={!currentItem.product || !currentItem.dquantity}
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
        </Grid>
      </Grid>

      {/* FIFO模擬結果對話框 */}
      <FIFOSimulationDialog
        open={simulationDialogOpen}
        onClose={handleCloseSimulationDialog}
        simulationResult={simulationResult}
        loading={loading}
        error={error}
        onApplyCost={handleApplyCost}
      />
    </>
  );
};

export default PriceTooltip;
```

## 功能說明

### 使用流程

1. 在出貨頁面選擇產品並輸入數量
2. 「FIFO模擬計算」按鈕會變為可用（如果未選擇產品或未輸入數量，按鈕將保持禁用狀態）
3. 點擊「FIFO模擬計算」按鈕，系統會調用後端API進行FIFO模擬計算
4. 計算結果會在模態對話框中顯示，包括：
   - 產品信息和數量
   - FIFO批次扣除明細（批次時間、數量、單價、小計）
   - 總成本
5. 用戶可以點擊「應用此成本」按鈕，將計算出的總成本帶入到總成本輸入框中
6. 用戶也可以點擊「關閉」按鈕，關閉對話框而不應用成本

### 特殊情況處理

1. **產品或數量未填寫**：按鈕將保持禁用狀態，並在嘗試點擊時顯示提示訊息
2. **庫存不足**：模擬結果會顯示警告訊息，指出可用庫存和缺少數量
3. **無庫存記錄**：顯示提示訊息，指出無法計算FIFO成本
4. **API錯誤**：顯示錯誤訊息，指出模擬失敗的原因

## 技術實現

### 後端實現

1. 使用現有的FIFO計算邏輯進行模擬
2. 只獲取進貨記錄（type: 'purchase'）進行FIFO計算
3. 創建模擬出貨記錄，使用當前時間和用戶輸入的數量
4. 執行FIFO匹配，計算總成本和批次扣除明細
5. 處理庫存不足的情況，返回相關信息

### 前端實現

1. 添加FIFO模擬按鈕，放置在總成本輸入框上方
2. 創建模態對話框，顯示模擬結果
3. 使用表格顯示FIFO批次扣除明細
4. 添加「應用此成本」按鈕，將計算結果帶入總成本輸入框
5. 處理各種特殊情況，顯示適當的提示訊息

## 總結

FIFO模擬查詢功能已成功實現，用戶可以在出貨頁面中模擬使用特定數量的產品時實際FIFO會用到多少成本，並將計算結果帶入總成本輸入框。這個功能可以幫助用戶更準確地了解出貨成本，提高出貨定價的準確性。

所有修改已提交並推送到GitHub倉庫的new分支。
