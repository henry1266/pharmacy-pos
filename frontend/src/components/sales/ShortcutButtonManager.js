import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios'; // Import axios
import { getApiBaseUrl } from '../../utils/apiConfig'; // Import the base URL utility
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
  CircularProgress, // For loading state
  Snackbar, // For feedback
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

// Default shortcuts if none are loaded from backend
const defaultShortcuts = [{ id: 'default', name: '常用藥品', productIds: [] }];

// --- Edit Shortcut Items Dialog --- (Remains largely the same)
const EditShortcutItemsDialog = ({ open, onClose, shortcut, allProducts, onSave }) => {
  const [selectedProductIds, setSelectedProductIds] = useState(shortcut?.productIds || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    setSelectedProductIds(shortcut?.productIds || []);
  }, [shortcut]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts([]);
    } else {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const results = allProducts.filter(p =>
        (p.name && p.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (p.code && p.code.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (p.barcode && p.barcode.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (p.healthInsuranceCode && p.healthInsuranceCode.toLowerCase().includes(lowerCaseSearchTerm))
      ).slice(0, 50);
      setFilteredProducts(results);
    }
  }, [searchTerm, allProducts]);

  const handleAddProduct = (productId) => {
    if (!selectedProductIds.includes(productId)) {
      setSelectedProductIds([...selectedProductIds, productId]);
    }
    setSearchTerm('');
    setFilteredProducts([]);
  };

  const handleRemoveProduct = (productId) => {
    setSelectedProductIds(selectedProductIds.filter(id => id !== productId));
  };

  const handleSave = () => {
    onSave(shortcut.id, selectedProductIds);
    onClose();
  };

  const getProductDetails = (productId) => {
    return allProducts.find(p => p._id === productId);
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
      <DialogContent dividers>
        <Box sx={{ display: 'flex', mb: 2 }}>
          <Autocomplete
            fullWidth
            freeSolo
            options={filteredProducts}
            getOptionLabel={(option) => option.name || ''}
            filterOptions={(x) => x}
            value={null}
            onChange={(event, newValue) => {
              if (newValue && newValue._id) {
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
              <li {...props} key={option._id}>
                <Typography variant="body2">
                  {option.name} ({option.code || 'N/A'}) - ${option.sellingPrice?.toFixed(2) || 'N/A'}
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
                      secondary={product ? `代碼: ${product.code || 'N/A'}, 價格: $${product.sellingPrice?.toFixed(2) || 'N/A'}` : `ID: ${productId}`}
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

// --- Shortcut Button Manager --- (Main Component - Modified for API integration)
const ShortcutButtonManager = ({ onShortcutSelect, allProducts }) => {
  const [shortcuts, setShortcuts] = useState([]); // Initialize as empty, load from API
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [editItemsDialogOpen, setEditItemsDialogOpen] = useState(false);
  const [currentEditingShortcut, setCurrentEditingShortcut] = useState(null);
  const [newShortcutName, setNewShortcutName] = useState('');

  // Function to save shortcuts to the backend
  const saveShortcutsToBackend = useCallback(async (updatedShortcuts) => {
    try {
      // The API expects the entire settings object. We only manage 'shortcuts' here.
      // We should fetch the current settings, update the shortcuts part, and save.
      // For simplicity now, we assume settings only contain shortcuts.
      // A better approach would involve a global state or fetching current settings first.
      const settingsToSave = { shortcuts: updatedShortcuts }; 
      await axios.put(`${getApiBaseUrl()}/settings`, settingsToSave); 
      setSnackbar({ open: true, message: '快捷按鈕設定已儲存', severity: 'success' });
    } catch (err) {
      console.error("Failed to save shortcuts to backend", err);
      setError('儲存快捷按鈕設定失敗');
      setSnackbar({ open: true, message: '儲存快捷按鈕設定失敗', severity: 'error' });
      // Optionally revert state if save fails, or implement retry logic
    }
  }, []);

  // Load shortcuts from backend on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${getApiBaseUrl()}/settings`);
        // Assuming the settings object has a 'shortcuts' key
        const loadedShortcuts = response.data?.shortcuts;
        if (Array.isArray(loadedShortcuts) && loadedShortcuts.length > 0) {
          setShortcuts(loadedShortcuts);
        } else {
          // If no shortcuts found or format is wrong, set default and save it
          setShortcuts(defaultShortcuts);
          // Save the default to backend if nothing existed
          if (!loadedShortcuts) { 
            await saveShortcutsToBackend(defaultShortcuts);
          }
        }
      } catch (err) {
        console.error("Failed to load shortcuts from backend", err);
        setError('無法載入快捷按鈕設定');
        setSnackbar({ open: true, message: '無法載入快捷按鈕設定', severity: 'error' });
        setShortcuts(defaultShortcuts); // Fallback to default on error
      } finally {
        setLoading(false);
      }
    };

    // Check if token exists before fetching (basic check)
    const token = localStorage.getItem('token');
    if (token) {
        // Ensure axios default header is set (might be redundant if set globally on login)
        axios.defaults.headers.common['x-auth-token'] = token;
        fetchSettings();
    } else {
        // Handle case where user is not logged in (e.g., show message, disable component)
        setError('用戶未登入，無法載入設定');
        setLoading(false);
        setShortcuts(defaultShortcuts); // Show default but maybe disable?
    }

  }, [saveShortcutsToBackend]); // Add saveShortcutsToBackend dependency

  // --- Handlers for managing shortcuts --- 

  const handleOpenManageDialog = () => {
    setManageDialogOpen(true);
  };

  const handleCloseManageDialog = () => {
    setManageDialogOpen(false);
    setNewShortcutName('');
  };

  const handleAddShortcut = () => {
    if (newShortcutName.trim() && !shortcuts.some(s => s.name === newShortcutName.trim())) {
      const newShortcut = {
        id: Date.now().toString(),
        name: newShortcutName.trim(),
        productIds: []
      };
      const updatedShortcuts = [...shortcuts, newShortcut];
      setShortcuts(updatedShortcuts);
      saveShortcutsToBackend(updatedShortcuts); // Save to backend
      setNewShortcutName('');
    }
  };

  const handleRemoveShortcut = (idToRemove) => {
    const updatedShortcuts = shortcuts.filter(s => s.id !== idToRemove);
    setShortcuts(updatedShortcuts);
    saveShortcutsToBackend(updatedShortcuts); // Save to backend
  };

  const handleOpenEditItemsDialog = (shortcut) => {
    setCurrentEditingShortcut(shortcut);
    setEditItemsDialogOpen(true);
  };

  const handleCloseEditItemsDialog = () => {
    setEditItemsDialogOpen(false);
    setCurrentEditingShortcut(null);
  };

  const handleSaveShortcutItems = (shortcutId, updatedProductIds) => {
    const updatedShortcuts = shortcuts.map(s =>
      s.id === shortcutId ? { ...s, productIds: updatedProductIds } : s
    );
    setShortcuts(updatedShortcuts);
    saveShortcutsToBackend(updatedShortcuts); // Save to backend
  };

  const handleCloseSnackbar = () => {
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
          key={shortcut.id}
          variant="contained"
          color="info"
          onClick={() => onShortcutSelect(shortcut)}
          sx={{ ml: 1, height: 56, textTransform: 'none' }}
          disabled={!!error} // Disable if there was an error loading/saving
        >
          {shortcut.name}
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
        <DialogContent>
          <List sx={{ mb: 2 }}>
            {shortcuts.map((shortcut) => (
              <ListItem
                key={shortcut.id}
                secondaryAction={
                  <Box>
                    <IconButton edge="end" aria-label="edit items" onClick={() => handleOpenEditItemsDialog(shortcut)} sx={{ mr: 0.5 }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton edge="end" aria-label="delete shortcut" onClick={() => handleRemoveShortcut(shortcut.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText primary={shortcut.name} secondary={`${shortcut.productIds.length} 個項目`} />
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

