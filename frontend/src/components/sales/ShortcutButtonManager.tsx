import React, { useState, useEffect, useCallback } from 'react';
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
  Search as SearchIcon
} from '@mui/icons-material';

// 定義產品的型別
interface Product {
  _id: string;
  name?: string;
  code?: string;
  barcode?: string;
  healthInsuranceCode?: string;
  sellingPrice?: number;
}

// 定義快捷按鈕的型別
interface Shortcut {
  id: string;
  name: string;
  productIds: string[];
}

// 定義 Snackbar 狀態的型別
interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

// Default shortcuts if none are loaded from backend
const defaultShortcuts: Shortcut[] = [{ id: 'default', name: '常用藥品', productIds: [] }];

// --- Edit Shortcut Items Dialog ---
interface EditShortcutItemsDialogProps {
  open: boolean;
  onClose: () => void;
  shortcut?: Shortcut;
  allProducts?: Product[];
  onSave: (shortcutId: string, productIds: string[]) => void;
}

const EditShortcutItemsDialog: React.FC<EditShortcutItemsDialogProps> = ({ 
  open, 
  onClose, 
  shortcut, 
  allProducts, 
  onSave 
}) => {
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(shortcut?.productIds ?? []);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    setSelectedProductIds(shortcut?.productIds ?? []);
  }, [shortcut]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts([]);
    } else {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const results = allProducts?.filter(p =>
        (p?.name?.toLowerCase().includes(lowerCaseSearchTerm)) ??
        (p?.code?.toLowerCase().includes(lowerCaseSearchTerm)) ??
        (p?.barcode?.toLowerCase().includes(lowerCaseSearchTerm)) ??
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
    onClose();
  };

  const getProductDetails = (productId: string): Product | undefined => {
    return allProducts?.find(p => p?._id === productId);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        編輯 "{shortcut?.name}" 快捷項目
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
  onShortcutSelect: (shortcut: Shortcut) => void;
  allProducts: Product[];
  isTestMode?: boolean;
}

const ShortcutButtonManager: React.FC<ShortcutButtonManagerProps> = ({ 
  onShortcutSelect, 
  allProducts, 
  isTestMode = false 
}) => {
  // Always use default shortcuts instead of loading from API
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(defaultShortcuts);
  const [loading] = useState<boolean>(false); // No loading needed
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'info' });

  const [manageDialogOpen, setManageDialogOpen] = useState<boolean>(false);
  const [editItemsDialogOpen, setEditItemsDialogOpen] = useState<boolean>(false);
  const [currentEditingShortcut, setCurrentEditingShortcut] = useState<Shortcut | null>(null);
  const [newShortcutName, setNewShortcutName] = useState<string>('');

  // Local storage key for shortcuts
  const SHORTCUTS_STORAGE_KEY = 'pharmacy_pos_shortcuts';

  // Function to save shortcuts to local storage instead of backend
  const saveShortcutsToLocalStorage = useCallback((updatedShortcuts: Shortcut[]) => {
    try {
      localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(updatedShortcuts));
      setSnackbar({ open: true, message: '快捷按鈕設定已儲存', severity: 'success' });
    } catch (err) {
      console.error("Failed to save shortcuts to local storage", err);
      setError('儲存快捷按鈕設定失敗');
      setSnackbar({ open: true, message: '儲存快捷按鈕設定失敗', severity: 'error' });
    }
  }, []);

  // Load shortcuts from local storage on component mount
  useEffect(() => {
    try {
      const savedShortcuts = localStorage.getItem(SHORTCUTS_STORAGE_KEY);
      if (savedShortcuts) {
        const parsedShortcuts = JSON.parse(savedShortcuts);
        if (Array.isArray(parsedShortcuts) && parsedShortcuts.length > 0) {
          console.log("Using saved shortcuts from local storage");
          setShortcuts(parsedShortcuts);
        }
      } else {
        console.log("No saved shortcuts found, using defaults");
      }
    } catch (err) {
      console.error("Error loading shortcuts from local storage", err);
      // Keep using default shortcuts on error
    }
  }, []);

  // --- Handlers for managing shortcuts ---

  const handleOpenManageDialog = (): void => {
    setManageDialogOpen(true);
  };

  const handleCloseManageDialog = (): void => {
    setManageDialogOpen(false);
    setNewShortcutName('');
  };

  const handleAddShortcut = (): void => {
    if (newShortcutName.trim() && !shortcuts.some(s => s.name === newShortcutName.trim())) {
      const newShortcut: Shortcut = {
        id: Date.now().toString(),
        name: newShortcutName.trim(),
        productIds: []
      };
      const updatedShortcuts = [...shortcuts, newShortcut];
      setShortcuts(updatedShortcuts);
      saveShortcutsToLocalStorage(updatedShortcuts); // Save to local storage
      setNewShortcutName('');
    }
  };

  const handleRemoveShortcut = (idToRemove: string): void => {
    const updatedShortcuts = shortcuts.filter(s => s.id !== idToRemove);
    setShortcuts(updatedShortcuts);
    saveShortcutsToLocalStorage(updatedShortcuts); // Save to local storage
  };

  const handleOpenEditItemsDialog = (shortcut: Shortcut): void => {
    setCurrentEditingShortcut(shortcut);
    setEditItemsDialogOpen(true);
  };

  const handleCloseEditItemsDialog = (): void => {
    setEditItemsDialogOpen(false);
    setCurrentEditingShortcut(null);
  };

  const handleSaveShortcutItems = (shortcutId: string, updatedProductIds: string[]): void => {
    const updatedShortcuts = shortcuts.map(s =>
      s.id === shortcutId ? { ...s, productIds: updatedProductIds } : s
    );
    setShortcuts(updatedShortcuts);
    saveShortcutsToLocalStorage(updatedShortcuts); // Save to local storage
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
          sx={{ ml: 1, height: 56, textTransform: 'none' }}
          disabled={!!error} // Disable if there was an error loading/saving
        >
          {shortcut?.name}
        </Button>
      ))}
      {/* Button to open the management dialog */}
      <IconButton 
        onClick={handleOpenManageDialog} 
        sx={{ ml: 1, height: 56, width: 56, border: '1px solid', borderColor: 'divider' }}
        disabled={!!error} // Disable if there was an error loading/saving
      >
        <EditIcon />
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