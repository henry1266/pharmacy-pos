/**
 * @file 銷售詳情頁面
 * @description 顯示單筆銷售記錄的詳細信息，包括基本信息、金額信息和銷售項目
 */

import React, { useState, useEffect, FC } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { ApiResponse } from '@pharmacy-pos/shared/types/api';

import DetailLayout from '@/components/DetailLayout';
import MainContent from '../components/detail/MainContent';
import SaleInfoSidebar from '../components/detail/SaleInfoSidebar';
import { Sale, FifoData } from '../types/detail';

/**
 * 銷售詳情頁面組件
 * 顯示單筆銷售記錄的詳細信息，包括基本信息、金額信息和銷售項目
 */
const SalesDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const [sale, setSale] = useState<Sale | null>(null);
  const [fifoData, setFifoData] = useState<FifoData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [fifoLoading, setFifoLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fifoError, setFifoError] = useState<string | null>(null);
  const [showSalesProfitColumns, setShowSalesProfitColumns] = useState<boolean>(true);

  /**
   * 獲取銷售數據
   */
  const fetchSaleData = async (): Promise<void> => {
    try {
      setLoading(true);
      
      const response = await axios.get<ApiResponse<Sale>>(`/api/sales/${id}`);
      
      // 檢查 API 回應格式
      if (response.data?.success && response.data?.data) {
        // 驗證銷售資料的完整性
        const saleData = response.data.data;
        
        if (!saleData._id) {
          throw new Error('銷售資料格式不正確：缺少 ID');
        }
        
        if (!saleData.items || !Array.isArray(saleData.items)) {
          throw new Error('銷售資料格式不正確：缺少或無效的項目列表');
        }
        
        // 檢查每個銷售項目的商品資料
        const validatedItems = saleData.items.map((item, index) => {
          if (!item.product && !item.name) {
            console.warn(`銷售項目 ${index + 1} 缺少商品資訊`);
            return {
              ...item,
              name: item.name ?? '未知商品'
            };
          }
          
          // 確保商品資料完整性
          if (item.product && typeof item.product === 'object') {
            return {
              ...item,
              product: {
                _id: item.product._id ?? '',
                name: item.product.name ?? '未知商品',
                code: (item.product as any).code ?? ''
              }
            };
          }
          
          return item;
        });
        
        setSale({
          ...saleData,
          items: validatedItems
        });
        setError(null);
      } else {
        throw new Error('API 回應格式不正確');
      }
    } catch (err: any) {
      console.error('獲取銷售數據失敗:', err);
      let errorMsg = '獲取銷售數據失敗';
      
      if (err.response?.data?.message) {
        errorMsg += ': ' + err.response.data.message;
      } else if (err.message) {
        errorMsg += ': ' + err.message;
      }
      
      setError(errorMsg);
      setSale(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 獲取FIFO數據
   */
  const fetchFifoData = async (): Promise<void> => {
    try {
      setFifoLoading(true);
      
      console.log('🔍 開始獲取 FIFO 數據，銷售ID:', id);
      const response = await axios.get(`/api/fifo/sale/${id}`);
      
      console.log('📡 FIFO API 原始回應:', response.data);
      console.log('📊 回應狀態:', response.status);
      console.log('📋 回應標頭:', response.headers);
      
      // 後端回傳格式：{ success: true, items: [...], summary: {...} }
      if (response.data && response.data.success && response.data.summary) {
        console.log('✅ FIFO API 回應格式正確');
        console.log('💰 Summary 資料:', response.data.summary);
        console.log('📦 Items 資料:', response.data.items);
        
        // 直接使用後端回傳的格式，將 items 和 summary 組合成 FifoData
        const fifoData: FifoData = {
          summary: response.data.summary,
          items: response.data.items || []
        };
        
        console.log('🎯 處理後的 FifoData:', fifoData);
        setFifoData(fifoData);
        setFifoError(null);
      } else {
        console.error('❌ FIFO API 回應格式不正確:', response.data);
        throw new Error('FIFO API 回應格式不正確');
      }
    } catch (err: any) {
      console.error('💥 獲取FIFO毛利數據失敗:', err);
      console.error('📄 錯誤詳情:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: err.config
      });
      
      let errorMsg = '獲取FIFO毛利數據失敗';
      
      if (err.response?.data?.message) {
        errorMsg += ': ' + err.response.data.message;
      } else if (err.message) {
        errorMsg += ': ' + err.message;
      }
      
      setFifoError(errorMsg);
      setFifoData(null);
    } finally {
      setFifoLoading(false);
    }
  };

  /**
   * 初始化數據
   */
  useEffect(() => {
    if (id) {
      fetchSaleData();
      fetchFifoData();
    }
  }, [id]);

  /**
   * 切換銷售項目毛利欄位顯示
   */
  const handleToggleSalesProfitColumns = (): void => {
    setShowSalesProfitColumns(!showSalesProfitColumns);
  };

  // 渲染主要內容
  const mainContent = (
    <MainContent
      sale={sale}
      fifoLoading={fifoLoading}
      fifoError={fifoError}
      fifoData={fifoData}
      showSalesProfitColumns={showSalesProfitColumns}
      handleToggleSalesProfitColumns={handleToggleSalesProfitColumns}
    />
  );

  // 渲染側邊欄內容
  const sidebarContent = sale ? <SaleInfoSidebar sale={sale} /> : null;

  // 使用DetailLayout渲染頁面
  return (
    <DetailLayout
      pageTitle="銷售單詳情"
      recordIdentifier={sale?.saleNumber || ''}
      listPageUrl="/sales"
      editPageUrl={`/sales/edit/${id}`}
      printPageUrl={`/sales/print/${id}`}
      mainContent={mainContent}
      sidebarContent={sidebarContent}
      isLoading={loading}
      errorContent={error ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error" variant="h6">{error}</Typography>
        </Box>
      ) : null}
    />
  );
};

export default SalesDetailPage;