import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Grid,
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
  AccountBalanceWallet as DefaultTitleIcon, // Default icon for title
  ReceiptLong as DefaultMainAmountIcon // Default icon for main amount
} from '@mui/icons-material';

/**
 * 可通用的金額訊息收合元件
 * @param {Object} props - 組件屬性
 * @param {string} props.title - 收合區塊的主標題 (例如 "金額信息")
 * @param {React.ReactElement} [props.titleIcon] - 標題旁的圖示元件 (例如 <AccountBalanceWalletIcon />)
 * @param {string} props.mainAmountLabel - 固定顯示的主要金額標籤 (例如 "總金額")
 * @param {number | string} props.mainAmountValue - 固定顯示的主要金額數值
 * @param {React.ReactElement} [props.mainAmountIcon] - 主要金額旁的圖示元件 (例如 <ReceiptLongIcon />)
 * @param {Array<Object>} props.collapsibleDetails - 可收合區域的明細項目陣列
 * @param {string} props.collapsibleDetails[].label - 明細標籤
 * @param {string | number} props.collapsibleDetails[].value - 明細數值
 * @param {React.ReactElement} props.collapsibleDetails[].icon - 明細圖示
 * @param {string} [props.collapsibleDetails[].color] - 明細數值顏色 (例如 'success.main', 'error.main')
 * @param {string} [props.collapsibleDetails[].fontWeight] - 明細數值字體粗細 (例如 'bold')
 * @param {boolean | function} [props.collapsibleDetails[].condition] - 決定是否顯示此明細的條件，預設為true
 * @param {boolean} [props.initialOpenState=true] - 收合區塊的初始展開狀態
 * @param {boolean} [props.isLoading=false] - 可收合區域是否正在載入
 * @param {string} [props.loadingText='載入中...'] - 載入時顯示的文字
 * @param {string} [props.error=null] - 載入錯誤時顯示的錯誤訊息
 * @param {string} [props.noDetailsText='無詳細資料'] - 沒有明細時顯示的文字
 * @returns {React.ReactElement} 可通用的金額訊息收合元件
 */
const CollapsibleAmountInfo = ({
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
  const [isOpen, setIsOpen] = useState(initialOpenState);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const TitleIconComponent = titleIcon || <DefaultTitleIcon sx={{ verticalAlign: 'middle', mr: 1 }} />;
  const MainAmountIconComponent = mainAmountIcon || <DefaultMainAmountIcon color="primary" fontSize="small" />;

  // 處理主要金額顯示
  const formattedMainAmount = typeof mainAmountValue === 'number' 
    ? mainAmountValue.toFixed(2) 
    : mainAmountValue;

  // 處理可收合區域內容
  const renderCollapsibleContent = () => {
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
                    <Typography 
                      variant="body1" 
                      color={detail.color || 'text.primary'} 
                      fontWeight={detail.fontWeight || 'normal'}
                    >
                      {typeof detail.value === 'number' ? detail.value.toFixed(2) : detail.value}
                    </Typography>
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
          {renderCollapsibleContent()}
        </CardContent>
      </Collapse>
    </Card>
  );
};

// Props 驗證
CollapsibleAmountInfo.propTypes = {
  title: PropTypes.string.isRequired,
  titleIcon: PropTypes.element,
  mainAmountLabel: PropTypes.string.isRequired,
  mainAmountValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  mainAmountIcon: PropTypes.element,
  collapsibleDetails: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      icon: PropTypes.element,
      color: PropTypes.string,
      fontWeight: PropTypes.string,
      condition: PropTypes.oneOfType([PropTypes.bool, PropTypes.func])
    })
  ),
  initialOpenState: PropTypes.bool,
  isLoading: PropTypes.bool,
  loadingText: PropTypes.string,
  error: PropTypes.string,
  noDetailsText: PropTypes.string
};

// 預設值
CollapsibleAmountInfo.defaultProps = {
  collapsibleDetails: [],
  initialOpenState: true,
  isLoading: false,
  loadingText: '載入中...',
  error: null,
  noDetailsText: '無詳細資料'
};

export default CollapsibleAmountInfo;
