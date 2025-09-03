import { useState, useEffect, SyntheticEvent } from 'react';
import axios from 'axios';
import { Product } from '@pharmacy-pos/shared/types/entities';
import { CurrentItem } from '../types';
import { processInventoryData } from '../utils/inventoryDataUtils';

interface UseProductItemFormProps {
  currentItem: CurrentItem;
  handleProductChange: (event: SyntheticEvent, product: Product | null) => void;
  handleAddItem: () => void;
  products: Product[];
}

/**
 * 產品項目表單邏輯的自定義 Hook
 */
export const useProductItemForm = ({
  currentItem,
  handleProductChange,
  handleAddItem,
  products
}: UseProductItemFormProps) => {
  const [activeInput, setActiveInput] = useState<string | null>(null);
  const [chartModalOpen, setChartModalOpen] = useState<boolean>(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    products?.find(p => p._id === currentItem.product) ?? null
  );
  // 添加狀態來跟踪當前的輸入模式（基礎單位或大包裝單位）
  const [inputMode, setInputMode] = useState<'base' | 'package'>('base');
  
  // 添加狀態來存儲實際的總數量（基礎單位的數量）和顯示的數量
  const [actualTotalQuantity, setActualTotalQuantity] = useState<number>(0);
  const [displayInputQuantity, setDisplayInputQuantity] = useState<string>('');

  // 當 currentItem 或 products 變更時更新 selectedProduct
  useEffect(() => {
    setSelectedProduct(products?.find(p => p._id === currentItem.product) ?? null);
  }, [currentItem.product, products]);

  // 當 currentItem.dquantity 變化時更新 displayInputQuantity
  useEffect(() => {
    // 如果 currentItem.dquantity 為空，則清空 displayInputQuantity
    if (currentItem.dquantity === '' || currentItem.dquantity === undefined || currentItem.dquantity === null) {
      setDisplayInputQuantity('');
      setActualTotalQuantity(0);
      setInputMode('base');
    }
  }, [currentItem.dquantity]);

  /**
   * 處理輸入框獲取焦點
   */
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setActiveInput(e.target.name);
  };

  /**
   * 獲取產品的採購價格
   * @returns 產品的採購價格，如果找不到則返回0
   */
  const getProductPurchasePrice = (): number => {
    if (!currentItem?.product) return 0;
    
    const selectedProduct = products?.find(p => p._id === currentItem.product);
    return Number(selectedProduct?.purchasePrice) || 0;
  };

  /**
   * 計算總成本
   * @param quantity 數量
   * @returns 計算後的總成本（保留兩位小數）
   */
  const calculateTotalCost = (quantity: string | number): number => {
    const purchasePrice = getProductPurchasePrice();
    const numericQuantity = parseFloat(quantity as string) || 0;
    return Number((purchasePrice * numericQuantity).toFixed(2));
  };

  /**
   * 檢查庫存是否足夠
   * @returns 庫存是否足夠的布爾值
   */
  const isInventorySufficient = (): boolean => true;

  /**
   * 處理圖表按鈕點擊
   * 獲取產品庫存和交易數據並顯示圖表
   */
  const handleChartButtonClick = async () => {
    if (!selectedProduct) return;
    
    try {
      // 調用 API 獲取產品的庫存數據
      const response = await axios.get(`/api/inventory/product/${selectedProduct._id}`);
      const inventoryData = response.data.data ?? [];
      
      // 處理庫存數據
      const processedData = processInventoryData(inventoryData);
      
      // 設置狀態並顯示圖表
      setChartData(processedData.chartTransactions);
      setInventoryData(processedData.processedInventories);
      setChartModalOpen(true);
    } catch (error) {
      console.error('獲取圖表數據失敗:', error);
      // 如果 API 調用失敗，仍然可以打開彈出視窗但顯示空數據
      setChartData([]);
      setInventoryData([]);
      setChartModalOpen(true);
    }
  };

  /**
   * 更新選中的產品並觸發產品變更事件
   * @param event 合成事件
   * @param product 選中的產品或null
   */
  const handleProductChangeWithChart = (event: SyntheticEvent, product: Product | null) => {
    setSelectedProduct(product);
    handleProductChange(event, product);
  };
  
  /**
   * 添加項目後重置所有輸入狀態
   * 重置數量輸入、總數量和輸入模式
   */
  const handleAddItemWithReset = () => {
    // 調用原始的添加項目函數
    handleAddItem();
    
    // 重置所有相關狀態
    setDisplayInputQuantity('');
    setActualTotalQuantity(0);
    setInputMode('base');
  };

  return {
    activeInput,
    chartModalOpen,
    chartData,
    inventoryData,
    selectedProduct,
    inputMode,
    actualTotalQuantity,
    displayInputQuantity,
    setActiveInput,
    setChartModalOpen,
    setChartData,
    setInventoryData,
    setSelectedProduct,
    setInputMode,
    setActualTotalQuantity,
    setDisplayInputQuantity,
    handleFocus,
    getProductPurchasePrice,
    calculateTotalCost,
    isInventorySufficient,
    handleChartButtonClick,
    handleProductChangeWithChart,
    handleAddItemWithReset
  };
};