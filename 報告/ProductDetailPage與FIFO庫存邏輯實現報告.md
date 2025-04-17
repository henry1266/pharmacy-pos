# 藥局POS系統功能擴充報告

## 1. 專案概述

本報告詳細記錄了對藥局POS系統的兩項主要功能擴充：
1. 新增ProductDetailPage頁面
2. 實現FIFO庫存邏輯及銷售毛利計算

這些功能擴充旨在提升系統的使用體驗和庫存管理能力，使用戶能夠更詳細地查看產品信息，並通過FIFO（先進先出）原則準確計算庫存成本和銷售毛利。

## 2. 功能實現詳情

### 2.1 ProductDetailPage頁面實現

#### 2.1.1 功能描述

ProductDetailPage頁面提供了產品的詳細信息展示，包括：
- 基本產品信息（名稱、編號、分類等）
- 庫存記錄
- FIFO毛利計算
- 產品統計信息

該頁面整合了現有的ProductDetailCard和InventoryList組件，並新增了FIFO毛利計算功能，為用戶提供全面的產品信息視圖。

#### 2.1.2 實現方式

新增了以下文件：
- `/frontend/src/pages/ProductDetailPage.js`：產品詳情頁面主組件

頁面結構包括：
1. 頁面標題和操作按鈕（返回、編輯、列印）
2. 產品詳情卡片（使用現有的ProductDetailCard組件）
3. 庫存記錄（使用現有的InventoryList組件）
4. FIFO毛利計算（使用新增的FIFOProfitCalculator組件）
5. 產品統計信息

頁面設計遵循了系統現有的UI風格和組件結構，確保與整體系統風格一致。

### 2.2 FIFO庫存邏輯實現

#### 2.2.1 功能描述

FIFO庫存邏輯實現了以下功能：
- 根據先進先出原則計算庫存成本
- 計算銷售毛利和毛利率
- 提供詳細的成本分佈和毛利明細

該功能使用戶能夠準確了解每筆銷售的成本構成和毛利情況，有助於進行更精確的財務分析和庫存管理。

#### 2.2.2 實現方式

後端實現：
1. 新增了FIFO計算工具模塊：
   - `/backend/utils/fifoCalculator.js`：實現了matchFIFOBatches函數及相關輔助函數

2. 新增了FIFO API路由：
   - `/backend/routes/fifo.js`：提供了計算FIFO成本和毛利的API端點

3. 更新了後端主應用程序：
   - 修改了`/backend/server.js`：添加了新的FIFO路由配置

前端實現：
1. 新增了FIFO毛利計算組件：
   - `/frontend/src/components/products/FIFOProfitCalculator.js`：顯示FIFO計算結果的組件

2. 更新了產品詳情頁面：
   - 修改了`/frontend/src/pages/ProductDetailPage.js`：整合了FIFOProfitCalculator組件

#### 2.2.3 FIFO計算邏輯

FIFO計算邏輯基於以下步驟：
1. 將庫存記錄分為進貨（stockIn）和出貨（stockOut）兩類
2. 按時間順序排序，確保先進先出
3. 對每筆出貨，從最早的進貨批次開始匹配，直到滿足出貨數量
4. 記錄每筆出貨的成本分佈（來自哪些進貨批次）
5. 計算銷售毛利（銷售收入 - 成本）和毛利率

這種方法確保了庫存成本計算的準確性和一致性，符合會計準則和庫存管理最佳實踐。

## 3. 代碼實現詳情

### 3.1 ProductDetailPage.js

```jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Paper,
  Divider,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

import ProductDetailCard from '../components/products/ProductDetailCard';
import InventoryList from '../components/common/InventoryList';
import FIFOProfitCalculator from '../components/products/FIFOProfitCalculator';

const ProductDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [product, setProduct] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        
        // 獲取供應商列表
        const suppliersResponse = await axios.get('/api/suppliers');
        setSuppliers(suppliersResponse.data);
        
        // 獲取產品詳情
        const productResponse = await axios.get(`/api/products/${id}`);
        
        // 轉換產品數據格式，確保與ProductDetailCard組件兼容
        const productData = {
          ...productResponse.data,
          id: productResponse.data._id,
          productType: productResponse.data.productType || 'product'
        };
        
        setProduct(productData);
        setLoading(false);
      } catch (err) {
        console.error('獲取產品詳情失敗:', err);
        setError(err.response?.data?.message || '獲取產品詳情失敗');
        setLoading(false);
      }
    };
    
    if (id) {
      fetchProductData();
    }
  }, [id]);
  
  // 處理返回按鈕點擊
  const handleBack = () => {
    navigate('/products');
  };
  
  // 處理編輯按鈕點擊
  const handleEdit = () => {
    navigate('/products', { state: { editProductId: id, productType: product?.productType } });
  };
  
  // 處理刪除產品
  const handleDeleteProduct = async (productId) => {
    try {
      await axios.delete(`/api/products/${productId}`);
      navigate('/products');
    } catch (err) {
      console.error('刪除產品失敗:', err);
      setError(err.response?.data?.message || '刪除產品失敗');
    }
  };
  
  // 載入中狀態
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // 錯誤狀態
  if (error) {
    return (
      <Box>
        <Typography color="error" variant="h6">
          載入產品詳情時發生錯誤: {error}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          返回產品列表
        </Button>
      </Box>
    );
  }
  
  // 產品不存在
  if (!product) {
    return (
      <Box>
        <Typography variant="h6">
          找不到產品
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          返回產品列表
        </Button>
      </Box>
    );
  }
  
  // 正常渲染產品詳情
  return (
    <Box>
      {/* 頁面標題和操作按鈕 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          產品詳情
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ mr: 1 }}
          >
            返回列表
          </Button>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={handleEdit}
            sx={{ mr: 1 }}
          >
            編輯
          </Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
          >
            列印
          </Button>
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        {/* 產品詳情卡片 */}
        <Grid item xs={12}>
          <ProductDetailCard
            product={product}
            suppliers={suppliers}
            handleEditProduct={() => handleEdit()}
            handleDeleteProduct={() => handleDeleteProduct(product.id)}
          />
        </Grid>
        
        {/* 庫存記錄 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                庫存記錄
              </Typography>
              <InventoryList productId={product.id} />
            </CardContent>
          </Card>
        </Grid>
        
        {/* FIFO毛利計算 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <FIFOProfitCalculator productId={product.id} />
            </CardContent>
          </Card>
        </Grid>
        
        {/* 產品統計信息 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                產品統計
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    產品類型
                  </Typography>
                  <Typography variant="body1">
                    {product.productType === 'medicine' ? (
                      <Chip size="small" color="primary" label="藥品" />
                    ) : (
                      <Chip size="small" color="secondary" label="一般商品" />
                    )}
                  </Typography>
                </Grid>
                {/* 其他產品統計信息... */}
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  創建時間: {product.createdAt ? format(new Date(product.createdAt), 'yyyy-MM-dd HH:mm:ss') : '未知'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  最後更新: {product.updatedAt ? format(new Date(product.updatedAt), 'yyyy-MM-dd HH:mm:ss') : '未知'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProductDetailPage;
```

### 3.2 fifoCalculator.js

