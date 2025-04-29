import React, { useState, useEffect } from 'react';
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
  Paper
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Search as SearchIcon
} from '@mui/icons-material';

// Helper function to get shortcuts from localStorage
const loadShortcuts = () => {
  const saved = localStorage.getItem('customShortcuts');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse shortcuts from localStorage", e);
      return [{ id: 'default', name: '常用藥品', productIds: [] }]; // Default if parsing fails
    }
  }
  return [{ id: 'default', name: '常用藥品', productIds: [] }]; // Default if nothing saved
};

// Helper function to save shortcuts to localStorage
const saveShortcuts = (shortcuts) => {
  localStorage.setItem('customShortcuts', JSON.stringify(shortcuts));
};

// --- Edit Shortcut Items Dialog --- (New Component within the same file for simplicity)
const EditShortcutItemsDialog = ({ open, onClose, shortcut, allProducts, onSave }) => {
  const [selectedProductIds, setSelectedProductIds] = useState(shortcut?.productIds || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    // Update internal state if the shortcut prop changes (e.g., user selects a different shortcut to edit)
    setSelectedProductIds(shortcut?.productIds || []);
  }, [shortcut]);

  useEffect(() => {
    // Filter all products based on search term
    if (searchTerm.trim() === '') {
      setFilteredProducts([]);
    } else {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const results = allProducts.filter(p =>
        (p.name && p.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (p.code && p.code.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (p.barcode && p.barcode.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (p.healthInsuranceCode && p.healthInsuranceCode.toLowerCase().includes(lowerCaseSearchTerm))
      ).slice(0, 50); // Limit results for performance
      setFilteredProducts(results);
    }
  }, [searchTerm, allProducts]);

  const handleAddProduct = (productId) => {
    if (!selectedProductIds.includes(productId)) {
      setSelectedProductIds([...selectedProductIds, productId]);
    }
    setSearchTerm(''); // Clear search after adding
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
            freeSolo // Allow manual input, though selection is preferred
            options={filteredProducts}
            getOptionLabel={(option) => option.name || ''}
            filterOptions={(x) => x} // Disable built-in filtering, we do it manually
            value={null} // Controlled by selection, not direct value binding
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

// --- Shortcut Button Manager --- (Main Component)
const ShortcutButtonManager = ({ onShortcutSelect, allProducts }) => {
  const [shortcuts, setShortcuts] = useState(loadShortcuts());
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [editItemsDialogOpen, setEditItemsDialogOpen] = useState(false);
  const [currentEditingShortcut, setCurrentEditingShortcut] = useState(null);
  const [newShortcutName, setNewShortcutName] = useState('');

  useEffect(() => {
    // Save to localStorage whenever shortcuts change
    saveShortcuts(shortcuts);
  }, [shortcuts]);

  const handleOpenManageDialog = () => {
    setManageDialogOpen(true);
  };

  const handleCloseManageDialog = () => {
    setManageDialogOpen(false);
    setNewShortcutName(''); // Reset input field
  };

  const handleAddShortcut = () => {
    if (newShortcutName.trim() && !shortcuts.some(s => s.name === newShortcutName.trim())) {
      const newShortcut = {
        id: Date.now().toString(), // Simple unique ID
        name: newShortcutName.trim(),
        productIds: []
      };
      setShortcuts([...shortcuts, newShortcut]);
      setNewShortcutName('');
    }
  };

  const handleRemoveShortcut = (idToRemove) => {
    setShortcuts(shortcuts.filter(s => s.id !== idToRemove));
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
    setShortcuts(shortcuts.map(s =>
      s.id === shortcutId ? { ...s, productIds: updatedProductIds } : s
    ));
  };

  return (
    <>
      {/* Display Shortcut Buttons */}
      {shortcuts.map((shortcut) => (
        <Button
          key={shortcut.id}
          variant="contained"
          color="info"
          onClick={() => onShortcutSelect(shortcut)} // Pass the whole shortcut object
          sx={{ ml: 1, height: 56, textTransform: 'none' }} // Allow longer names
        >
          {shortcut.name}
        </Button>
      ))}
      {/* Button to open the management dialog */}
      <IconButton onClick={handleOpenManageDialog} sx={{ ml: 1, height: 56, width: 56, border: '1px solid', borderColor: 'divider' }}>
        <EditIcon />
      </IconButton>

      {/* Dialog to Manage Shortcut Buttons (Add/Remove/Trigger Edit Items) */}
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
          allProducts={allProducts} // Pass all products for searching
          onSave={handleSaveShortcutItems}
        />
      )}
    </>
  );
};

export default ShortcutButtonManager;

