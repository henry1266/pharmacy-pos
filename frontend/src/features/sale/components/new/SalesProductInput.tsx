import React, { useState, useRef, useCallback, useEffect, SyntheticEvent } from 'react';
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
import {
  Add as AddIcon,
  StickyNote2 as NoteIcon
} from '@mui/icons-material';
import ProductNotePopover from '@/features/product/components/ProductNotePopover';
import { Package } from '@pharmacy-pos/shared/types/package';
import { Product, Medicine } from '@pharmacy-pos/shared/types/entities';

/**
 * 聯合類型以支持產品和藥品
 * @typedef {Product | Medicine} ProductOrMedicine
 */
type ProductOrMedicine = Product | Medicine;

/**
 * 統一的搜尋項目類型，可以是產品、藥品或套餐
 * @typedef {ProductOrMedicine | Package} SearchItem
 */
type SearchItem = ProductOrMedicine | Package;

/**
 * 銷售產品輸入組件的屬性介面
 * @interface SalesProductInputProps
 */
interface SalesProductInputProps {
  /** 可選擇的產品和藥品列表 */
  products: ProductOrMedicine[];
  /** 可選擇的套餐列表 */
  packages: Package[];
  /** 條碼輸入框的引用，用於聚焦 */
  barcodeInputRef: React.RefObject<HTMLInputElement>;
  /** 當選擇產品時的回調函數 */
  onSelectProduct: (product: ProductOrMedicine) => void;
  /** 當選擇套餐時的回調函數 */
  onSelectPackage: (packageItem: Package) => void;
  /** 顯示通知訊息的回調函數 */
  showSnackbar: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void;
}

