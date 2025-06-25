import React, { useState, useCallback } from 'react';
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
  Cancel as CancelIcon
} from '@mui/icons-material';
import useUserSettings, { type UserShortcut } from '../../hooks/useUserSettings';

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
  onSave: (shortcutId: string, productIds: string[]) => void;
  onRename: (shortcutId: string, newName: string) => void;
}

const EditShortcutItemsDialog: React.FC<EditShortcutItemsDialogProps> = ({
  open,
  onClose,
  shortcut,
  allProducts,
  onSave,
  onRename
}) => {
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(shortcut?.productIds ?? []);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [editingName, setEditingName] = useState<string>('');

  React.useEffect(() => {
    setSelectedProductIds(shortcut?.productIds ?? []);
    setEditingName(shortcut?.name ?? '');
  }, [shortcut]);

  React.useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts([]);
    } else {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const results = allProducts?.filter(p =>
        (p?.name?.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (p?.code?.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (p?.barcode?.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (p?.healthInsuranceCode?.toLowerCase().includes(lowerCaseSearchTerm))
      ).slice(0, 50) ?? [];
      setFilteredProducts(results);
    }
  }, [searchTerm, allProducts]);

  const handleAddProduct = (productId: string): void => {
    if (!selectedProductIds.includes(productId)) {
      setSelectedProductIds([...selectedProductIds, productId]);
    }
    setSearchTerm('');
    setFilteredProducts([]);
  };

  const handleRemoveProduct = (productId: string): void => {
    setSelectedProductIds(selectedProductIds.filter(id => id !== productId));
  };

  const handleSave = (): void => {
    if (shortcut?.id) {
      onSave(shortcut.id, selectedProductIds);
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
        <Box sx={{ display: 'flex', mb: 2 }}>
          <Autocomplete
            fullWidth
            freeSolo
            options={filteredProducts}
            getOptionLabel={(option) => (typeof option === 'string' ? option : option?.name ?? '')}
            filterOptions={(x) => x}
            value={null}
            inputValue={searchTerm}
            onChange={(event, newValue) => {
              if (newValue && typeof newValue !== 'string' && newValue._id) {
                handleAddProduct(newValue._id);
              }
            }}
            onInputChange={(event, newInputValue) => {
              setSearchTerm(newInputValue);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="搜尋藥品 (名稱/代碼/條碼)"
                placeholder="輸入關鍵字搜尋..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filteredProducts.length > 0) {
                    e.preventDefault();
                    handleAddProduct(filteredProducts[0]._id);
                  }
                }}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <SearchIcon color="action" sx={{ mr: 1 }} />
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props} key={option?._id}>
                <Typography variant="body2">
                  {option?.name} ({option?.code ?? 'N/A'}) - ${option?.sellingPrice?.toFixed(2) ?? 'N/A'}
                </Typography>
              </li>
            )}
          />
        </Box>

        <Typography variant="subtitle1" gutterBottom>已選項目:</Typography>
        <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
          <List dense>
            {selectedProductIds.length === 0 ? (
              <ListItem><ListItemText primary="尚未加入任何藥品" /></ListItem>
            ) : (
              selectedProductIds.map(productId => {
                const product = getProductDetails(productId);
                return (
                  <ListItem
                    key={productId}
                    secondaryAction={
                      <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveProduct(productId)} size="small">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={product?.name || '藥品資料遺失'}
                      secondary={product ? `代碼: ${product?.code || 'N/A'}, 價格: $${product?.sellingPrice?.toFixed(2) || 'N/A'}` : `ID: ${productId}`}
                    />
                  </ListItem>
                );
              })
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
  isTestMode?: boolean;
}

const ShortcutButtonManager: React.FC<ShortcutButtonManagerProps> = ({
  onShortcutSelect,
  allProducts,
  isTestMode = false
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

  // 調試資訊
  React.useEffect(() => {
    console.log('ShortcutButtonManager - shortcuts:', shortcuts);
    console.log('ShortcutButtonManager - loading:', loading);
    console.log('ShortcutButtonManager - error:', error);
  }, [shortcuts, loading, error]);

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

  const handleSaveShortcutItems = async (shortcutId: string, updatedProductIds: string[]): Promise<void> => {
    const success = await updateShortcutItems(shortcutId, updatedProductIds);
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
          color="info"
          onClick={() => onShortcutSelect(shortcut)}
          sx={{
            textTransform: 'none',
            height: { xs: 36, sm: 40 },
            fontSize: { xs: '0.75rem', sm: '0.875rem' }
          }}
          size="small"
          disabled={!!error} // Disable if there was an error loading/saving
        >
          {shortcut?.name}
        </Button>
      ))}
      {/* Button to open the management dialog */}
      <IconButton
        onClick={handleOpenManageDialog}
        sx={{
          height: { xs: 36, sm: 40 },
          width: { xs: 36, sm: 40 },
          border: '1px solid',
          borderColor: 'divider'
        }}
        size="small"
        disabled={!!error} // Disable if there was an error loading/saving
      >
        <EditIcon fontSize="small" />
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
                <ListItemText primary={shortcut?.name} secondary={`${shortcut?.productIds?.length} 個項目`} />
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