```javascript
/**
 * FIFO庫存計算工具
 * 根據先進先出原則計算庫存成本和銷售毛利
 */

/**
 * 根據FIFO原則匹配進貨批次和出貨記錄
 * @param {Array} stockIn - 進貨記錄數組，每個記錄包含timestamp、quantity和unit_price
 * @param {Array} stockOut - 出貨記錄數組，每個記錄包含timestamp、quantity和drug_id
 * @returns {Array} 出貨成本分佈結果
 */
const matchFIFOBatches = (stockIn, stockOut) => {
  const batches = []; // 會被消耗的進貨批次
  const usageLog = []; // 每筆出貨成本分佈結果

  let inIndex = 0;
  for (const out of stockOut) {
    let remaining = out.quantity;
    const costParts = [];

    while (remaining > 0) {
      // 若還沒進貨或進貨批次都用完，往後拉更多進貨
      if (inIndex >= stockIn.length) {
        throw new Error("Insufficient stock to match FIFO cost");
      }

      const batch = stockIn[inIndex];
      if (!batch.remainingQty) batch.remainingQty = batch.quantity;

      if (batch.remainingQty > 0) {
        const used = Math.min(batch.remainingQty, remaining);
        costParts.push({
          batchTime: batch.timestamp,
          unit_price: batch.unit_price,
          quantity: used,
        });
        batch.remainingQty -= used;
        remaining -= used;
      }

      if (batch.remainingQty === 0) inIndex++; // 此批扣完，移至下一批
    }

    usageLog.push({
      outTime: out.timestamp,
      drug_id: out.drug_id,
      totalQuantity: out.quantity,
      costParts, // 此筆出貨的成本分佈（哪幾批扣了多少）
    });
  }

  return usageLog;
};

/**
 * 計算銷售毛利
 * @param {Array} usageLog - FIFO匹配結果
 * @param {Array} sales - 銷售記錄，包含售價信息
 * @returns {Array} 銷售毛利計算結果
 */
const calculateProfitMargins = (usageLog, sales) => {
  return usageLog.map(usage => {
    // 找到對應的銷售記錄
    const sale = sales.find(s => 
      s.drug_id === usage.drug_id && 
      new Date(s.timestamp).getTime() === new Date(usage.outTime).getTime()
    );
    
    if (!sale) return null;
    
    // 計算總成本
    const totalCost = usage.costParts.reduce((sum, part) => {
      return sum + (part.unit_price * part.quantity);
    }, 0);
    
    // 計算銷售總額
    const totalRevenue = sale.unit_price * usage.totalQuantity;
    
    // 計算毛利
    const grossProfit = totalRevenue - totalCost;
    const profitMargin = (grossProfit / totalRevenue) * 100;
    
    return {
      drug_id: usage.drug_id,
      saleTime: usage.outTime,
      totalQuantity: usage.totalQuantity,
      totalCost,
      totalRevenue,
      grossProfit,
      profitMargin: profitMargin.toFixed(2) + '%',
      costBreakdown: usage.costParts
    };
  }).filter(result => result !== null);
};

/**
 * 將庫存記錄轉換為FIFO計算所需的格式
 * @param {Array} inventories - 庫存記錄
 * @returns {Object} 包含stockIn和stockOut的對象
 */
const prepareInventoryForFIFO = (inventories) => {
  const stockIn = [];
  const stockOut = [];
  
  inventories.forEach(inv => {
    const timestamp = inv.lastUpdated || new Date();
    const quantity = Math.abs(inv.quantity);
    const unit_price = inv.totalAmount ? (inv.totalAmount / quantity) : 0;
    const drug_id = inv.product.toString();
    
    if (inv.type === 'purchase') {
      stockIn.push({
        timestamp,
        quantity,
        unit_price,
        drug_id,
        source_id: inv._id.toString()
      });
    } else if (inv.type === 'sale' || inv.type === 'ship') {
      stockOut.push({
        timestamp,
        quantity,
        drug_id,
        source_id: inv._id.toString(),
        type: inv.type
      });
    }
  });
  
  // 按時間排序，確保先進先出
  stockIn.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  stockOut.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  return { stockIn, stockOut };
};

/**
 * 計算產品的FIFO庫存成本和銷售毛利
 * @param {Array} inventories - 產品的庫存記錄
 * @returns {Object} FIFO計算結果
 */
const calculateProductFIFO = (inventories) => {
  try {
    // 準備數據
    const { stockIn, stockOut } = prepareInventoryForFIFO(inventories);
    
    // 如果沒有出貨記錄，直接返回空結果
    if (stockOut.length === 0) {
      return {
        success: true,
        fifoMatches: [],
        profitMargins: [],
        summary: {
          totalCost: 0,
          totalRevenue: 0,
          totalProfit: 0,
          averageProfitMargin: '0.00%'
        }
      };
    }
    
    // 執行FIFO匹配
    const fifoMatches = matchFIFOBatches(stockIn, stockOut);
    
    // 計算銷售毛利
    const sales = stockOut.map(out => ({
      drug_id: out.drug_id,
      timestamp: out.timestamp,
      unit_price: inventories.find(inv => 
        inv._id.toString() === out.source_id
      )?.totalAmount / Math.abs(out.quantity) || 0
    }));
    
    const profitMargins = calculateProfitMargins(fifoMatches, sales);
    
    // 計算總結
    const summary = profitMargins.reduce((sum, item) => {
      sum.totalCost += item.totalCost;
      sum.totalRevenue += item.totalRevenue;
      sum.totalProfit += item.grossProfit;
      return sum;
    }, {
      totalCost: 0,
      totalRevenue: 0,
      totalProfit: 0
    });
    
    // 計算平均毛利率
    summary.averageProfitMargin = summary.totalRevenue > 0 
      ? ((summary.totalProfit / summary.totalRevenue) * 100).toFixed(2) + '%' 
      : '0.00%';
    
    return {
      success: true,
      fifoMatches,
      profitMargins,
      summary
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  matchFIFOBatches,
  calculateProfitMargins,
  prepareInventoryForFIFO,
  calculateProductFIFO
};
```

### 3.3 fifo.js (API路由)

```javascript
const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const { calculateProductFIFO } = require('../utils/fifoCalculator');

// @route   GET api/fifo/product/:productId
// @desc    Calculate FIFO cost and profit margins for a product
// @access  Public
router.get('/product/:productId', async (req, res) => {
  try {
    // 獲取產品的所有庫存記錄
    const inventories = await Inventory.find({ product: req.params.productId })
      .populate('product')
      .sort({ lastUpdated: 1 }); // 按時間排序，確保先進先出
    
    if (inventories.length === 0) {
      return res.status(404).json({ msg: '找不到該產品的庫存記錄' });
    }
    
    // 計算FIFO成本和毛利
    const fifoResult = calculateProductFIFO(inventories);
    
    res.json(fifoResult);
  } catch (err) {
    console.error('FIFO計算錯誤:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   GET api/fifo/all
// @desc    Calculate FIFO cost and profit margins for all products
// @access  Public
router.get('/all', async (req, res) => {
  try {
    // 獲取所有產品ID
    const productIds = await Inventory.distinct('product');
    
    const results = [];
    
    // 為每個產品計算FIFO成本和毛利
    for (const productId of productIds) {
      const inventories = await Inventory.find({ product: productId })
        .populate('product')
        .sort({ lastUpdated: 1 });
      
      if (inventories.length > 0) {
        const fifoResult = calculateProductFIFO(inventories);
        
        // 添加產品信息
        const productInfo = inventories[0].product;
        
        results.push({
          productId,
          productName: productInfo.name,
          productCode: productInfo.code,
          ...fifoResult
        });
      }
    }
    
    // 計算總體摘要
    const overallSummary = results.reduce((sum, result) => {
      if (result.success && result.summary) {
        sum.totalCost += result.summary.totalCost || 0;
        sum.totalRevenue += result.summary.totalRevenue || 0;
        sum.totalProfit += result.summary.totalProfit || 0;
      }
      return sum;
    }, {
      totalCost: 0,
      totalRevenue: 0,
      totalProfit: 0
    });
    
    // 計算總體平均毛利率
    overallSummary.averageProfitMargin = overallSummary.totalRevenue > 0 
      ? ((overallSummary.totalProfit / overallSummary.totalRevenue) * 100).toFixed(2) + '%' 
      : '0.00%';
    
    res.json({
      results,
      overallSummary
    });
  } catch (err) {
    console.error('FIFO計算錯誤:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

module.exports = router;
```

### 3.4 FIFOProfitCalculator.js

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress
} from '@mui/material';

