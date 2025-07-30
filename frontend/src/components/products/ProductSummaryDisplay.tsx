import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Skeleton,
  IconButton,
  Tooltip,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider
} from '@mui/material';
import {
  Summarize as SummaryIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Description as DescriptionIcon,
  Close as CloseIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import MDEditor from '@uiw/react-md-editor';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../styles/force-light-theme.css';
import { prepareMarkdownForDisplay } from '../../utils/markdownUtils';

// 元件 Props 介面
interface ProductSummaryDisplayProps {
  productId: string;
  maxLines?: number;
  expandable?: boolean;
  variant?: 'compact' | 'normal' | 'detailed';
  clickable?: boolean;
}

/**
 * 產品摘要顯示元件
 * 用於在產品列表中顯示重點摘要
 */
const ProductSummaryDisplay: React.FC<ProductSummaryDisplayProps> = ({
  productId,
  maxLines = 3,
  expandable = true,
  variant = 'normal',
  clickable = true
}) => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<boolean>(false);
  const [showFullDialog, setShowFullDialog] = useState<boolean>(false);

  // 載入產品摘要
  useEffect(() => {
    const loadSummary = async () => {
      if (!productId) return;
      
      try {
        setLoading(true);
        const response = await axios.get(`/api/products/${productId}/description`);
        
        if (response.data.success) {
          const { summary: loadedSummary, description: loadedDescription } = response.data.data;
          setSummary(loadedSummary || '');
          setDescription(loadedDescription || '');
        }
      } catch (error) {
        console.error('載入產品摘要失敗:', error);
        setError('載入失敗');
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, [productId]);

  // 處理展開/收合
  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  // 處理點擊卡片顯示完整筆記
  const handleCardClick = () => {
    if (clickable) {
      setShowFullDialog(true);
    }
  };

  // 關閉完整筆記對話框
  const handleCloseDialog = () => {
    setShowFullDialog(false);
  };

  // 處理編輯筆記按鈕點擊 - 開新分頁
  const handleEditNote = () => {
    setShowFullDialog(false);
    window.open(`/products/edit/${productId}`, '_blank');
  };

  // 渲染載入狀態
  if (loading) {
    return (
      <Box sx={{ py: 1 }}>
        <Skeleton variant="text" width="100%" height={20} />
        <Skeleton variant="text" width="80%" height={20} />
        <Skeleton variant="text" width="60%" height={20} />
      </Box>
    );
  }

  // 渲染錯誤狀態
  if (error) {
    return (
      <Box sx={{ py: 1 }}>
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  // 如果沒有摘要內容
  if (!summary.trim()) {
    return (
      <>
        <Box 
          sx={{ 
            py: 1,
            cursor: clickable ? 'pointer' : 'default',
            '&:hover': clickable ? {
              backgroundColor: 'action.hover',
              borderRadius: 1
            } : {}
          }}
          onClick={handleCardClick}
        >
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            暫無產品摘要
          </Typography>
        </Box>

        {/* 完整筆記檢視對話框 */}
        <Dialog
          open={showFullDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { minHeight: '60vh' }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            pb: 1
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DescriptionIcon color="primary" />
              <Typography variant="h6">產品筆記</Typography>
            </Box>
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          
          <DialogContent sx={{ pt: 1 }}>
            <Box sx={{ 
              textAlign: 'center', 
              py: 4,
              color: 'text.secondary'
            }}>
              <Typography variant="body1">
                暫無產品筆記內容
              </Typography>
            </Box>
          </DialogContent>
          
          <DialogActions>
            <Button
              onClick={handleEditNote}
              variant="contained"
              startIcon={<EditIcon />}
              sx={{ mr: 1 }}
            >
              編輯筆記
            </Button>
            <Button onClick={handleCloseDialog}>
              關閉
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  // 根據變體決定樣式
  const getVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return {
          fontSize: '0.875rem',
          lineHeight: 1.4,
          maxLines: 2
        };
      case 'detailed':
        return {
          fontSize: '1rem',
          lineHeight: 1.6,
          maxLines: 5
        };
      default:
        return {
          fontSize: '0.9375rem',
          lineHeight: 1.5,
          maxLines: maxLines
        };
    }
  };

  const styles = getVariantStyles();

  // 檢查是否需要截斷
  const lines = summary.split('\n');
  const shouldTruncate = lines.length > styles.maxLines && !expanded;
  const displayText = shouldTruncate 
    ? lines.slice(0, styles.maxLines).join('\n') + '...'
    : summary;

  // 檢查是否需要顯示標題區域
  const showHeaderArea = variant === 'detailed' || 
                         (expandable && lines.length > styles.maxLines);

  return (
    <>
      <Box 
        sx={{ 
          py: variant === 'compact' ? 0.5 : 1,
          cursor: clickable ? 'pointer' : 'default',
          '&:hover': clickable ? {
            backgroundColor: 'action.hover',
            borderRadius: 1
          } : {}
        }}
        onClick={handleCardClick}
      >
        {/* 標題和操作按鈕 - 只在需要時顯示 */}
        {showHeaderArea && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mb: variant === 'detailed' ? 1 : 0.5
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {variant === 'detailed' && (
                <SummaryIcon fontSize="small" color="primary" />
              )}
              {variant === 'detailed' && (
                <Typography variant="subtitle2" color="primary">
                  產品重點
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {expandable && lines.length > styles.maxLines && (
                <Tooltip title={expanded ? '收合' : '展開'}>
                  <IconButton 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleExpand();
                    }}
                  >
                    {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        )}

        {/* 摘要內容 */}
        <Collapse in={expanded || !shouldTruncate}>
          <Typography
            variant="body2"
            sx={{
              fontSize: styles.fontSize,
              lineHeight: styles.lineHeight,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: 'text.primary',
              '& strong': {
                fontWeight: 600,
                color: 'primary.main'
              },
              '& em': {
                fontStyle: 'italic',
                color: 'text.secondary'
              },
              '& code': {
                backgroundColor: 'grey.100',
                padding: '2px 4px',
                borderRadius: '4px',
                fontSize: '0.875em',
                fontFamily: 'monospace'
              }
            }}
          >
            {expanded ? summary : displayText}
          </Typography>
        </Collapse>

        {/* 截斷狀態下的預覽 */}
        {!expanded && shouldTruncate && (
          <Typography
            variant="body2"
            sx={{
              fontSize: styles.fontSize,
              lineHeight: styles.lineHeight,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: 'text.primary',
              display: '-webkit-box',
              WebkitLineClamp: styles.maxLines,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              '& strong': {
                fontWeight: 600,
                color: 'primary.main'
              },
              '& em': {
                fontStyle: 'italic',
                color: 'text.secondary'
              },
              '& code': {
                backgroundColor: 'grey.100',
                padding: '2px 4px',
                borderRadius: '4px',
                fontSize: '0.875em',
                fontFamily: 'monospace'
              }
            }}
          >
            {displayText}
          </Typography>
        )}
      </Box>

      {/* 完整筆記檢視對話框 */}
      <Dialog
        open={showFullDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '60vh' }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DescriptionIcon color="primary" />
            <Typography variant="h6">產品筆記</Typography>
          </Box>
          <IconButton onClick={handleCloseDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 1 }}>
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
              />
            </Box>
          )}

          {/* 分隔線 */}
          {summary.trim() && description.trim() && (
            <Divider sx={{ my: 3 }} />
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
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button
            onClick={handleEditNote}
            variant="contained"
            startIcon={<EditIcon />}
            sx={{ mr: 1 }}
          >
            編輯筆記
          </Button>
          <Button onClick={handleCloseDialog}>
            關閉
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProductSummaryDisplay;