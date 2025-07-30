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
  Tooltip,
  Alert,
  Snackbar,
  Divider
} from '@mui/material';
import {
  Save as SaveIcon,
  AutoMode as AutoSaveIcon,
  Edit as EditIcon,
  Summarize as SummaryIcon,
  Description as DescriptionIcon,
  Visibility as ViewIcon,
  EditNote as EditNoteIcon
} from '@mui/icons-material';
import MDEditor, { commands } from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import axios from 'axios';
import '../../styles/force-light-theme.css';
import { prepareMarkdownForDisplay } from '../../utils/markdownUtils';


// 元件 Props 介面
interface ProductNoteEditorProps {
  productId: string;
  initialSummary?: string;
  initialDescription?: string;
  onNoteChange?: (summary: string, description: string) => void;
  autoSaveInterval?: number; // 自動儲存間隔（毫秒）
  disabled?: boolean;
}

/**
 * 產品筆記編輯元件 V2 - 單一編輯框模式
 * 功能：
 * - 檢視/編輯模式切換
 * - 單一編輯框合併編輯
 * - 手動儲存
 */
const ProductNoteEditorV2: React.FC<ProductNoteEditorProps> = ({
  productId,
  initialSummary = '',
  initialDescription = '',
  onNoteChange,
  autoSaveInterval = 30000, // 預設30秒自動儲存 (暫未實現自動儲存)
  disabled = false,
}) => {
  // 狀態管理
  const [summary, setSummary] = useState<string>(initialSummary);
  const [description, setDescription] = useState<string>(initialDescription);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);

  // Refs
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedSummaryRef = useRef<string>(initialSummary);
  const lastSavedDescriptionRef = useRef<string>(initialDescription);

  // 消除未使用參數警告（未來可實現自動儲存功能）
  void autoSaveInterval;

  // 自定義 MDEditor 工具列命令
  const customCommands = [
    commands.bold,
    commands.italic,
    commands.strikethrough,
    commands.hr,
    commands.divider,
    commands.link,
    commands.unorderedListCommand,
    commands.orderedListCommand,
    commands.checkedListCommand,
    commands.divider,
    // 自定義維基百科按鈕
    {
      name: 'wikipedia',
      keyCommand: 'wikipedia',
      buttonProps: { 'aria-label': '開啟維基百科', title: '開啟維基百科' },
      icon: (
        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>W</span>
      ),
      execute: () => {
        window.open('https://zh.wikipedia.org/wiki/Wikipedia:%E9%A6%96%E9%A1%B5', '_blank');
      }
    }
  ];


  // 切換編輯模式
  const toggleEditMode = useCallback(() => {
    // 簡單切換編輯模式，不需要合併/分離內容
    // 因為現在直接編輯 summary 和 description
    setIsEditMode(!isEditMode);
  }, [isEditMode]);

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
  }, [productId, onNoteChange]);

  // 手動儲存
  const handleManualSave = useCallback(() => {
    // 直接儲存當前的摘要和詳細內容
    saveNote(summary, description, false);
  }, [summary, description, saveNote]);


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

  // 初始化載入筆記
  useEffect(() => {
    if (productId) {
      loadProductNote();
    }
  }, [productId, loadProductNote]);

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
          <Typography variant="h6" sx={{ fontWeight: 'small' }}>
            筆記
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
          
        </Box>
      </Box>

      {/* 編輯區域 - 分區編輯模式 */}
      <Paper sx={{ border: '1px solid', borderColor: 'divider' }}>
        {isEditMode ? (
          /* 編輯模式 */
          <Box sx={{ p: 2 }}>
            {/* 重點摘要編輯區 */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{
                mb: 2,
                color: 'text.secondary',
                fontWeight: 'medium',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <SummaryIcon fontSize="small" />
                # 重點摘要
              </Typography>
              <MDEditor
                value={summary}
                onChange={(value) => {
                  const newSummary = value || '';
                  setSummary(newSummary);
                  setHasUnsavedChanges(
                    newSummary !== lastSavedSummaryRef.current ||
                    description !== lastSavedDescriptionRef.current
                  );
                }}
                preview="edit"
                hideToolbar={disabled}
                visibleDragbar={false}
                data-color-mode="light"
                height={summary.trim() ? Math.max(150, Math.min(300, summary.split('\n').length * 25 + 100)) : 150}
                className="force-light-theme"
                commands={customCommands}
              />
            </Box>

            {/* 詳細內容編輯區 */}
            <Box>
              <Typography variant="h6" sx={{
                mb: 2,
                color: 'text.secondary',
                fontWeight: 'medium',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <DescriptionIcon fontSize="small" />
                # 詳細內容
              </Typography>
              <MDEditor
                value={description}
                onChange={(value) => {
                  const newDescription = value || '';
                  setDescription(newDescription);
                  setHasUnsavedChanges(
                    summary !== lastSavedSummaryRef.current ||
                    newDescription !== lastSavedDescriptionRef.current
                  );
                }}
                preview="edit"
                hideToolbar={disabled}
                visibleDragbar={false}
                data-color-mode="light"
                height={description.trim() ? Math.max(200, Math.min(400, description.split('\n').length * 25 + 100)) : 200}
                className="force-light-theme"
                commands={customCommands}
              />
            </Box>
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
                  source={prepareMarkdownForDisplay(summary)}
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
                  components={{
                    a: ({ href, children, ...props }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontWeight: 'bold',
                          fontStyle: 'italic',
                          textDecoration: 'underline'
                        }}
                        {...props}
                      >
                        {children}
                      </a>
                    )
                  }}
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
                  source={prepareMarkdownForDisplay(description)}
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
                  components={{
                    a: ({ href, children, ...props }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontWeight: 'bold',
                          fontStyle: 'italic',
                          textDecoration: 'underline'
                        }}
                        {...props}
                      >
                        {children}
                      </a>
                    )
                  }}
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