const FIFOProfitCalculator = ({ productId }) => {
  const [fifoData, setFifoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFIFOData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/fifo/product/${productId}`);
        setFifoData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('獲取FIFO數據失敗:', err);
        setError(err.response?.data?.message || '獲取FIFO數據失敗');
        setLoading(false);
      }
    };

    if (productId) {
      fetchFIFOData();
    }
  }, [productId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error" variant="body2">{error}</Typography>
      </Box>
    );
  }

  if (!fifoData || !fifoData.success) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2">
          {fifoData?.error || '無法計算FIFO數據'}
        </Typography>
      </Box>
    );
  }

  if (fifoData.profitMargins.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2">無銷售記錄，無法計算毛利</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        FIFO毛利計算
      </Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            毛利摘要
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <Box sx={{ mr: 3, mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                總成本:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                ${fifoData.summary.totalCost.toFixed(2)}
              </Typography>
            </Box>
            <Box sx={{ mr: 3, mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                總收入:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                ${fifoData.summary.totalRevenue.toFixed(2)}
              </Typography>
            </Box>
            <Box sx={{ mr: 3, mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                總毛利:
              </Typography>
              <Typography 
                variant="body1" 
                fontWeight="medium"
                color={fifoData.summary.totalProfit >= 0 ? 'success.main' : 'error.main'}
              >
                ${fifoData.summary.totalProfit.toFixed(2)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                平均毛利率:
              </Typography>
              <Typography 
                variant="body1" 
                fontWeight="medium"
                color={parseFloat(fifoData.summary.averageProfitMargin) >= 0 ? 'success.main' : 'error.main'}
              >
                {fifoData.summary.averageProfitMargin}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="subtitle1" gutterBottom>
        銷售毛利明細
      </Typography>
      <TableContainer component={Paper} sx={{ maxHeight: 300, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>銷售時間</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>數量</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>成本</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>收入</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>毛利</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>毛利率</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fifoData.profitMargins.map((item, index) => (
              <TableRow 
                key={index}
                sx={{ 
                  '&:nth-of-type(odd)': { backgroundColor: '#fafafa' },
                  '&:hover': { backgroundColor: '#f1f1f1' }
                }}
              >
                <TableCell>
                  {new Date(item.saleTime).toLocaleString()}
                </TableCell>
                <TableCell align="right">{item.totalQuantity}</TableCell>
                <TableCell align="right">${item.totalCost.toFixed(2)}</TableCell>
                <TableCell align="right">${item.totalRevenue.toFixed(2)}</TableCell>
                <TableCell 
                  align="right"
                  sx={{ 
                    color: item.grossProfit >= 0 ? 'success.main' : 'error.main',
                    fontWeight: 'medium'
                  }}
                >
                  ${item.grossProfit.toFixed(2)}
                </TableCell>
                <TableCell 
                  align="right"
                  sx={{ 
                    color: parseFloat(item.profitMargin) >= 0 ? 'success.main' : 'error.main',
                    fontWeight: 'medium'
                  }}
                >
                  {item.profitMargin}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle1" gutterBottom>
        FIFO成本分佈
      </Typography>
      <TableContainer component={Paper} sx={{ maxHeight: 300, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>銷售時間</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>批次時間</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>單價</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>數量</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>小計</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fifoData.fifoMatches.flatMap((match, matchIndex) => 
              match.costParts.map((part, partIndex) => (
                <TableRow 
                  key={`${matchIndex}-${partIndex}`}
                  sx={{ 
                    '&:nth-of-type(odd)': { backgroundColor: '#fafafa' },
                    '&:hover': { backgroundColor: '#f1f1f1' },
                    backgroundColor: partIndex === 0 && match.costParts.length > 1 ? '#f0f7ff' : undefined
                  }}
                >
                  {partIndex === 0 ? (
                    <TableCell rowSpan={match.costParts.length}>
                      {new Date(match.outTime).toLocaleString()}
                    </TableCell>
                  ) : null}
                  <TableCell>{new Date(part.batchTime).toLocaleString()}</TableCell>
                  <TableCell align="right">${part.unit_price.toFixed(2)}</TableCell>
                  <TableCell align="right">{part.quantity}</TableCell>
                  <TableCell align="right">${(part.unit_price * part.quantity).toFixed(2)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default FIFOProfitCalculator;
```

## 4. 系統整合

為了將新功能整合到現有系統中，進行了以下更改：

1. 在後端server.js中添加了新的FIFO路由配置：
```javascript
app.use('/api/fifo', require('./routes/fifo')); // 新增FIFO路由
```

2. 在前端ProductDetailPage頁面中整合了FIFOProfitCalculator組件，提供FIFO毛利計算功能。

## 5. 測試結果

功能測試結果顯示：

1. ProductDetailPage頁面能夠正確顯示產品詳情，包括基本信息、庫存記錄和統計信息。
2. FIFO庫存邏輯能夠正確計算庫存成本和銷售毛利，並在FIFOProfitCalculator組件中顯示。
3. 系統能夠處理各種庫存情況，包括多批次進貨和出貨。

## 6. 總結

本次功能擴充成功實現了ProductDetailPage頁面和FIFO庫存邏輯，為藥局POS系統增加了重要的產品詳情查看和庫存成本計算功能。這些功能將幫助用戶更好地管理產品和庫存，並進行更精確的財務分析。

實現過程遵循了系統現有的架構和風格，確保了新功能與現有系統的無縫集成。同時，FIFO庫存邏輯的實現也為未來可能的庫存管理功能擴展奠定了基礎。
