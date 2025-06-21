/**
 * 庫存報表模組共用 Hooks
 */

import { useState, useEffect, useCallback, MouseEvent } from 'react';
import axios from 'axios';
import {
  InventoryFilterValues,
  TransactionItem,
  GroupedProduct,
  TooltipPosition,
  InventoryApiResponse
} from './types';
import {
  processInventoryData,
  buildQueryParams
} from './utils';

/**
 * 庫存數據管理 Hook
 */
export const useInventoryData = (filters: InventoryFilterValues) => {
  const [groupedData, setGroupedData] = useState<GroupedProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalInventoryQuantity, setTotalInventoryQuantity] = useState<number>(0);
  const [totalProfitLoss, setTotalProfitLoss] = useState<number>(0);
  const [totalInventoryValue, setTotalInventoryValue] = useState<number>(0);
  const [totalGrossProfit, setTotalGrossProfit] = useState<number>(0);
  const [totalIncome, setTotalIncome] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);

  // 獲取庫存數據
  const fetchInventoryData = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildQueryParams(filters);
      const response = await axios.get<InventoryApiResponse>(`/api/reports/inventory?${params.toString()}`);
      
      if (response?.data?.data) {
        const {
          groupedData: processedGroupedData,
          totalQuantity,
          profitLossSum,
          incomeSum,
          costSum
        } = processInventoryData(response.data.data);
        
        // 計算總庫存價值
        const inventoryValueSum = processedGroupedData.reduce(
          (sum, product) => sum + product.totalInventoryValue, 
          0
        );
        
        setGroupedData(processedGroupedData);
        setTotalInventoryQuantity(totalQuantity);
        setTotalProfitLoss(profitLossSum);
        setTotalInventoryValue(inventoryValueSum);
        setTotalGrossProfit(inventoryValueSum + profitLossSum);
        setTotalIncome(incomeSum);
        setTotalCost(costSum);
      }
      setError(null);
    } catch (err) {
      console.error('獲取庫存數據失敗:', err);
      setError('獲取庫存數據失敗');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchInventoryData();
  }, [fetchInventoryData]);

  return {
    groupedData,
    loading,
    error,
    totalInventoryQuantity,
    totalProfitLoss,
    totalInventoryValue,
    totalGrossProfit,
    totalIncome,
    totalCost,
    refetch: fetchInventoryData
  };
};

/**
 * 懸浮視窗狀態管理 Hook
 */
export const useTooltip = () => {
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({ top: 0, left: 0 });

  // 處理滑鼠進入
  const handleMouseEnter = useCallback((event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      top: rect.bottom,
      left: rect.left + rect.width / 2
    });
    setShowTooltip(true);
  }, []);

  // 處理滑鼠離開
  const handleMouseLeave = useCallback(() => {
    setShowTooltip(false);
  }, []);

  return {
    showTooltip,
    tooltipPosition,
    handleMouseEnter,
    handleMouseLeave
  };
};

/**
 * 表格分頁狀態管理 Hook
 */
export const usePagination = (initialRowsPerPage = 10) => {
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(initialRowsPerPage);

  // 處理頁碼變更
  const handleChangePage = useCallback((event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  }, []);

  // 處理每頁顯示筆數變更
  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  // 計算分頁後的數據
  const getPaginatedData = useCallback(<T>(data: T[]): T[] => {
    return data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [page, rowsPerPage]);

  return {
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
    getPaginatedData
  };
};

/**
 * 圖表類型狀態管理 Hook
 */
export const useChartType = (initialType: 'area' | 'line' = 'area') => {
  const [chartType, setChartType] = useState<'area' | 'line'>(initialType);

  // 處理圖表類型變更
  const handleChartTypeChange = useCallback((event: any) => {
    setChartType(event.target.value as 'area' | 'line');
  }, []);

  return {
    chartType,
    handleChartTypeChange,
    setChartType
  };
};

/**
 * 庫存摘要數據 Hook（僅用於 InventorySummary）
 */
export const useInventorySummaryData = (filters?: InventoryFilterValues) => {
  const [totalProfitLoss, setTotalProfitLoss] = useState<number>(0);
  const [totalInventoryValue, setTotalInventoryValue] = useState<number>(0);
  const [totalGrossProfit, setTotalGrossProfit] = useState<number>(0);
  const [totalIncome, setTotalIncome] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);

  // 獲取庫存數據
  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        const params = buildQueryParams(filters || {});
        const response = await axios.get<InventoryApiResponse>(`/api/reports/inventory?${params.toString()}`);
        
        if (response.data?.data) {
          const {
            groupedData,
            profitLossSum,
            incomeSum,
            costSum
          } = processInventoryData(response.data.data);
          
          // 計算總庫存價值
          const inventoryValueSum = groupedData.reduce(
            (sum, product) => sum + product.totalInventoryValue, 
            0
          );
          
          setTotalProfitLoss(profitLossSum);
          setTotalInventoryValue(inventoryValueSum);
          setTotalGrossProfit(inventoryValueSum + profitLossSum);
          setTotalIncome(incomeSum);
          setTotalCost(costSum);
        }
      } catch (err) {
        console.error('獲取庫存數據失敗:', err);
      }
    };

    fetchInventoryData();
  }, [filters]);

  return {
    totalProfitLoss,
    totalInventoryValue,
    totalGrossProfit,
    totalIncome,
    totalCost
  };
};