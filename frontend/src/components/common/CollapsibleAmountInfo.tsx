import React, { useState, ReactElement } from 'react';
import {
  Box,
  Typography,
  Grid as MuiGrid,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Stack,
  IconButton,
  Collapse
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  AccountBalanceWallet as DefaultTitleIcon,
  ReceiptLong as DefaultMainAmountIcon
} from '@mui/icons-material';

// 直接使用 MuiGrid
const Grid = MuiGrid;

/**
 * 明細項目介面
 */
interface DetailItem {
  label: string;
  value: string | number;
  icon?: ReactElement;
  color?: string;
  fontWeight?: string;
  condition?: boolean | (() => boolean);
  valueFormatter?: (val: any) => string;
  customContent?: React.ReactNode;
}

/**
 * 詳細資料項目組件介面
 */
interface CollapsibleContentProps {
  isLoading: boolean;
  loadingText: string;
  error: string | null;
  collapsibleDetails: DetailItem[];
  noDetailsText: string;
}

/**
 * 詳細資料項目組件
 */
const CollapsibleContent: React.FC<CollapsibleContentProps> = ({
  isLoading,
  loadingText,
  error,
  collapsibleDetails,
  noDetailsText
}) => {
  // 渲染詳細值的輔助函數 - 解決嵌套三元運算子問題 (Sonar Rule S3358)
  const renderDetailValue = (detail: DetailItem): React.ReactNode => {
    if (detail.customContent) {
      return detail.customContent;
    }
    
    // 格式化值
    let displayValue = detail.value;
    if (detail.valueFormatter) {
      displayValue = detail.valueFormatter(detail.value);
    } else if (typeof detail.value === 'number') {
      displayValue = detail.value.toFixed(2);
    }
    
    return (
      <Typography
        variant="body1"
        color={detail.color ?? 'text.primary'}
        fontWeight={detail.fontWeight ?? 'normal'}
      >
        {displayValue}
      </Typography>
    );
  };
  // 載入中狀態
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} sx={{ mr: 1 }} />
        <Typography variant="body2" color="text.secondary">{loadingText}</Typography>
      </Box>
    );
  }
  
  // 錯誤狀態
  if (error) {
    return (
      <Typography color="error" variant="body2" sx={{ p: 2, textAlign: 'center' }}>{error}</Typography>
    );
  }
  
  // 有明細資料狀態
  const filteredDetails = collapsibleDetails.filter(
    detail => typeof detail.condition === 'function' ? detail.condition() : detail.condition !== false
  );
  
  if (filteredDetails.length > 0) {
    return (
      <Grid container spacing={2} alignItems="flex-start">
        {filteredDetails.map((detail, index) => {
          const DetailIconComponent = detail.icon;
          // 使用更穩定的複合 key 而非純索引
          const detailKey = `detail-${detail.label}-${index}`;

          return (
            <Grid item xs={6} sm={4} md={3} key={detailKey}>
              <Stack direction="row" spacing={1} alignItems="center">
                {DetailIconComponent && React.cloneElement(DetailIconComponent, {
                  sx: { fontSize: 'small', color: 'action', ...DetailIconComponent.props.sx }
                })}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">{detail.label}</Typography>
                  {renderDetailValue(detail)}
                </Box>
              </Stack>
            </Grid>
          );
        })}
      </Grid>
    );
  }
  
  // 無明細資料狀態
  return (
    <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
      {noDetailsText}
    </Typography>
  );
};

/**
 * 可通用的金額訊息收合元件
 */
interface CollapsibleAmountInfoProps {
  title: string;
  titleIcon?: ReactElement;
  mainAmountLabel: string;
  mainAmountValue: number | string;
  mainAmountIcon?: ReactElement;
  collapsibleDetails?: DetailItem[];
  initialOpenState?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  error?: string;
  noDetailsText?: string;
}

const CollapsibleAmountInfo: React.FC<CollapsibleAmountInfoProps> = ({
  title,
  titleIcon,
  mainAmountLabel,
  mainAmountValue,
  mainAmountIcon,
  collapsibleDetails = [],
  initialOpenState = true,
  isLoading = false,
  loadingText = '載入中...',
  error = null,
  noDetailsText = '無詳細資料'
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(initialOpenState);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const TitleIconComponent = titleIcon ?? <DefaultTitleIcon sx={{ verticalAlign: 'middle', mr: 1 }} />;
  const MainAmountIconComponent = mainAmountIcon ?? <DefaultMainAmountIcon color="primary" fontSize="small" />;

  // 處理主要金額顯示
  const formattedMainAmount = typeof mainAmountValue === 'number' 
    ? mainAmountValue.toFixed(2) 
    : mainAmountValue;


  return (
    <Card variant="outlined">
      <CardContent sx={{ pb: '16px !important' }}>
        <Grid container spacing={1} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm="auto" onClick={handleToggle} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', flexGrow: { xs: 1, sm: 0 } }}>
            <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
              {React.cloneElement(TitleIconComponent, { sx: { verticalAlign: 'middle', mr: 1, ...TitleIconComponent.props.sx } })}
              {title}
            </Typography>
            <IconButton size="small" sx={{ ml: 0.5 }}>
              <ExpandMoreIcon sx={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
            </IconButton>
          </Grid>
          <Grid item xs={12} sm="auto" sx={{ mt: { xs: 1, sm: 0 } }}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: 'flex-end', sm: 'flex-end' }}>
              {React.cloneElement(MainAmountIconComponent, { sx: { ...MainAmountIconComponent.props.sx } })}
              <Box textAlign="right">
                <Typography variant="subtitle2" color="text.secondary">{mainAmountLabel}</Typography>
                <Typography variant="h6" color="primary.main" fontWeight="bold">
                  {formattedMainAmount}
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
      <Collapse in={isOpen} timeout="auto" unmountOnExit>
        <Divider />
        <CardContent>
          <CollapsibleContent
            isLoading={isLoading}
            loadingText={loadingText}
            error={error}
            collapsibleDetails={collapsibleDetails}
            noDetailsText={noDetailsText}
          />
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default CollapsibleAmountInfo;