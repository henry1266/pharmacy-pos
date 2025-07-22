import React, { useState, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Autocomplete,
  ListItem,
  ListItemText,
  Typography,
  Chip
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { Package } from '@pharmacy-pos/shared/types/package';

// 定義產品的型別
interface Product {
  _id: string;
  name: string;
  code?: string;
  shortCode?: string;
  barcode?: string;
  healthInsuranceCode?: string;
  price?: number;
  sellingPrice?: number;
}

// 統一的搜尋項目類型
type SearchItem = Product | Package;

interface SalesProductInputProps {
  products: Product[];
  packages: Package[];
  barcodeInputRef: React.RefObject<HTMLInputElement>;
  onSelectProduct: (product: Product) => void;
  onSelectPackage: (packageItem: Package) => void;
  showSnackbar: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void;
}

const SalesProductInput: React.FC<SalesProductInputProps> = ({
  products,
  packages,
  barcodeInputRef,
  onSelectProduct,
  onSelectPackage,
  showSnackbar
}) => {
  const [barcode, setBarcode] = useState<string>('');
  const [filteredItems, setFilteredItems] = useState<SearchItem[]>([]);
  const isProcessingRef = useRef<boolean>(false);
  const lastSelectedItemRef = useRef<string | null>(null);

  // 判斷是否為套餐
  const isPackage = (item: SearchItem): item is Package => {
    return 'totalPrice' in item && 'items' in item;
  };

  // 我們使用自定義的 filteredItems 狀態來控制選項，不需要 filterOptions

  // When user types, filter from both products and packages
  const handleBarcodeAutocompleteChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setBarcode(value);
    
    // 每次輸入變化時都重新開始搜尋，清空之前的結果
    if (value.trim() !== '') {
      const searchTerm = value.trim().toLowerCase();
      
      // 搜尋產品
      const productResults = products.filter(product =>
        product.name?.toLowerCase().includes(searchTerm) ||
        product.code?.toLowerCase().includes(searchTerm) ||
        product.shortCode?.toLowerCase().includes(searchTerm) ||
        product.barcode?.toLowerCase().includes(searchTerm) ||
        product.healthInsuranceCode?.toLowerCase().includes(searchTerm)
      );

      // 搜尋套餐
      const packageResults = packages.filter(pkg =>
        pkg.name?.toLowerCase().includes(searchTerm) ||
        pkg.code?.toLowerCase().includes(searchTerm) ||
        pkg.shortCode?.toLowerCase().includes(searchTerm)
      );

      // 合併結果，套餐優先顯示
      const allResults = [...packageResults, ...productResults].slice(0, 20);
      setFilteredItems(allResults);
    } else {
      // 當輸入為空時，確保清空搜尋結果
      setFilteredItems([]);
    }
  };

  const handleBarcodeSubmit = (): void => {
    if (!barcode.trim()) return;

    try {
      // 嘗試精確匹配
      if (filteredItems.length > 0) {
        // 優先使用精確匹配
        const exactMatch = filteredItems.find(item => {
          if (isPackage(item)) {
            return String(item.code) === barcode.trim() || 
                   String(item.shortCode) === barcode.trim();
          } else {
            return String(item.code) === barcode.trim() || 
                   String(item.barcode) === barcode.trim() || 
                   String(item.shortCode) === barcode.trim() ||
                   String(item.healthInsuranceCode) === barcode.trim();
          }
        });
        
        if (exactMatch) {
          if (isPackage(exactMatch)) {
            if (onSelectPackage) {
              onSelectPackage(exactMatch);
            } else {
              showSnackbar('套餐選擇功能尚未實作', 'warning');
            }
          } else {
            onSelectProduct(exactMatch);
          }
        } else {
          // 如果沒有精確匹配，顯示警告
          showSnackbar(`找不到與 "${barcode}" 精確匹配的產品或套餐，請從下拉選單選擇`, 'warning');
          return; // 提前返回，不清空輸入框，讓用戶可以從下拉選單選擇
        }
      } else {
        // 在所有產品和套餐中查找精確匹配
        const product = products.find(
          p => String(p.barcode) === barcode.trim() || 
               String(p.code) === barcode.trim() || 
               String(p.shortCode) === barcode.trim() ||
               String(p.healthInsuranceCode) === barcode.trim()
        );
        
        const packageItem = packages.find(
          pkg => String(pkg.code) === barcode.trim() || 
                 String(pkg.shortCode) === barcode.trim()
        );
        
        if (product) {
          onSelectProduct(product);
        } else if (packageItem) {
          if (onSelectPackage) {
            onSelectPackage(packageItem);
          } else {
            showSnackbar('套餐選擇功能尚未實作', 'warning');
          }
        } else {
          showSnackbar(`找不到條碼/代碼 ${barcode} 對應的產品或套餐`, 'warning');
        }
      }
    } catch (err: any) {
      console.error('處理條碼失敗:', err);
      showSnackbar('處理條碼失敗: ' + err.message, 'error');
    }

    // 確保完全清空狀態
    setBarcode('');
    setFilteredItems([]);
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  const renderOption = (props: any, option: SearchItem): React.ReactNode => (
    <ListItem {...props} key={option._id || (option as Package).id}>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ color: 'black' }}>{option.name}</Typography>
            {isPackage(option) && (
              <Chip 
                label="套餐" 
                size="small" 
                color="primary" 
                variant="outlined"
              />
            )}
          </Box>
        }
        secondary={
          <>
            {isPackage(option) ? (
              <>
                <Typography variant="body2" sx={{ color: 'black' }}>
                  套餐編號: {option.code} | 簡碼: {option.shortCode || 'N/A'}
                </Typography>
                <Typography variant="body2" display="block" sx={{ color: 'black' }}>
                  總價: ${option.totalPrice?.toFixed(0) || 'N/A'} | 包含 {option.items?.length || 0} 項商品
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="body2" sx={{ color: 'black' }}>
                  代碼: {option.code || 'N/A'} | 健保碼: {(option as Product).healthInsuranceCode || 'N/A'}
                </Typography>
                <Typography variant="body2" display="block" sx={{ color: 'black' }}>
                  價格: ${((option as Product).sellingPrice ?? (option as Product).price)?.toFixed(0) || 'N/A'}
                </Typography>
              </>
            )}
          </>
        }
      />
    </ListItem>
  );

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Autocomplete
        freeSolo
        fullWidth
        options={filteredItems}
        getOptionLabel={(option) =>
          typeof option === 'string' ? option : option.name ?? ''
        }
        filterOptions={(options) => options} // 不進行額外過濾，直接使用 filteredItems
        value={null} // 不設置 value，讓 Autocomplete 自己管理選擇狀態
        inputValue={barcode}
        onInputChange={(event, newValue, reason) => {
          if (reason === 'input') {
            setBarcode(newValue);
            handleBarcodeAutocompleteChange({ target: { value: newValue } } as React.ChangeEvent<HTMLInputElement>);
          } else if (reason === 'clear') {
            // 當用戶清空輸入時，確保清空所有狀態
            setBarcode('');
            setFilteredItems([]);
          } else if (reason === 'reset') {
            // 當選擇項目後重置時，確保清空狀態
            setBarcode('');
            setFilteredItems([]);
          }
        }}
        onChange={(event, newValue) => {
          // 只處理有效的選擇項目
          if (!newValue || typeof newValue === 'string') {
            return;
          }
          
          // 防止重複觸發的嚴格檢查
          if (isProcessingRef.current) {
            console.log('onChange blocked - already processing');
            return;
          }
          
          const itemId = isPackage(newValue) ? newValue._id || newValue.id : newValue._id;
          
          // 檢查是否是重複選擇同一個項目
          if (lastSelectedItemRef.current === itemId) {
            console.log('onChange blocked - same item already selected:', itemId);
            return;
          }
          
          // 立即設置處理標誌和記錄選擇的項目
          isProcessingRef.current = true;
          lastSelectedItemRef.current = itemId;
          
          console.log('Processing selection:', newValue.name, 'ID:', itemId);
          
          try {
            // 立即處理選擇，不使用 setTimeout
            if (isPackage(newValue)) {
              if (onSelectPackage) {
                onSelectPackage(newValue);
              } else {
                showSnackbar('套餐選擇功能尚未實作', 'warning');
              }
            } else {
              onSelectProduct(newValue);
            }
            
            // 選擇商品後立即清空所有狀態
            setBarcode('');
            setFilteredItems([]);
            
            // 重新聚焦到輸入框
            if (barcodeInputRef.current) {
              barcodeInputRef.current.focus();
            }
          } catch (error) {
            console.error('處理選擇項目時發生錯誤:', error);
            showSnackbar('處理選擇項目時發生錯誤', 'error');
          } finally {
            // 延遲重置處理標誌，確保不會立即被重複觸發
            setTimeout(() => {
              isProcessingRef.current = false;
              lastSelectedItemRef.current = null;
            }, 300);
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            inputRef={barcodeInputRef}
            label="掃描條碼 / 輸入產品名稱、代碼、健保碼或套餐"
            variant="outlined"
            size="small"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                // 檢查是否有下拉選單打開
                // 如果有選項且下拉選單可見，讓 Autocomplete 處理 Enter 鍵
                if (filteredItems.length > 0) {
                  // 有搜尋結果，讓 Autocomplete 處理鍵盤導航和選擇
                  return;
                } else {
                  // 沒有搜尋結果，執行提交邏輯
                  e.preventDefault();
                  handleBarcodeSubmit();
                }
              }
            }}
          />
        )}
        renderOption={renderOption}
        ListboxProps={{ style: { maxHeight: 200, overflow: 'auto' } }}
        sx={{ flexGrow: 1, mr: 1 }}
      />
      <IconButton color="primary" onClick={handleBarcodeSubmit} aria-label="添加產品">
        <AddIcon />
      </IconButton>
    </Box>
  );
};

export default SalesProductInput;