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
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  FlashOn as FlashOnIcon
} from '@mui/icons-material';
import useUserSettings, { type UserShortcut } from '../../../hooks/useUserSettings';
import { Package } from '@pharmacy-pos/shared/types/package';
import EditShortcutItemsDialog from './EditShortcutItemsDialog';

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