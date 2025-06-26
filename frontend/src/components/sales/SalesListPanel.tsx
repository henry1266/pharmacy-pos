import React, { useMemo } from 'react';
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
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon
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
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <ReceiptIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" component="h2">
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
      </CardContent>
      
      <Divider />
      
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {filteredSales.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="textSecondary">
              {searchTerm ? '沒有符合搜索條件的銷售記錄' : '尚無銷售記錄'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {filteredSales.map((sale, index) => (
              <React.Fragment key={sale._id}>
                <ListItem
                  button
                  onClick={() => onSaleClick?.(sale)}
                  sx={{
                    py: 2,
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {sale.saleNumber ?? '無單號'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {sale.date ? format(new Date(sale.date), 'MM/dd HH:mm', { locale: zhTW }) : ''}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <PersonIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2" color="textSecondary">
                            {sale.customer?.name ?? '一般客戶'}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ mb: 1 }}>
                          {sale.items.slice(0, 2).map((item, itemIndex) => (
                            <Typography key={item.product?._id || item.name} variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                              {item.product?.name ?? item.name} x {item.quantity}
                            </Typography>
                          ))}
                          {sale.items.length > 2 && (
                            <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
                              ...等 {sale.items.length} 項商品
                            </Typography>
                          )}
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            ${sale.totalAmount?.toFixed(0) ?? '0'}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
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
                      </Box>
                    }
                  />
                </ListItem>
                {index < filteredSales.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
    </Card>
  );
};

export default SalesListPanel;