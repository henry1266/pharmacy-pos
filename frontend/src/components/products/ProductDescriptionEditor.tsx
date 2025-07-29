import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Save as SaveIcon,
  History as HistoryIcon,
  Restore as RestoreIcon,
  AutoMode as AutoSaveIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import axios from 'axios';

// 版本歷史介面
interface DescriptionVersion {
  id: string;
  content: string;
  timestamp: Date;
  autoSaved: boolean;
  version: number;
}

// 元件 Props 介面
interface ProductDescriptionEditorProps {
  productId: string;
  initialDescription?: string;
  onDescriptionChange?: (description: string) => void;
  autoSaveInterval?: number; // 自動儲存間隔（毫秒）
  disabled?: boolean;
  height?: number;
  showVersionHistory?: boolean;
}

/**
 * 獨立的產品描述編輯元件
 * 功能：
 * - 富文本編輯
 * - 自動儲存
 * - 版本歷史
 * - 手動儲存
 * - 版本還原
 */
const ProductDescriptionEditor: React.FC<ProductDescriptionEditorProps> = ({
  productId,
  initialDescription = '',
  onDescriptionChange,
  autoSaveInterval = 30000, // 預設30秒自動儲存
  disabled = false,
  height = 400,
  showVersionHistory = true
}) => {
  // 狀態管理
  const [description, setDescription] = useState<string>(initialDescription);
  const [versions, setVersions] = useState<DescriptionVersion[]>([]);
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [showVersionDialog, setShowVersionDialog] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);

  // Refs
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef<string>(initialDescription);

  // 載入產品描述
  const loadProductDescription = useCallback(async () => {
    if (!productId) return;
    
    try {
      const response = await axios.get(`/api/products/${productId}/description`);
      if (response.data.success) {
        const { description } = response.data.data;
        setDescription(description || '');
        lastSavedContentRef.current = description || '';
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('載入產品描述失敗:', error);
      // 如果載入失敗，使用初始描述
      setDescription(initialDescription);
      lastSavedContentRef.current = initialDescription;
    }
  }, [productId, initialDescription]);

  // 載入版本歷史
  const loadVersionHistory = useCallback(async () => {
    if (!productId) return;
    
    try {
      const response = await axios.get(`/api/products/${productId}/description-versions`);
      if (response.data.success) {
        setVersions(response.data.data || []);
      }
    } catch (error) {
      console.error('載入版本歷史失敗:', error);
    }
  }, [productId]);

  // 儲存描述
  const saveDescription = useCallback(async (content: string, isAutoSave = false) => {
    if (!productId || content === lastSavedContentRef.current) {
      return;
    }

    try {
      if (isAutoSave) {
        setIsAutoSaving(true);
      } else {
        setIsSaving(true);
      }

      const response = await axios.patch(`/api/products/${productId}/description`, {
        description: content,
        isAutoSave
      });

      if (response.data.success) {
        lastSavedContentRef.current = content;
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        
        // 更新版本歷史
        await loadVersionHistory();
        
        // 顯示儲存成功訊息
        setSnackbarMessage(isAutoSave ? '自動儲存成功' : '儲存成功');
        setShowSnackbar(true);
        
        // 通知父元件
        onDescriptionChange?.(content);
      }
    } catch (error) {
      console.error('儲存描述失敗:', error);
      setSnackbarMessage('儲存失敗');
      setShowSnackbar(true);
    } finally {
      setIsAutoSaving(false);
      setIsSaving(false);
    }
  }, [productId, onDescriptionChange, loadVersionHistory]);

  // 手動儲存
  const handleManualSave = useCallback(() => {
    saveDescription(description, false);
  }, [description, saveDescription]);

  // 自動儲存
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      if (hasUnsavedChanges && description !== lastSavedContentRef.current) {
        saveDescription(description, true);
      }
    }, autoSaveInterval);
  }, [description, hasUnsavedChanges, saveDescription, autoSaveInterval]);

  // 處理內容變更
  const handleDescriptionChange = useCallback((value: string | undefined) => {
    const newValue = value || '';
    setDescription(newValue);
    setHasUnsavedChanges(newValue !== lastSavedContentRef.current);
    
    // 排程自動儲存
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  // 還原版本
  const handleRestoreVersion = useCallback(async (version: DescriptionVersion) => {
    try {
      setDescription(version.content);
      setHasUnsavedChanges(true);
      setShowVersionDialog(false);
      
      setSnackbarMessage(`已還原到版本 ${version.version}`);
      setShowSnackbar(true);
    } catch (error) {
      console.error('還原版本失敗:', error);
      setSnackbarMessage('還原版本失敗');
      setShowSnackbar(true);
    }
  }, []);

  // 格式化時間
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(date));
  };

  // 初始化載入產品描述和版本歷史
  useEffect(() => {
    if (productId) {
      loadProductDescription();
      loadVersionHistory();
    }
  }, [productId, loadProductDescription, loadVersionHistory]);

  // 清理定時器
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  return (
    <Box>
      {/* 工具列 */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 1,
        p: 1,
        backgroundColor: 'background.paper',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
            產品描述編輯器
          </Typography>
          
          {hasUnsavedChanges && (
            <Chip 
              label="未儲存" 
              size="small" 
              color="warning" 
              icon={<EditIcon />}
            />
          )}
          
          {isAutoSaving && (
            <Chip 
              label="自動儲存中..." 
              size="small" 
              color="info" 
              icon={<AutoSaveIcon />}
            />
          )}
          
          {lastSaved && (
            <Typography variant="caption" color="text.secondary">
              最後儲存: {formatTime(lastSaved)}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="手動儲存">
            <IconButton
              onClick={handleManualSave}
              disabled={disabled || isSaving || !hasUnsavedChanges}
              color="primary"
              size="small"
            >
              <SaveIcon />
            </IconButton>
          </Tooltip>
          
          {showVersionHistory && (
            <Tooltip title="版本歷史">
              <IconButton
                onClick={() => setShowVersionDialog(true)}
                disabled={disabled}
                size="small"
              >
                <HistoryIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* 編輯器 */}
      <Paper sx={{ border: '1px solid', borderColor: 'divider' }}>
        <MDEditor
          value={description}
          onChange={handleDescriptionChange}
          preview="edit"
          hideToolbar={disabled}
          visibleDragbar={false}
          data-color-mode="light"
          height={height}
        />
      </Paper>

      {/* 版本歷史對話框 */}
      <Dialog
        open={showVersionDialog}
        onClose={() => setShowVersionDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>版本歷史</DialogTitle>
        <DialogContent>
          {versions.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
              暫無版本歷史
            </Typography>
          ) : (
            <List>
              {versions.map((version) => (
                <ListItem key={version.id} divider>
                  <ListItemText
                    primary={`版本 ${version.version}`}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {formatTime(version.timestamp)}
                          {version.autoSaved && (
                            <Chip 
                              label="自動儲存" 
                              size="small" 
                              sx={{ ml: 1 }} 
                            />
                          )}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            mt: 1, 
                            maxHeight: 100, 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {version.content.substring(0, 200)}
                          {version.content.length > 200 && '...'}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="還原此版本">
                      <IconButton
                        onClick={() => handleRestoreVersion(version)}
                        size="small"
                      >
                        <RestoreIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowVersionDialog(false)}>
            關閉
          </Button>
        </DialogActions>
      </Dialog>

      {/* 通知訊息 */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setShowSnackbar(false)} 
          severity="success"
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductDescriptionEditor;