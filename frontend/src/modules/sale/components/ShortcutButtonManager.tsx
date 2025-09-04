import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box,
  Typography,
  Autocomplete,
  Paper,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
  FlashOn as FlashOnIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon
} from '@mui/icons-material';
import useUserSettings, { type UserShortcut } from '../../../hooks/useUserSettings';
import { Package } from '@pharmacy-pos/shared/types/package';

// 定義產品的型別
interface Product {
  _id: string;
  name?: string;
  code?: string;
  barcode?: string;
  healthInsuranceCode?: string;
  sellingPrice?: number;
}

// 定義 Snackbar 狀態的型別
interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

// --- Edit Shortcut Items Dialog ---
interface EditShortcutItemsDialogProps {
  open: boolean;
  onClose: () => void;
  shortcut?: UserShortcut;
  allProducts?: Product[];
  allPackages?: Package[];
  onSave: (shortcutId: string, productIds: string[], packageIds?: string[]) => void;
  onRename: (shortcutId: string, newName: string) => void;
}

const EditShortcutItemsDialog: React.FC<EditShortcutItemsDialogProps> = ({
  open,
  onClose,
  shortcut,
  allProducts,
  allPackages,
  onSave,
  onRename
}) => {
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(shortcut?.productIds ?? []);
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>(shortcut?.packageIds ?? []);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredItems, setFilteredItems] = useState<(Product | Package)[]>([]);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [editingName, setEditingName] = useState<string>('');

  // 防重複觸發機制
  const isProcessingRef = React.useRef<boolean>(false);
  const lastSelectedItemRef = React.useRef<string | null>(null);

  // 判斷是否為套餐
  const isPackage = (item: Product | Package): item is Package => {
    return 'totalPrice' in item && 'items' in item;
  };

  // 統一獲取項目ID的函數，處理不同的ID格式
  const getItemId = (item: Product | Package): string => {
    if (isPackage(item)) {
      // 套餐的 _id 可能是 ObjectId 物件或字串
      if (item._id) {
        if (typeof item._id === 'string') {
          return item._id;
        } else if (typeof item._id === 'object' && (item._id as any)?.$oid) {
          return (item._id as any).$oid;
        }
      }
      // 如果沒有 _id 或格式不正確，使用 code 作為備用
      return item.code || '';
    } else {
      // 產品通常使用 _id 字串
      return item._id || '';
    }
  };

  React.useEffect(() => {
    setSelectedProductIds(shortcut?.productIds ?? []);
    setSelectedPackageIds(shortcut?.packageIds ?? []);
    setEditingName(shortcut?.name ?? '');
  }, [shortcut]);

  React.useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredItems([]);
    } else {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();

      // 篩選產品
      const productResults = allProducts?.filter(p =>
        (p?.name?.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (p?.code?.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (p?.barcode?.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (p?.healthInsuranceCode?.toLowerCase().includes(lowerCaseSearchTerm))
      ) ?? [];

      // 篩選套餐 - 修正搜尋邏輯，確保大小寫不敏感的比較
      const packageResults = allPackages?.filter(pkg =>
        (pkg?.name?.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (pkg?.code?.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (pkg?.shortCode?.toLowerCase().includes(lowerCaseSearchTerm))
      ) ?? [];

      // 合併結果，套餐優先顯示，限制總數量
      const allResults = [...packageResults, ...productResults].slice(0, 20);
      setFilteredItems(allResults);
    }
  }, [searchTerm, allProducts, allPackages]);

  const handleAddProduct = (productId: string): void => {
    if (!selectedProductIds.includes(productId)) {
      setSelectedProductIds([...selectedProductIds, productId]);
    }
    setSearchTerm('');
    setFilteredItems([]);
  };

  const handleAddPackage = (packageId: string): void => {
    if (!selectedPackageIds.includes(packageId)) {
      setSelectedPackageIds([...selectedPackageIds, packageId]);
    }
    setSearchTerm('');
    setFilteredItems([]);
  };

  const handleRemoveProduct = (productId: string): void => {
    setSelectedProductIds(selectedProductIds.filter(id => id !== productId));
  };

  const handleRemovePackage = (packageId: string): void => {
    setSelectedPackageIds(selectedPackageIds.filter(id => id !== packageId));
  };

  const handleMoveProductUp = (index: number): void => {
    if (index > 0) {
      const newProductIds = [...selectedProductIds];
      [newProductIds[index - 1], newProductIds[index]] = [newProductIds[index], newProductIds[index - 1]];
      setSelectedProductIds(newProductIds);
    }
  };

  const handleMoveProductDown = (index: number): void => {
    if (index < selectedProductIds.length - 1) {
      const newProductIds = [...selectedProductIds];
      [newProductIds[index], newProductIds[index + 1]] = [newProductIds[index + 1], newProductIds[index]];
      setSelectedProductIds(newProductIds);
    }
  };

  const handleMovePackageUp = (index: number): void => {
    if (index > 0) {
      const newPackageIds = [...selectedPackageIds];
      [newPackageIds[index - 1], newPackageIds[index]] = [newPackageIds[index], newPackageIds[index - 1]];
      setSelectedPackageIds(newPackageIds);
    }
  };

  const handleMovePackageDown = (index: number): void => {
    if (index < selectedPackageIds.length - 1) {
      const newPackageIds = [...selectedPackageIds];
      [newPackageIds[index], newPackageIds[index + 1]] = [newPackageIds[index + 1], newPackageIds[index]];
      setSelectedPackageIds(newPackageIds);
    }
  };

  const handleSave = (): void => {
    if (shortcut?.id) {
      onSave(shortcut.id, selectedProductIds, selectedPackageIds);
    }
    // 不要在這裡關閉對話框，讓 onSave 處理完成後再關閉
  };

  const handleStartEditName = (): void => {
    setIsEditingName(true);
  };

  const handleCancelEditName = (): void => {
    setIsEditingName(false);
    setEditingName(shortcut?.name ?? '');
  };

  const handleSaveEditName = (): void => {
    if (shortcut?.id && editingName.trim()) {
      onRename(shortcut.id, editingName.trim());
      setIsEditingName(false);
    }
  };

  const getProductDetails = (productId: string): Product | undefined => {
    return allProducts?.find(p => p?._id === productId);
  };

  const getPackageDetails = (packageId: string): Package | undefined => {
    return allPackages?.find(pkg => getItemId(pkg) === packageId);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', pr: 6 }}>
          {isEditingName ? (
            <>
              <TextField
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyPress={(e) => { if (e.key === 'Enter') handleSaveEditName(); }}
                size="small"
                autoFocus
                sx={{ flexGrow: 1, mr: 1 }}
                placeholder="輸入快捷按鈕名稱"
              />
              <IconButton onClick={handleSaveEditName} size="small" color="primary">
                <CheckIcon fontSize="small" />
              </IconButton>
              <IconButton onClick={handleCancelEditName} size="small">
                <CancelIcon fontSize="small" />
              </IconButton>
            </>
          ) : (
            <>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                編輯 "{shortcut?.name}" 快捷項目
              </Typography>
              <IconButton onClick={handleStartEditName} size="small" sx={{ mr: 1 }}>
                <EditIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <style>
        {`
          .MuiListItemText-primary {
            color: #000000;
          }
        `}
      </style>
      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <Autocomplete
            fullWidth
            freeSolo
            options={filteredItems}
            getOptionLabel={(option) => {
              if (typeof option === 'string') return option;
              return option?.name ?? '';
            }}
            filterOptions={(x) => x}
            value={null}
            inputValue={searchTerm}
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

              const itemId = getItemId(newValue);

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
                // 確保有有效的 ID 才處理
                if (itemId) {
                  // 使用 isPackage 函數判斷是套餐還是產品
                  if (isPackage(newValue)) {
                    handleAddPackage(itemId);
                  } else {
                    handleAddProduct(itemId);
                  }
                }
              } catch (error) {
                console.error('處理選擇項目時發生錯誤:', error);
              } finally {
                // 延遲重置處理標誌，確保不會立即被重複觸發
                setTimeout(() => {
                  isProcessingRef.current = false;
                  lastSelectedItemRef.current = null;
                }, 300);
              }
            }}
            onInputChange={(_event, newInputValue) => {
              setSearchTerm(newInputValue);
            }}
            renderInput={(params) => {
              const { InputLabelProps, ...restParams } = params;
              const cleanInputLabelProps = InputLabelProps ? {
                ...InputLabelProps,
                className: InputLabelProps.className || '',
                style: InputLabelProps.style || {}
              } : {};

              return (
                <TextField
                  {...restParams}
                  placeholder="搜尋藥品或套餐 (名稱/代碼/條碼)"
                  size="small"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const allOptions = filteredItems;

                      if (allOptions.length > 0) {
                        const firstItemId = getItemId(allOptions[0]);
                        if (firstItemId) {
                          // 如果有搜尋結果，選擇第一個
                          if (isPackage(allOptions[0])) {
                            handleAddPackage(firstItemId);
                          } else {
                            handleAddProduct(firstItemId);
                          }
                        }
                      } else if (searchTerm.trim()) {
                        // 如果沒有搜尋結果但有輸入，嘗試精確匹配
                        const exactSearchTerm = searchTerm.trim();

                        // 在所有套餐中尋找精確匹配
                        const exactPackageMatch = allPackages?.find(pkg =>
                          pkg?.code === exactSearchTerm ||
                          pkg?.shortCode === exactSearchTerm ||
                          pkg?.name === exactSearchTerm
                        );

                        if (exactPackageMatch) {
                          const packageId = getItemId(exactPackageMatch);
                          if (packageId) {
                            handleAddPackage(packageId);
                            return;
                          }
                        }

                        // 在所有產品中尋找精確匹配
                        const exactProductMatch = allProducts?.find(p =>
                          p?.code === exactSearchTerm ||
                          p?.barcode === exactSearchTerm ||
                          p?.healthInsuranceCode === exactSearchTerm ||
                          p?.name === exactSearchTerm
                        );

                        if (exactProductMatch) {
                          const productId = getItemId(exactProductMatch);
                          if (productId) {
                            handleAddProduct(productId);
                            return;
                          }
                        }

                        // 如果都找不到，顯示錯誤訊息
                        console.warn(`找不到代碼 "${exactSearchTerm}" 對應的產品或套餐`);
                      }
                    }
                  }}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <SearchIcon color="action" sx={{ mr: 1 }} />
                    ),
                  }}
                  InputLabelProps={cleanInputLabelProps}
                />
              );
            }}
            renderOption={(props, option) => {
              const isPackageItem = isPackage(option);
              const { key, ...otherProps } = props;
              return (
                <li {...otherProps} key={getItemId(option)}>
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 0.5,
                    width: '100%',
                    py: 1,
                    px: 2
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" sx={{ color: 'black', fontWeight: 500 }}>
                        {option?.name}
                      </Typography>
                      {isPackageItem && (
                        <Typography variant="body2" sx={{
                          color: 'primary.main',
                          fontWeight: 'bold',
                          backgroundColor: 'primary.light',
                          px: 1,
                          py: 0.25,
                          borderRadius: 1,
                          fontSize: '0.75rem'
                        }}>
                          套餐
                        </Typography>
                      )}
                    </Box>
                    {isPackageItem ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          套餐編號: {option?.code} | 簡碼: {(option as Package)?.shortCode || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          總價: ${(option as Package)?.totalPrice?.toFixed(2) || 'N/A'} | 包含 {(option as Package)?.items?.length || 0} 項商品
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          代碼: {option?.code || 'N/A'} | 條碼: {(option as Product)?.barcode || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          價格: ${(option as Product)?.sellingPrice?.toFixed(2) || 'N/A'}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </li>
              );
            }}
          />
        </Box>

        <Typography variant="subtitle1" gutterBottom>已選項目:</Typography>
        <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
          <List dense>
            {selectedProductIds.length === 0 && selectedPackageIds.length === 0 ? (
              <ListItem><ListItemText primary="尚未加入任何藥品或套餐" /></ListItem>
            ) : (
              <>
                {/* 顯示套餐 */}
                {selectedPackageIds.map((packageId, index) => {
                  const packageItem = getPackageDetails(packageId);
                  return (
                    <ListItem
                      key={`package-${packageId}`}
                      secondaryAction={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <IconButton
                            edge="end"
                            aria-label="move up"
                            onClick={() => handleMovePackageUp(index)}
                            size="small"
                            disabled={index === 0}
                            sx={{ mr: 0.5 }}
                          >
                            <ArrowUpIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            edge="end"
                            aria-label="move down"
                            onClick={() => handleMovePackageDown(index)}
                            size="small"
                            disabled={index === selectedPackageIds.length - 1}
                            sx={{ mr: 0.5 }}
                          >
                            <ArrowDownIcon fontSize="small" />
                          </IconButton>
                          <IconButton edge="end" aria-label="delete" onClick={() => handleRemovePackage(packageId)} size="small">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      }
                    >
                      <ListItemText
                        primary={`[套餐] ${packageItem?.name || '套餐資料遺失'}`}
                        secondary={packageItem ? `代碼: ${packageItem?.code || 'N/A'}, 總價: $${packageItem?.totalPrice?.toFixed(2) || 'N/A'}, 包含 ${packageItem?.items?.length || 0} 項商品` : `ID: ${packageId}`}
                      />
                    </ListItem>
                  );
                })}

                {/* 顯示產品 */}
                {selectedProductIds.map((productId, index) => {
                  const product = getProductDetails(productId);
                  return (
                    <ListItem
                      key={`product-${productId}`}
                      secondaryAction={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <IconButton
                            edge="end"
                            aria-label="move up"
                            onClick={() => handleMoveProductUp(index)}
                            size="small"
                            disabled={index === 0}
                            sx={{ mr: 0.5 }}
                          >
                            <ArrowUpIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            edge="end"
                            aria-label="move down"
                            onClick={() => handleMovePackageDown(index)}
                            size="small"
                            disabled={index === selectedProductIds.length - 1}
                            sx={{ mr: 0.5 }}
                          >
                            <ArrowDownIcon fontSize="small" />
                          </IconButton>
                          <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveProduct(productId)} size="small">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      }
                    >
                      <ListItemText
                        primary={product?.name || '藥品資料遺失'}
                        secondary={product ? `代碼: ${product?.code || 'N/A'}, 價格: $${product?.sellingPrice?.toFixed(2) || 'N/A'}` : `ID: ${productId}`}
                      />
                    </ListItem>
                  );
                })}
              </>
            )}
          </List>
        </Paper>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>儲存變更</Button>
      </DialogActions>
    </Dialog>
  );
};

