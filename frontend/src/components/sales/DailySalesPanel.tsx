import React, { useMemo, useState, useEffect } from 'react';
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
  IconButton,
  Link,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  UnfoldMore as UnfoldMoreIcon,
  UnfoldLess as UnfoldLessIcon,
  FilterAlt as FilterAltIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import type { Sale } from '@pharmacy-pos/shared/types/entities';
import WildcardSearchHelp from '../common/WildcardSearchHelp';

interface DailySalesPanelProps {
  sales: Sale[];
  loading: boolean;
  error: string | null;
  targetDate: string; // 目標日期，用於過濾
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSaleClick?: (sale: Sale) => void;
  // 新增萬用字元搜尋相關屬性
  wildcardMode?: boolean;
  onWildcardModeChange?: (enabled: boolean) => void;
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

// 過濾銷售記錄：使用與 useSalesListData 相同的邏輯
const filterSalesForDate = (sales: Sale[], targetDate: string): Sale[] => {
  const targetDateFormatted = format(new Date(targetDate), 'yyyy-MM-dd');
  
  return sales.filter(sale => {
    // 檢查日期是否為目標日期
    if (!sale.date) return false;
    
    const saleDate = format(new Date(sale.date), 'yyyy-MM-dd');
    const isTargetDate = saleDate === targetDateFormatted;
    
    // 檢查銷售編號前八碼是否與目標日期相符
    if (!sale.saleNumber) return isTargetDate;
    
    // 提取前八碼 (格式通常為 YYYYMMDD)
    const saleDatePrefix = sale.saleNumber.substring(0, 8);
    const targetDatePrefix = format(new Date(targetDate), 'yyyyMMdd');
    const isPrefixMatch = saleDatePrefix === targetDatePrefix;
    
    return isTargetDate && isPrefixMatch;
  });
};

const DailySalesPanel: React.FC<DailySalesPanelProps> = ({
  sales,
  loading,
  error,
  targetDate,
  searchTerm,
  onSearchChange,
  onSaleClick,
  wildcardMode = false,
  onWildcardModeChange
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

  // 先過濾日期，再過濾搜尋條件
  const dailySales = useMemo(() => {
    return filterSalesForDate(sales, targetDate);
  }, [sales, targetDate]);

  // 一鍵展開/收起所有記錄
  const toggleAllExpanded = () => {
    if (expandedSales.size === filteredSales.length && filteredSales.length > 0) {
      // 如果全部都展開了，則收起全部
      setExpandedSales(new Set());
    } else {
      // 否則展開全部
      const allIds = new Set(filteredSales.map(sale => sale._id));
      setExpandedSales(allIds);
    }
  };
  
  // 過濾銷售記錄
  const filteredSales = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return dailySales;

    return dailySales.filter(({ customer, items, _id, saleNumber, date }) => {
      const searchableFields: string[] = [
        typeof customer === 'string' ? customer : customer?.name ?? '',
        items.map(item => typeof item.product === 'object' && item.product?.name ? item.product.name : (typeof item.product === 'string' ? item.product : '')).join(' '),
        String(_id ?? ''),
        String(saleNumber ?? ''),
        date ? format(new Date(date), 'yyyy-MM-dd') : ''
      ];

      return searchableFields.some(field =>
        field.toLowerCase().includes(keyword)
      );
    });
  }, [dailySales, searchTerm]);

  // 當有搜尋條件時自動展開全部
  useEffect(() => {
    if (searchTerm.trim()) {
      // 展開所有過濾後的銷售記錄
      const allFilteredIds = new Set(filteredSales.map(sale => sale._id));
      setExpandedSales(allFilteredIds);
    } else {
      // 清空搜尋時收起全部
      setExpandedSales(new Set());
    }
  }, [searchTerm, filteredSales]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onSearchChange(e.target.value);
  };

  // 計算總金額
  const totalAmount = useMemo(() => {
    return dailySales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
  }, [dailySales]);

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

