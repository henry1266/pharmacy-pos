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
  IconButton
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';

// Placeholder for actual API calls
const fetchShortcutCategories = async () => Promise.resolve(['常用藥品', '疫苗', '注射藥品']);
const saveShortcutCategories = async (categories) => console.log('Saving categories:', categories);

const ShortcutButtonManager = ({ onShortcutSelect }) => {
  const [shortcuts, setShortcuts] = useState(['常用藥品']); // Default shortcut
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');

  // In a real app, fetch categories from backend or config
  useState(() => {
    fetchShortcutCategories().then(setAvailableCategories);
    // Load saved shortcuts if any
  }, []);

  const handleOpenEditDialog = () => {
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    // Persist changes if needed
    saveShortcutCategories(shortcuts);
  };

  const handleAddShortcut = () => {
    if (newCategory && !shortcuts.includes(newCategory)) {
      setShortcuts([...shortcuts, newCategory]);
      setNewCategory('');
    }
  };

  const handleRemoveShortcut = (categoryToRemove) => {
    setShortcuts(shortcuts.filter(cat => cat !== categoryToRemove));
  };

  return (
    <>
      {shortcuts.map((category) => (
        <Button
          key={category}
          variant="contained"
          color="info"
          onClick={() => onShortcutSelect(category)}
          sx={{ ml: 1, height: 56 }}
        >
          {category}
        </Button>
      ))}
      <IconButton onClick={handleOpenEditDialog} sx={{ ml: 1, height: 56, width: 56 }}>
        <EditIcon />
      </IconButton>

      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog}>
        <DialogTitle>編輯快捷按鈕</DialogTitle>
        <DialogContent>
          <List>
            {shortcuts.map((category) => (
              <ListItem
                key={category}
                secondaryAction={
                  <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveShortcut(category)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText primary={category} />
              </ListItem>
            ))}
          </List>
          <TextField
            select
            label="新增快捷分類"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            SelectProps={{
              native: true,
            }}
            fullWidth
            sx={{ mt: 2 }}
          >
            <option value=""></option>
            {availableCategories
              .filter(cat => !shortcuts.includes(cat)) // Only show categories not already added
              .map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddShortcut} disabled={!newCategory}>新增</Button>
          <Button onClick={handleCloseEditDialog}>完成</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ShortcutButtonManager;

