import React, { useState } from 'react';
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
                  {typeof mainAmountValue === 'number' ? mainAmountValue.toFixed(2) : mainAmountValue}
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
      <Collapse in={isOpen} timeout="auto" unmountOnExit>
        <Divider />
        <CardContent>
          {isLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">{loadingText}</Typography>
            </Box>
          ) : error ? (
            <Typography color="error" variant="body2" sx={{ p: 2, textAlign: 'center' }}>{error}</Typography>
          ) : collapsibleDetails && collapsibleDetails.filter(detail => typeof detail.condition === 'function' ? detail.condition() : detail.condition !== false).length > 0 ? (
            <Grid container spacing={2} alignItems="flex-start">
              {collapsibleDetails.map((detail, index) => {
                const shouldRender = typeof detail.condition === 'function' ? detail.condition() : detail.condition !== false;
                if (!shouldRender) return null;

                const DetailIconComponent = detail.icon;

                return (
                  <Grid item xs={6} sm={4} md={3} key={index}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {DetailIconComponent && React.cloneElement(DetailIconComponent, { sx: { fontSize: 'small', color: 'action', ...DetailIconComponent.props.sx } })}
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
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>{noDetailsText}</Typography>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default CollapsibleAmountInfo;