  if (error) {
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
      overflow: 'hidden'
    }}>
      {/* 固定頂部區域 */}
      <Box sx={{
        flexShrink: 0,
        borderBottom: '1px solid',
        borderColor: 'divider',
        p: 2
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ReceiptIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" component="h2" sx={{ fontSize: '1.1rem' }}>
                當日銷售
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              總計：${totalAmount.toFixed(0)}
            </Typography>
          </Box>
          <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
            {format(new Date(targetDate), 'yyyy年MM月dd日', { locale: zhTW })} - 僅顯示當天且編號前八碼相符的記錄
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            fullWidth
            size="small"
            placeholder={wildcardMode ? "萬用字元搜尋 (支援 * 和 ?)..." : "搜索銷售記錄..."}
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: wildcardMode ? (
                <InputAdornment position="end">
                  <Chip
                    label="萬用字元"
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                </InputAdornment>
              ) : undefined
            }}
          />
          
          {/* 萬用字元模式切換 */}
          {onWildcardModeChange && (
            <Tooltip title={wildcardMode ? "切換到一般搜尋" : "切換到萬用字元搜尋"}>
              <ToggleButton
                value="wildcard"
                selected={wildcardMode}
                onChange={() => onWildcardModeChange(!wildcardMode)}
                size="small"
                sx={{
                  flexShrink: 0,
                  px: 1,
                  minWidth: 'auto',
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark'
                    }
                  }
                }}
              >
                <FilterAltIcon fontSize="small" />
              </ToggleButton>
            </Tooltip>
          )}
          
          {/* 萬用字元搜尋說明按鈕 */}
          <WildcardSearchHelp />
          
          {/* 一鍵展開/收起按鈕 */}
          <IconButton
            size="small"
            onClick={toggleAllExpanded}
            disabled={filteredSales.length === 0}
            sx={{
              flexShrink: 0,
              color: 'text.secondary',
              '&:hover': {
                color: 'primary.main'
              }
            }}
            title={expandedSales.size === filteredSales.length && filteredSales.length > 0 ? '收起全部' : '展開全部'}
          >
            {expandedSales.size === filteredSales.length && filteredSales.length > 0 ?
              <UnfoldLessIcon fontSize="small" /> :
              <UnfoldMoreIcon fontSize="small" />
            }
          </IconButton>
        </Box>
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
              {searchTerm ? '沒有符合搜索條件的銷售記錄' : '今日無銷售記錄'}
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
                      py: 0.25,
                      px: 1.5,
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      minHeight: '48px',
                      maxHeight: isExpanded ? 'none' : '48px',
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    {/* 摺疊狀態：僅顯示基本資訊 */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        cursor: 'pointer',
                        minHeight: '44px',
                        py: 0.25,
                        gap: 0.5
                      }}
                      onClick={() => toggleExpanded(sale._id)}
                    >
                      <Box sx={{
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                        pr: 0.75
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
                              fontSize: '0.9rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              lineHeight: 1.2,
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
                              fontSize: '0.8rem',
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
                              {typeof sale.customer === 'string' ? sale.customer : sale.customer?.name ?? '一般客戶'}
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
                          {sale.items?.map((item, itemIndex) => (
                            <Typography key={itemIndex} variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem', ml: 1 }}>
                              • {typeof item.product === 'object' && item.product?.name ? item.product.name : (typeof item.product === 'string' ? item.product : '未知商品')} x {item.quantity}
                            </Typography>
                          ))}
                        </Box>

                        {/* 詳情連結固定在右下角 */}
                        <Box sx={{ mt: 1, textAlign: 'right' }}>
                          <Link
                            href={`/sales/${sale._id}`}
                            color="primary"
                            underline="hover"
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 'medium',
                              cursor: 'pointer'
                            }}
                            onClick={(e) => {
                              if (onSaleClick) {
                                e.preventDefault();
                                onSaleClick(sale);
                              }
                              // 如果沒有 onSaleClick，則使用預設的連結導航
                            }}
                          >
                            詳情
                          </Link>
                        </Box>
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

export default DailySalesPanel;