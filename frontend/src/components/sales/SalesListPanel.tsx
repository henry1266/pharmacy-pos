import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Divider,
  Collapse,
  IconButton
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Sale } from '../../hooks/useSalesListData';

interface SalesListPanelProps {
  sales: Sale[];
  loading: boolean;
  error: string | null;
  isTestMode: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSaleClick?: (sale: Sale) => void;
}

// 付款方式和狀態的映射函數
const getPaymentMethodText = (method: string): string => {
  const methodMap: Record<string, string> = {
    'cash': '現金',
    'credit_card': '信用卡',
    'debit_card': '金融卡',
    'mobile_payment': '行動支付',
    'other': '其他'
  };
  return methodMap[method] ?? method;
};

interface PaymentStatusInfo {
  text: string;
  color: 'success' | 'warning' | 'info' | 'error' | 'default';
}

const getPaymentStatusInfo = (status: string): PaymentStatusInfo => {
  const statusMap: Record<string, PaymentStatusInfo> = {
    'paid': { text: '已付款', color: 'success' },
    'pending': { text: '待付款', color: 'warning' },
    'partial': { text: '部分付款', color: 'info' },
    'cancelled': { text: '已取消', color: 'error' }
  };
  return statusMap[status] ?? { text: status, color: 'default' };
};

const SalesListPanel: React.FC<SalesListPanelProps> = ({
  sales,
  loading,
  error,
  isTestMode,
  searchTerm,
  onSearchChange,
  onSaleClick
}) => {
  // 摺疊狀態管理
  const [expandedSales, setExpandedSales] = useState<Set<string>>(new Set());

  const toggleExpanded = (saleId: string) => {
    setExpandedSales(prev => {
      const newSet = new Set(prev);
      if (newSet.has(saleId)) {
        newSet.delete(saleId);
      } else {
        newSet.add(saleId);
      }
      return newSet;
    });
  };
  // 過濾銷售記錄
  const filteredSales = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return sales;

    return sales.filter(({ customer, items, _id, saleNumber, date }) => {
      const searchableFields: string[] = [
        customer?.name ?? '',
        items.map(item => item.product?.name ?? item.name ?? '').join(' '),
        String(_id ?? ''),
        String(saleNumber ?? ''),
        date ? format(new Date(date), 'yyyy-MM-dd') : ''
      ];

      return searchableFields.some(field =>
        field.toLowerCase().includes(keyword)
      );
    });
  }, [sales, searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onSearchChange(e.target.value);
  };

  if (loading) {
    return (
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>載入銷售記錄中...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (error && !isTestMode) {
    return (
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      maxHeight: '100%',
      overflow: 'hidden' // 防止整體滾動
    }}>
      {/* 固定頂部區域 */}
      <Box sx={{
        flexShrink: 0,
        borderBottom: '1px solid',
        borderColor: 'divider',
        p: 2
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <ReceiptIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" component="h2" sx={{ fontSize: '1.1rem' }}>
              銷售記錄 {isTestMode && <Typography component="span" sx={{ fontSize: '0.8em', color: 'orange', fontWeight: 'bold' }}>(測試模式)</Typography>}
            </Typography>
          </Box>
          <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
            僅顯示當天且編號前八碼相符的記錄
          </Typography>
        </Box>
        
        <TextField
          fullWidth
          size="small"
          placeholder="搜索銷售記錄..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
      </Box>
      
      {/* 可滾動內容區域 */}
      <Box sx={{
        flexGrow: 1,
        overflow: 'auto',
        minHeight: 0
      }}>
        {filteredSales.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="textSecondary">
              {searchTerm ? '沒有符合搜索條件的銷售記錄' : '尚無銷售記錄'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {filteredSales.map((sale, index) => {
              const isExpanded = expandedSales.has(sale._id);
              return (
                <React.Fragment key={sale._id}>
                  <ListItem
                    sx={{
                      py: 0.5,
                      px: 1.5, // 縮窄左右內距
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      minHeight: '64px', // 固定最小高度
                      maxHeight: isExpanded ? 'none' : '64px', // 摺疊時限制高度
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    {/* 摺疊狀態：僅顯示基本資訊 */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        width: '100%',
                        cursor: 'pointer',
                        minHeight: '60px', // 確保基本資訊區域固定高度
                        py: 0.5,
                        gap: 0.5
                      }}
                      onClick={() => toggleExpanded(sale._id)}
                    >
                      <Box sx={{
                        flex: 1,
                        minWidth: 0, // 允許文字截斷
                        overflow: 'hidden',
                        pr: 0.75 // 縮窄右邊距
                      }}>
                        {/* 單行顯示：銷貨單號、金額、時間 */}
                        <Box sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 1,
                          width: '100%'
                        }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 'bold',
                              fontSize: '0.85rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              lineHeight: 1.3,
                              flex: '0 1 auto',
                              minWidth: 0
                            }}
                          >
                            {sale.saleNumber ?? '無單號'}
                          </Typography>
                          
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 'bold',
                              color: 'primary.main',
                              fontSize: '0.8rem',
                              lineHeight: 1.2,
                              flexShrink: 0
                            }}
                          >
                            ${sale.totalAmount?.toFixed(0) ?? '0'}
                          </Typography>
                          
                          <Typography
                            variant="caption"
                            color="textSecondary"
                            sx={{
                              fontSize: '0.7rem',
                              lineHeight: 1.2,
                              textAlign: 'right',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flexShrink: 0
                            }}
                          >
                            {sale.date ? format(new Date(sale.date), 'MM/dd HH:mm', { locale: zhTW }) : ''}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <IconButton
                        size="small"
                        sx={{
                          p: 0.25,
                          flexShrink: 0,
                          alignSelf: 'center'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpanded(sale._id);
                        }}
                      >
                        {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                      </IconButton>
                    </Box>

                    {/* 展開狀態：顯示詳細資訊 */}
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                        {/* 客戶和付款資訊同一列 */}
                        <Box sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 1,
                          gap: 1
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                            <PersonIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="body2" color="textSecondary" sx={{
                              fontSize: '0.8rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {sale.customer?.name ?? '一般客戶'}
                            </Typography>
                          </Box>
                          
                          {/* 付款狀態和方式放右上 */}
                          <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                            <Chip
                              label={getPaymentMethodText(sale.paymentMethod)}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                            <Chip
                              label={getPaymentStatusInfo(sale.paymentStatus).text}
                              color={getPaymentStatusInfo(sale.paymentStatus).color}
                              size="small"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          </Box>
                        </Box>
                        
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 0.5, fontSize: '0.8rem' }}>
                            商品明細：
                          </Typography>
                          {sale.items.map((item, itemIndex) => (
                            <Typography key={item.product?._id || item.name} variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem', ml: 1 }}>
                              • {item.product?.name ?? item.name} x {item.quantity}
                            </Typography>
                          ))}
                        </Box>

                        {onSaleClick && (
                          <Box sx={{ mt: 1, textAlign: 'right' }}>
                            <Typography
                              variant="caption"
                              color="primary"
                              sx={{
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                fontSize: '0.75rem'
                              }}
                              onClick={() => onSaleClick(sale)}
                            >
                              查看詳情
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Collapse>
                  </ListItem>
                  {index < filteredSales.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Box>
    </Card>
  );
};

export default SalesListPanel;