// --- Shortcut Button Manager --- (Main Component)
interface ShortcutButtonManagerProps {
  onShortcutSelect: (shortcut: UserShortcut) => void;
  allProducts: Product[];
  allPackages?: Package[];
  isTestMode?: boolean;
}

const ShortcutButtonManager: React.FC<ShortcutButtonManagerProps> = ({
  onShortcutSelect,
  allProducts,
  allPackages = [],
  isTestMode: _isTestMode = false
}) => {
  // 使用用戶設定 hook
  const {
    shortcuts,
    loading,
    error,
    addShortcut,
    removeShortcut,
    updateShortcutItems,
    updateShortcutName
  } = useUserSettings();


  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'info' });
  const [manageDialogOpen, setManageDialogOpen] = useState<boolean>(false);
  const [editItemsDialogOpen, setEditItemsDialogOpen] = useState<boolean>(false);
  const [currentEditingShortcut, setCurrentEditingShortcut] = useState<UserShortcut | null>(null);
  const [newShortcutName, setNewShortcutName] = useState<string>('');

  // --- Handlers for managing shortcuts ---

  const handleOpenManageDialog = (): void => {
    setManageDialogOpen(true);
  };

  const handleCloseManageDialog = (): void => {
    setManageDialogOpen(false);
    setNewShortcutName('');
  };

  const handleAddShortcut = async (): Promise<void> => {
    if (newShortcutName.trim() && !shortcuts.some(s => s.name === newShortcutName.trim())) {
      const newShortcut: UserShortcut = {
        id: Date.now().toString(),
        name: newShortcutName.trim(),
        productIds: []
      };

      const success = await addShortcut(newShortcut);
      if (success) {
        setSnackbar({ open: true, message: '快捷按鈕已新增', severity: 'success' });
        setNewShortcutName('');
      } else {
        setSnackbar({ open: true, message: '新增快捷按鈕失敗', severity: 'error' });
      }
    }
  };

  const handleRemoveShortcut = async (idToRemove: string): Promise<void> => {
    const success = await removeShortcut(idToRemove);
    if (success) {
      setSnackbar({ open: true, message: '快捷按鈕已刪除', severity: 'success' });
    } else {
      setSnackbar({ open: true, message: '刪除快捷按鈕失敗', severity: 'error' });
    }
  };

  const handleOpenEditItemsDialog = (shortcut: UserShortcut): void => {
    setCurrentEditingShortcut(shortcut);
    setEditItemsDialogOpen(true);
  };

  const handleCloseEditItemsDialog = (): void => {
    setEditItemsDialogOpen(false);
    setCurrentEditingShortcut(null);
  };

  const handleSaveShortcutItems = async (shortcutId: string, updatedProductIds: string[], updatedPackageIds?: string[]): Promise<void> => {
    const success = await updateShortcutItems(shortcutId, updatedProductIds, updatedPackageIds);
    if (success) {
      setSnackbar({ open: true, message: '快捷按鈕項目已更新', severity: 'success' });
      // 儲存成功後關閉對話框
      handleCloseEditItemsDialog();
    } else {
      setSnackbar({ open: true, message: '更新快捷按鈕項目失敗', severity: 'error' });
    }
  };

  const handleRenameShortcut = async (shortcutId: string, newName: string): Promise<void> => {
    const success = await updateShortcutName(shortcutId, newName);
    if (success) {
      setSnackbar({ open: true, message: '快捷按鈕名稱已更新', severity: 'success' });
    } else {
      setSnackbar({ open: true, message: '更新快捷按鈕名稱失敗', severity: 'error' });
    }
  };

  const handleCloseSnackbar = (): void => {
    setSnackbar({ ...snackbar, open: false });
  };


  // --- Render Logic ---

  if (loading) {
    return <CircularProgress size={24} sx={{ ml: 1, height: 56, width: 56 }} />;
  }

  // Optionally disable or show error message if there was a loading error or no auth
  if (error && !shortcuts.length) { // Show error only if loading failed completely
      return <Typography color="error" sx={{ ml: 1, lineHeight: '56px' }}>{error}</Typography>;
  }

  return (
    <>
      {/* Display Shortcut Buttons */}
      {shortcuts.map((shortcut) => (
        <Button
          key={shortcut?.id}
          variant="contained"
          startIcon={<FlashOnIcon />}
          onClick={() => onShortcutSelect(shortcut)}
          sx={{
            textTransform: 'none',
            height: { xs: 48, sm: 52, md: 56 },
            minWidth: { xs: 120, sm: 140, md: 160 },
            fontSize: { xs: '0.875rem', sm: '1rem', md: '1.1rem' },
            fontWeight: 500,
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 1.5, sm: 2 },
            borderRadius: 'var(--shape-corner-large, 16px)',
            position: 'relative',
            overflow: 'hidden',

            // Material3 動態背景 - 使用低飽和度的 primaryContainer
            background: `linear-gradient(145deg,
              rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.08) 0%,
              rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.12) 50%,
              rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.06) 100%)`,

            // 浮雕效果 - 多層陰影
            boxShadow: `
              0 1px 3px 0 rgba(var(--outline-r), var(--outline-g), var(--outline-b), 0.12),
              0 4px 8px 0 rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.08),
              inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
              inset 0 -1px 0 0 rgba(var(--outline-r), var(--outline-g), var(--outline-b), 0.05)
            `,

            // 微妙邊框
            border: `1px solid rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.15)`,

            // 文字顏色 - 深色背景使用白色文字確保最佳對比度
            color: 'rgba(255, 255, 255, 0.95)',

            // 平滑過渡
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',

            // 偽元素 - 增強浮雕效果
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(135deg,
                rgba(255, 255, 255, 0.1) 0%,
                rgba(255, 255, 255, 0.05) 50%,
                rgba(0, 0, 0, 0.02) 100%)`,
              pointerEvents: 'none',
              borderRadius: 'inherit',
            },

            '&:hover': {
              // 懸停時增強效果
              background: `linear-gradient(145deg,
                rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.12) 0%,
                rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.18) 50%,
                rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.10) 100%)`,

              boxShadow: `
                0 2px 6px 0 rgba(var(--outline-r), var(--outline-g), var(--outline-b), 0.15),
                0 6px 12px 0 rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.12),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.15),
                inset 0 -1px 0 0 rgba(var(--outline-r), var(--outline-g), var(--outline-b), 0.08)
              `,

              transform: 'translateY(-1px)',
              borderColor: `rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.25)`,
              color: 'rgba(255, 255, 255, 1.0)',
            },

            '&:active': {
              // 按下時的內凹效果
              transform: 'translateY(0px) scale(0.98)',
              boxShadow: `
                0 1px 2px 0 rgba(var(--outline-r), var(--outline-g), var(--outline-b), 0.1),
                0 2px 4px 0 rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.06),
                inset 0 2px 4px 0 rgba(var(--outline-r), var(--outline-g), var(--outline-b), 0.08),
                inset 0 -1px 0 0 rgba(255, 255, 255, 0.05)
              `,
              background: `linear-gradient(145deg,
                rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.06) 0%,
                rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.10) 50%,
                rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.04) 100%)`,
            },

            '&:disabled': {
              background: `rgba(var(--on-surface-variant-r), var(--on-surface-variant-g), var(--on-surface-variant-b), 0.04)`,
              color: `rgba(var(--on-surface-variant-r), var(--on-surface-variant-g), var(--on-surface-variant-b), 0.38)`,
              boxShadow: 'none',
              transform: 'none',
              border: `1px solid rgba(var(--outline-r), var(--outline-g), var(--outline-b), 0.08)`,
            },

            // 圖示樣式 - 與白色文字保持一致
            '& .MuiButton-startIcon': {
              marginRight: { xs: 1, sm: 1.5 },
              '& svg': {
                fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' },
                color: 'rgba(255, 255, 255, 0.9)',
                filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))',
              }
            }
          }}
          disabled={!!error} // Disable if there was an error loading/saving
        >
          {shortcut?.name}
        </Button>
      ))}
      {/* Button to open the management dialog */}
      <IconButton
        onClick={handleOpenManageDialog}
        sx={{
          height: { xs: 48, sm: 52, md: 56 },
          width: { xs: 48, sm: 52, md: 56 },
          borderRadius: 'var(--shape-corner-medium, 12px)',
          position: 'relative',
          overflow: 'hidden',

          // Material3 動態背景 - 使用 surfaceVariant
          background: `linear-gradient(145deg,
            rgba(var(--surface-r), var(--surface-g), var(--surface-b), 0.8) 0%,
            rgba(var(--surface-r), var(--surface-g), var(--surface-b), 0.95) 50%,
            rgba(var(--surface-r), var(--surface-g), var(--surface-b), 0.75) 100%)`,

          // 浮雕效果 - 與快捷按鈕一致的陰影
          boxShadow: `
            0 1px 3px 0 rgba(var(--outline-r), var(--outline-g), var(--outline-b), 0.12),
            0 4px 8px 0 rgba(var(--outline-r), var(--outline-g), var(--outline-b), 0.08),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
            inset 0 -1px 0 0 rgba(var(--outline-r), var(--outline-g), var(--outline-b), 0.05)
          `,

          // 微妙邊框
          border: `1px solid rgba(var(--outline-r), var(--outline-g), var(--outline-b), 0.2)`,

          // 平滑過渡
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',

          // 偽元素 - 增強浮雕效果
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(135deg,
              rgba(255, 255, 255, 0.08) 0%,
              rgba(255, 255, 255, 0.04) 50%,
              rgba(0, 0, 0, 0.02) 100%)`,
            pointerEvents: 'none',
            borderRadius: 'inherit',
          },

          '&:hover': {
            // 懸停時增強效果
            background: `linear-gradient(145deg,
              rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.08) 0%,
              rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.12) 50%,
              rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.06) 100%)`,

            boxShadow: `
              0 2px 6px 0 rgba(var(--outline-r), var(--outline-g), var(--outline-b), 0.15),
              0 6px 12px 0 rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.12),
              inset 0 1px 0 0 rgba(255, 255, 255, 0.15),
              inset 0 -1px 0 0 rgba(var(--outline-r), var(--outline-g), var(--outline-b), 0.08)
            `,

            transform: 'translateY(-1px)',
            borderColor: `rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.3)`,
          },

          '&:active': {
            // 按下時的內凹效果
            transform: 'translateY(0px) scale(0.95)',
            boxShadow: `
              0 1px 2px 0 rgba(var(--outline-r), var(--outline-g), var(--outline-b), 0.1),
              0 2px 4px 0 rgba(var(--outline-r), var(--outline-g), var(--outline-b), 0.06),
              inset 0 2px 4px 0 rgba(var(--outline-r), var(--outline-g), var(--outline-b), 0.08),
              inset 0 -1px 0 0 rgba(255, 255, 255, 0.05)
            `,
            background: `linear-gradient(145deg,
              rgba(var(--surface-r), var(--surface-g), var(--surface-b), 0.6) 0%,
              rgba(var(--surface-r), var(--surface-g), var(--surface-b), 0.8) 50%,
              rgba(var(--surface-r), var(--surface-g), var(--surface-b), 0.5) 100%)`,
          },

          '&:disabled': {
            background: `rgba(var(--on-surface-variant-r), var(--on-surface-variant-g), var(--on-surface-variant-b), 0.04)`,
            boxShadow: 'none',
            transform: 'none',
            border: `1px solid rgba(var(--outline-r), var(--outline-g), var(--outline-b), 0.08)`,
          }
        }}
        disabled={!!error} // Disable if there was an error loading/saving
      >
        <EditIcon sx={{
          fontSize: { xs: 20, sm: 22, md: 24 },
          color: `rgba(var(--on-surface-r), var(--on-surface-g), var(--on-surface-b), 0.8)`,
          filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          '.MuiIconButton-root:hover &': {
            color: `rgba(var(--on-primary-container-r), var(--on-primary-container-g), var(--on-primary-container-b), 0.95)`,
          }
        }} />
      </IconButton>

      {/* Dialog to Manage Shortcut Buttons */}
      <Dialog open={manageDialogOpen} onClose={handleCloseManageDialog} maxWidth="xs" fullWidth>
        <DialogTitle>管理快捷按鈕</DialogTitle>
        <style>
          {`
            .MuiListItemText-primary {
              color: #000000;
            }
          `}
        </style>
        <DialogContent>
          <List sx={{ mb: 2 }}>
            {shortcuts.map((shortcut) => (
              <ListItem
                key={shortcut?.id}
                secondaryAction={
                  <Box>
                    <IconButton edge="end" aria-label="edit items" onClick={() => handleOpenEditItemsDialog(shortcut)} sx={{ mr: 0.5 }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton edge="end" aria-label="delete shortcut" onClick={() => handleRemoveShortcut(shortcut?.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={shortcut?.name}
                  secondary={`${(shortcut?.productIds?.length || 0) + (shortcut?.packageIds?.length || 0)} 個項目 (${shortcut?.productIds?.length || 0} 產品, ${shortcut?.packageIds?.length || 0} 套餐)`}
                />
              </ListItem>
            ))}
          </List>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              label="新增快捷按鈕名稱"
              value={newShortcutName}
              onChange={(e) => setNewShortcutName(e.target.value)}
              size="small"
              fullWidth
              sx={{ mr: 1 }}
              onKeyPress={(e) => { if (e.key === 'Enter') handleAddShortcut(); }}
            />
            <IconButton onClick={handleAddShortcut} disabled={!newShortcutName.trim()} color="primary">
              <AddIcon />
            </IconButton>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseManageDialog}>完成</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog to Edit Items within a specific Shortcut */}
      {currentEditingShortcut && (
        <EditShortcutItemsDialog
          open={editItemsDialogOpen}
          onClose={handleCloseEditItemsDialog}
          shortcut={currentEditingShortcut}
          allProducts={allProducts}
          allPackages={allPackages}
          onSave={handleSaveShortcutItems}
          onRename={handleRenameShortcut}
        />
      )}

      {/* Snackbar for feedback */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ShortcutButtonManager;