/**
 * 銷售產品輸入組件
 *
 * 此組件提供一個搜尋框，允許用戶通過條碼掃描、輸入產品名稱、代碼或健保碼來選擇產品或套餐。
 * 支持自動完成功能，並在選擇產品後觸發相應的回調函數。
 *
 * @param {SalesProductInputProps} props - 組件屬性
 * @returns {JSX.Element} 渲染的組件
 */
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
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 筆記彈窗狀態
  const [notePopoverAnchor, setNotePopoverAnchor] = useState<HTMLElement | null>(null);
  const [selectedProductForNote, setSelectedProductForNote] = useState<ProductOrMedicine | null>(null);

  // 記錄用戶當前選擇的項目索引
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(-1);

  /**
   * 執行搜尋的防抖函數
   *
   * 使用 useCallback 包裝，確保函數引用穩定
   *
   * @param {string} searchValue - 要搜尋的值
   */
  const debouncedSearch = useCallback((searchValue: string) => {
    if (searchValue.trim() !== '') {
      const searchTerm = searchValue.trim().toLowerCase();

      // 搜尋產品
      const productResults = products.filter(product =>
        product.name?.toLowerCase().includes(searchTerm) ||
        product.code?.toLowerCase().includes(searchTerm) ||
        product.shortCode?.toLowerCase().includes(searchTerm) ||
        product.barcode?.toLowerCase().includes(searchTerm) ||
        ('healthInsuranceCode' in product && product.healthInsuranceCode?.toLowerCase().includes(searchTerm))
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
  }, [products, packages]);

  // 監聽 barcode 值的變化，使用防抖處理搜尋
  useEffect(() => {
    // 清除之前的 timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // 設置新的 timeout，延遲 300ms 執行搜尋
    debounceTimeoutRef.current = setTimeout(() => {
      debouncedSearch(barcode);
    }, 300);

    // 組件卸載時清除 timeout
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [barcode, debouncedSearch]);

  /**
   * 判斷搜尋項目是否為套餐
   *
   * 通過檢查項目是否具有 totalPrice 和 items 屬性來判斷
   *
   * @param {SearchItem} item - 要檢查的搜尋項目
   * @returns {boolean} 如果是套餐則返回 true，否則返回 false
   */
  const isPackage = (item: SearchItem): item is Package => {
    return 'totalPrice' in item && 'items' in item;
  };

  /**
   * 處理筆記圖示點擊事件
   *
   * 顯示產品筆記彈窗
   *
   * @param {React.MouseEvent<HTMLElement>} event - 點擊事件
   * @param {ProductOrMedicine} product - 被點擊的產品
   */
  const handleNoteClick = (event: React.MouseEvent<HTMLElement>, product: ProductOrMedicine) => {
    event.stopPropagation(); // 防止觸發產品選擇
    setNotePopoverAnchor(event.currentTarget);
    setSelectedProductForNote(product);
  };

  /**
   * 關閉筆記彈窗
   */
  const handleNotePopoverClose = () => {
    setNotePopoverAnchor(null);
    setSelectedProductForNote(null);
  };

  // 我們使用自定義的 filteredItems 狀態來控制選項，不需要 filterOptions

  /**
   * 處理條碼/產品名稱輸入框變化事件
   *
   * 當用戶輸入時，僅更新 barcode 狀態值
   * 實際的搜尋操作由 useEffect 中的防抖機制處理，以提高效能
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - 輸入框變化事件
   */
  const handleBarcodeAutocompleteChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setBarcode(value);
    // 不再直接執行搜尋，而是由 useEffect 中的防抖機制處理
  };

  /**
   * 處理條碼提交事件
   *
   * 當用戶按下 Enter 或點擊添加按鈕時，嘗試找到匹配的產品或套餐並選擇它
   */
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
                   ('healthInsuranceCode' in item && String(item.healthInsuranceCode) === barcode.trim());
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
          // 如果沒有精確匹配，檢查是否有用戶選擇的項目
          const selectedItem = selectedItemIndex >= 0 && selectedItemIndex < filteredItems.length
            ? filteredItems[selectedItemIndex]
            : filteredItems[0]; // 如果沒有選擇，則使用第一個項目

          if (selectedItem) {
            if (isPackage(selectedItem)) {
              if (onSelectPackage) {
                onSelectPackage(selectedItem);
                showSnackbar(`已選擇：${selectedItem.name}`, 'info');
              } else {
                showSnackbar('套餐選擇功能尚未實作', 'warning');
              }
            } else {
              onSelectProduct(selectedItem);
              showSnackbar(`已選擇：${selectedItem.name}`, 'info');
            }
          } else {
            showSnackbar(`找不到與 "${barcode}" 匹配的產品或套餐`, 'warning');
            return; // 提前返回，不清空輸入框
          }
        }
      } else {
        // 在所有產品和套餐中查找精確匹配
        const product = products.find(
          p => String(p.barcode) === barcode.trim() ||
               String(p.code) === barcode.trim() ||
               String(p.shortCode) === barcode.trim() ||
               ('healthInsuranceCode' in p && String(p.healthInsuranceCode) === barcode.trim())
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

  /**
   * 渲染自動完成選項的函數
   *
   * 自定義渲染 Autocomplete 下拉選項的外觀，顯示產品或套餐的詳細信息
   *
   * @param {any} props - MUI ListItem 的屬性
   * @param {SearchItem} option - 要渲染的選項（產品、藥品或套餐）
   * @returns {React.ReactNode} 渲染的選項元素
   */
  const renderOption = (props: any, option: SearchItem): React.ReactNode => (
    <ListItem
      {...props}
      key={option._id}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pr: 1 // 確保右側有足夠空間
      }}
    >
      <ListItemText
        sx={{ flex: 1, mr: 1 }}
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
                  代碼: {option.code || 'N/A'} | 健保碼: {('healthInsuranceCode' in option ? option.healthInsuranceCode : 'N/A') || 'N/A'}
                </Typography>
                <Typography variant="body2" display="block" sx={{ color: 'black' }}>
                  價格: ${((option as Product).sellingPrice ?? (option as Product).price)?.toFixed(0) || 'N/A'}
                </Typography>
              </>
            )}
          </>
        }
      />
      {/* 只為產品（非套餐）顯示筆記圖示 */}
      {!isPackage(option) && (
        <Box sx={{ flexShrink: 0 }}>
          <IconButton
            size="small"
            onClick={(e) => handleNoteClick(e, option as ProductOrMedicine)}
            sx={{
              color: 'primary.main',
              backgroundColor: 'rgba(25, 118, 210, 0.08)',
              border: '1px solid rgba(25, 118, 210, 0.2)',
              minWidth: '32px',
              minHeight: '32px',
              '&:hover': {
                color: 'primary.dark',
                backgroundColor: 'rgba(25, 118, 210, 0.15)',
                transform: 'scale(1.1)'
              }
            }}
            title="查看產品筆記"
          >
            <NoteIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
    </ListItem>
  );

  return (
    <>
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
          // 處理選項高亮變化
          onHighlightChange={(_event: SyntheticEvent, option: any, reason: string) => {
            if (reason === 'keyboard' || reason === 'mouse') {
              const index = filteredItems.findIndex(item => item === option);
              setSelectedItemIndex(index);
            }
          }}
          /**
           * 處理輸入框值變化事件
           *
           * 根據不同的變化原因（輸入、清空、重置）執行相應的操作
           * 使用防抖機制處理搜尋，提高效能
           *
           * @param {React.SyntheticEvent} _event - 事件對象
           * @param {string} newValue - 新的輸入值
           * @param {string} reason - 變化原因：'input'、'clear' 或 'reset'
           */
          onInputChange={(_event, newValue, reason) => {
            if (reason === 'input') {
              // 只更新 barcode 值，搜尋由 useEffect 中的防抖機制處理
              setBarcode(newValue);
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
          /**
           * 處理自動完成選項選擇事件
           *
           * 當用戶從下拉列表中選擇一個產品或套餐時觸發
           * 包含防止重複選擇和重複觸發的邏輯
           */
          onChange={(_event, newValue) => {
            // 只處理有效的選擇項目
            if (!newValue || typeof newValue === 'string') {
              return;
            }

            // 防止重複觸發的嚴格檢查
            if (isProcessingRef.current) {
              console.log('onChange blocked - already processing');
              return;
            }

            const itemId = newValue._id;

            // 檢查是否是重複選擇同一個項目
            if (lastSelectedItemRef.current === itemId) {
              console.log('onChange blocked - same item already selected:', itemId);
              return;
            }

            // 立即設置處理標誌和記錄選擇的項目
            isProcessingRef.current = true;
            lastSelectedItemRef.current = itemId || null;

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
          renderInput={(params) => {
            const { InputLabelProps, ...restParams } = params;
            return (
              <TextField
                {...restParams}
                {...(barcodeInputRef && { inputRef: barcodeInputRef })}
                label="掃描條碼 / 輸入產品名稱、代碼、健保碼或套餐"
                variant="outlined"
                size="small"
                /**
                 * 處理鍵盤按下事件
                 *
                 * 當用戶按下 Enter 鍵時，提交當前輸入的條碼或產品名稱
                 *
                 * @param {React.KeyboardEvent} e - 鍵盤事件
                 */
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();

                    // 執行提交邏輯，會選擇用戶當前選擇的項目
                    handleBarcodeSubmit();
                  } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    // 讓默認的上下鍵行為繼續，Autocomplete 會處理選項高亮
                    // 我們在 onHighlightChange 中捕獲選擇的項目索引
                  }
                }}
              />
            );
          }}
          renderOption={renderOption}
          ListboxProps={{ style: { maxHeight: 200, overflow: 'auto' } }}
          sx={{ flexGrow: 1, mr: 1 }}
        />
        <IconButton color="primary" onClick={handleBarcodeSubmit} aria-label="添加產品">
          <AddIcon />
        </IconButton>
      </Box>

      {/* 產品筆記彈窗 */}
      {selectedProductForNote && (
        <ProductNotePopover
          productId={selectedProductForNote._id!}
          productName={selectedProductForNote.name!}
          anchorEl={notePopoverAnchor}
          open={Boolean(notePopoverAnchor)}
          onClose={handleNotePopoverClose}
        />
      )}
    </>
  );
};

export default SalesProductInput;
