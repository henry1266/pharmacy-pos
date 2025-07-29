import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Skeleton,
  IconButton,
  Tooltip,
  Collapse
} from '@mui/material';
import {
  Summarize as SummaryIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import axios from 'axios';

// 元件 Props 介面
interface ProductSummaryDisplayProps {
  productId: string;
  showEditButton?: boolean;
  onEditClick?: () => void;
  maxLines?: number;
  expandable?: boolean;
  variant?: 'compact' | 'normal' | 'detailed';
}

/**
 * 產品摘要顯示元件
 * 用於在產品列表中顯示重點摘要
 */
const ProductSummaryDisplay: React.FC<ProductSummaryDisplayProps> = ({
  productId,
  showEditButton = false,
  onEditClick,
  maxLines = 3,
  expandable = true,
  variant = 'normal'
}) => {
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<boolean>(false);
  const [wordCount, setWordCount] = useState<number>(0);

  // 載入產品摘要
  useEffect(() => {
    const loadSummary = async () => {
      if (!productId) return;
      
      try {
        setLoading(true);
        const response = await axios.get(`/api/products/${productId}/description`);
        
        if (response.data.success) {
          const { summary: loadedSummary, summaryWordCount } = response.data.data;
          setSummary(loadedSummary || '');
          setWordCount(summaryWordCount || 0);
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
      <Box sx={{ 
        py: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
      }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          暫無產品摘要
        </Typography>
        {showEditButton && (
          <Tooltip title="編輯產品筆記">
            <IconButton size="small" onClick={onEditClick}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
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

  return (
    <Box sx={{ py: 1 }}>
      {/* 標題和操作按鈕 */}
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
          {wordCount > 0 && variant !== 'compact' && (
            <Chip 
              label={`${wordCount} 字`} 
              size="small" 
              variant="outlined"
              sx={{ height: 20, fontSize: '0.75rem' }}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {expandable && lines.length > styles.maxLines && (
            <Tooltip title={expanded ? '收合' : '展開'}>
              <IconButton size="small" onClick={handleToggleExpand}>
                {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}
          
          {showEditButton && (
            <Tooltip title="編輯產品筆記">
              <IconButton size="small" onClick={onEditClick}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

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
  );
};

export default ProductSummaryDisplay;