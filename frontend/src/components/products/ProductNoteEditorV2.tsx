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
  Snackbar,
  Divider
} from '@mui/material';
import {
  Save as SaveIcon,
  History as HistoryIcon,
  Restore as RestoreIcon,
  AutoMode as AutoSaveIcon,
  Edit as EditIcon,
  Summarize as SummaryIcon,
  Description as DescriptionIcon,
  Visibility as ViewIcon,
  EditNote as EditNoteIcon
} from '@mui/icons-material';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import axios from 'axios';
import '../../styles/force-light-theme.css';

// 版本歷史介面
interface DescriptionVersion {
  id: string;
  content: string;
  timestamp: Date;
  autoSaved: boolean;
  version: number;
}

// 元件 Props 介面
interface ProductNoteEditorProps {
  productId: string;
  initialSummary?: string;
  initialDescription?: string;
  onNoteChange?: (summary: string, description: string) => void;
  autoSaveInterval?: number; // 自動儲存間隔（毫秒）
  disabled?: boolean;
  height?: number;
  showVersionHistory?: boolean;
}

/**
 * 產品筆記編輯元件 V2 - 單一編輯框模式
 * 功能：
 * - 檢視/編輯模式切換
 * - 單一編輯框合併編輯
 * - 自動儲存
 * - 版本歷史
 * - 手動儲存
 * - 版本還原
 */
const ProductNoteEditorV2: React.FC<ProductNoteEditorProps> = ({
  productId,
  initialSummary = '',
  initialDescription = '',
  onNoteChange,
  autoSaveInterval = 30000, // 預設30秒自動儲存 (暫未實現自動儲存)
  disabled = false,
  height = 500,
  showVersionHistory = true
}) => {
  // 狀態管理
  const [summary, setSummary] = useState<string>(initialSummary);
  const [description, setDescription] = useState<string>(initialDescription);
  const [combinedContent, setCombinedContent] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
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
  const lastSavedSummaryRef = useRef<string>(initialSummary);
  const lastSavedDescriptionRef = useRef<string>(initialDescription);

  // 消除未使用參數警告（未來可實現自動儲存功能）
  void autoSaveInterval;

  // 合併內容函數
  const combineSummaryAndDescription = useCallback((summaryText: string, descriptionText: string) => {
    const summarySection = summaryText.trim() ? `# 重點摘要\n\n${summaryText.trim()}\n\n` : '';
    const descriptionSection = descriptionText.trim() ? `# 詳細內容\n\n${descriptionText.trim()}` : '';
    return `${summarySection}${descriptionSection}`.trim();
  }, []);

  // 分離內容函數
  const separateCombinedContent = useCallback((content: string) => {
    const summaryMatch = content.match(/# 重點摘要\n\n([\s\S]*?)(?=\n\n# 詳細內容|$)/);
    const descriptionMatch = content.match(/# 詳細內容\n\n([\s\S]*?)$/);
    
    return {
      summary: summaryMatch ? summaryMatch[1].trim() : '',
      description: descriptionMatch ? descriptionMatch[1].trim() : content.trim()
    };
  }, []);

  // 切換編輯模式
  const toggleEditMode = useCallback(() => {
    if (!isEditMode) {
      // 進入編輯模式：合併內容
      let combined = combineSummaryAndDescription(summary, description);
      
      // 如果是第一次編輯（摘要和描述都為空），自動加上標題模板
      if (!summary.trim() && !description.trim()) {
        combined = '# 重點摘要\n\n\n\n# 詳細內容\n\n';
      }
      
      setCombinedContent(combined);
    } else {
      // 退出編輯模式：分離內容
      const separated = separateCombinedContent(combinedContent);
      setSummary(separated.summary);
      setDescription(separated.description);
    }
    setIsEditMode(!isEditMode);
  }, [isEditMode, summary, description, combinedContent, combineSummaryAndDescription, separateCombinedContent]);

  // 載入產品筆記
  const loadProductNote = useCallback(async () => {
    if (!productId) return;
    
    try {
      const response = await axios.get(`/api/products/${productId}/description`);
      if (response.data.success) {
        const { summary: loadedSummary, description: loadedDescription } = response.data.data;
        setSummary(loadedSummary || '');
        setDescription(loadedDescription || '');
        lastSavedSummaryRef.current = loadedSummary || '';
        lastSavedDescriptionRef.current = loadedDescription || '';
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('載入產品筆記失敗:', error);
      // 如果載入失敗，使用初始值
      setSummary(initialSummary);
      setDescription(initialDescription);
      lastSavedSummaryRef.current = initialSummary;
      lastSavedDescriptionRef.current = initialDescription;
    }
  }, [productId, initialSummary, initialDescription]);

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

  // 儲存筆記
  const saveNote = useCallback(async (summaryContent: string, descriptionContent: string, isAutoSave = false) => {
    if (!productId || 
        (summaryContent === lastSavedSummaryRef.current && 
         descriptionContent === lastSavedDescriptionRef.current)) {
      return;
    }

    try {
      if (isAutoSave) {
        setIsAutoSaving(true);
      } else {
        setIsSaving(true);
      }

      const response = await axios.patch(`/api/products/${productId}/description`, {
        summary: summaryContent,
        description: descriptionContent,
        isAutoSave
      });

      if (response.data.success) {
        lastSavedSummaryRef.current = summaryContent;
        lastSavedDescriptionRef.current = descriptionContent;
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        
        // 更新版本歷史
        await loadVersionHistory();
        
        // 顯示儲存成功訊息
        setSnackbarMessage(isAutoSave ? '自動儲存成功' : '儲存成功');
        setShowSnackbar(true);
        
        // 通知父元件
        onNoteChange?.(summaryContent, descriptionContent);
      }
    } catch (error) {
      console.error('儲存筆記失敗:', error);
      setSnackbarMessage('儲存失敗');
      setShowSnackbar(true);
    } finally {
      setIsAutoSaving(false);
      setIsSaving(false);
    }
  }, [productId, onNoteChange, loadVersionHistory]);

  // 手動儲存
  const handleManualSave = useCallback(() => {
    if (isEditMode) {
      // 編輯模式：先分離內容再儲存
      const separated = separateCombinedContent(combinedContent);
      saveNote(separated.summary, separated.description, false);
      setSummary(separated.summary);
      setDescription(separated.description);
    } else {
      // 檢視模式：直接儲存
      saveNote(summary, description, false);
    }
  }, [isEditMode, combinedContent, summary, description, saveNote, separateCombinedContent]);

  // 處理合併內容變更
  const handleCombinedContentChange = useCallback((value: string | undefined) => {
    const newValue = value || '';
    setCombinedContent(newValue);
    
    // 檢查是否有變更
    const separated = separateCombinedContent(newValue);
    setHasUnsavedChanges(
      separated.summary !== lastSavedSummaryRef.current || 
      separated.description !== lastSavedDescriptionRef.current
    );
  }, [separateCombinedContent]);

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

  // 初始化載入筆記和版本歷史
  useEffect(() => {
    if (productId) {
      loadProductNote();
      loadVersionHistory();
    }
  }, [productId, loadProductNote, loadVersionHistory]);

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
        mb: 2,
        p: 2,
        backgroundColor: 'background.paper',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
            產品筆記
          </Typography>
          
          <Chip 
            label={isEditMode ? "編輯模式" : "檢視模式"} 
            size="small" 
            color={isEditMode ? "primary" : "default"}
            variant={isEditMode ? "filled" : "outlined"}
          />
          
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
          <Tooltip title={isEditMode ? "切換到檢視模式" : "切換到編輯模式"}>
            <IconButton
              onClick={toggleEditMode}
              disabled={disabled}
              color={isEditMode ? "secondary" : "primary"}
              size="small"
            >
              {isEditMode ? <ViewIcon /> : <EditNoteIcon />}
            </IconButton>
          </Tooltip>

          {isEditMode && (
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
          )}
          
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

      {/* 編輯區域 - 單一編輯框模式 */}
      <Paper sx={{ border: '1px solid', borderColor: 'divider' }}>
        {isEditMode ? (
          /* 編輯模式 */
          <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 2 }}>
            </Box>
            <MDEditor
              value={combinedContent}
              onChange={handleCombinedContentChange}
              preview="edit"
              hideToolbar={disabled}
              visibleDragbar={false}
              data-color-mode="light"
              height={height}
              className="force-light-theme"
            />
          </Box>
        ) : (
          /* 檢視模式 */
          <Box sx={{ p: 2 }}>
            {/* 重點摘要區域 */}
            {summary.trim() && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontWeight: 'medium',
                    color: 'primary.main'
                  }}>
                    <SummaryIcon fontSize="small" />
                    重點摘要
                  </Typography>
                </Box>
                <MDEditor.Markdown
                  source={summary}
                  data-color-mode="light"
                  style={{
                    backgroundColor: 'transparent',
                    padding: '0',
                    border: 'none',
                    color: '#000000'
                  }}
                  wrapperElement={{
                    'data-color-mode': 'light'
                  }}
                  className="force-light-theme"
                />
              </Box>
            )}

            {/* 分隔線 */}
            {summary.trim() && description.trim() && (
              <Divider sx={{
                borderColor: 'divider',
                my: 2
              }} />
            )}

            {/* 詳細內容區域 */}
            {description.trim() && (
              <Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontWeight: 'medium',
                    color: 'secondary.main'
                  }}>
                    <DescriptionIcon fontSize="small" />
                    詳細內容
                  </Typography>
                </Box>
                <MDEditor.Markdown
                  source={description}
                  data-color-mode="light"
                  style={{
                    backgroundColor: 'transparent',
                    padding: '0',
                    border: 'none',
                    color: '#000000'
                  }}
                  wrapperElement={{
                    'data-color-mode': 'light'
                  }}
                  className="force-light-theme"
                />
              </Box>
            )}

            {/* 空狀態 */}
            {!summary.trim() && !description.trim() && (
              <Box sx={{ 
                textAlign: 'center', 
                py: 4,
                color: 'text.secondary'
              }}>
                <Typography variant="body1">
                  暫無產品筆記內容
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  點擊編輯按鈕開始添加內容
                </Typography>
              </Box>
            )}
          </Box>
        )}
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

export default ProductNoteEditorV2;