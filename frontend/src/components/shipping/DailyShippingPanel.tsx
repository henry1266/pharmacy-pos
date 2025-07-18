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
  LocalShipping as LocalShippingIcon,
  Business as BusinessIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  UnfoldMore as UnfoldMoreIcon,
  UnfoldLess as UnfoldLessIcon,
  FilterAlt as FilterAltIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import type { ShippingOrder } from '@pharmacy-pos/shared/types/entities';
import { shippingOrderServiceV2 } from '../../services/shippingOrderServiceV2';
import WildcardSearchHelp from '../common/WildcardSearchHelp';

interface DailyShippingPanelProps {
  shippingOrders: ShippingOrder[];
  loading: boolean;
  error: string | null;
  targetDate: string; // 目標日期，用於過濾
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onShippingOrderClick?: (shippingOrder: ShippingOrder) => void;
  // 新增萬用字元搜尋相關屬性
  wildcardMode?: boolean;
  onWildcardModeChange?: (enabled: boolean) => void;
}

// 過濾出貨單記錄：根據日期過濾
const filterShippingOrdersForDate = (shippingOrders: ShippingOrder[], targetDate: string): ShippingOrder[] => {
  const targetDateFormatted = format(new Date(targetDate), 'yyyy-MM-dd');
  
  return shippingOrders.filter(order => {
    // 檢查出貨日期是否為目標日期
    if (!order.shippingDate) return false;
    
    const shippingDate = format(new Date(order.shippingDate), 'yyyy-MM-dd');
    return shippingDate === targetDateFormatted;
  });
};

const DailyShippingPanel: React.FC<DailyShippingPanelProps> = ({
  shippingOrders,
  loading,
  error,
  targetDate,
  searchTerm,
  onSearchChange,
  onShippingOrderClick,
  wildcardMode = false,
  onWildcardModeChange
}) => {
  // 摺疊狀態管理
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const toggleExpanded = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  // 先過濾日期，再過濾搜尋條件
  const dailyShippingOrders = useMemo(() => {
    return filterShippingOrdersForDate(shippingOrders, targetDate);
  }, [shippingOrders, targetDate]);

  // 一鍵展開/收起所有記錄
  const toggleAllExpanded = () => {
    if (expandedOrders.size === filteredShippingOrders.length && filteredShippingOrders.length > 0) {
      // 如果全部都展開了，則收起全部
      setExpandedOrders(new Set());
    } else {
      // 否則展開全部
      const allIds = new Set(filteredShippingOrders.map(order => order._id));
      setExpandedOrders(allIds);
    }
  };
  
  // 過濾出貨單記錄
  const filteredShippingOrders = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return dailyShippingOrders;

    return dailyShippingOrders.filter(({ supplier, items, _id, orderNumber, shippingDate }) => {
      const searchableFields: string[] = [
        typeof supplier === 'string' ? supplier : supplier?.name ?? '',
        items.map(item => typeof item.product === 'object' && item.product?.name ? item.product.name : (typeof item.product === 'string' ? item.product : '')).join(' '),
        String(_id ?? ''),
        String(orderNumber ?? ''),
        shippingDate ? format(new Date(shippingDate), 'yyyy-MM-dd') : ''
      ];

      return searchableFields.some(field =>
        field.toLowerCase().includes(keyword)
      );
    });
  }, [dailyShippingOrders, searchTerm]);

  // 當有搜尋條件時自動展開全部
  useEffect(() => {
    if (searchTerm.trim()) {
      // 展開所有過濾後的出貨單記錄
      const allFilteredIds = new Set(filteredShippingOrders.map(order => order._id));
      setExpandedOrders(allFilteredIds);
    } else {
      // 清空搜尋時收起全部
      setExpandedOrders(new Set());
    }
  }, [searchTerm, filteredShippingOrders]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onSearchChange(e.target.value);
  };

  // 計算總金額
  const totalAmount = useMemo(() => {
    return dailyShippingOrders.reduce((sum, order) => {
      return sum + (order.items?.reduce((itemSum, item) => itemSum + (item.quantity * item.price), 0) || 0);
    }, 0);
  }, [dailyShippingOrders]);

  if (loading) {
    return (
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>載入出貨單記錄中...</Typography>
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
              <LocalShippingIcon sx={{ mr: 1, color: 'success.main' }} />
              <Typography variant="h6" component="h2" sx={{ fontSize: '1.1rem' }}>
                當日出貨
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              總計：${totalAmount.toFixed(0)}
            </Typography>
          </Box>
          <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
            {format(new Date(targetDate), 'yyyy年MM月dd日', { locale: zhTW })} - 僅顯示當天的出貨單記錄
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            fullWidth
            size="small"
            placeholder={wildcardMode ? "萬用字元搜尋 (支援 * 和 ?)..." : "搜索出貨單記錄..."}
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
            disabled={filteredShippingOrders.length === 0}
            sx={{
              flexShrink: 0,
              color: 'text.secondary',
              '&:hover': {
                color: 'primary.main'
              }
            }}
            title={expandedOrders.size === filteredShippingOrders.length && filteredShippingOrders.length > 0 ? '收起全部' : '展開全部'}
          >
            {expandedOrders.size === filteredShippingOrders.length && filteredShippingOrders.length > 0 ?
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
        {filteredShippingOrders.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="textSecondary">
              {searchTerm ? '沒有符合搜索條件的出貨單記錄' : '今日無出貨單記錄'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {filteredShippingOrders.map((order, index) => {
              const isExpanded = expandedOrders.has(order._id);
              const orderTotal = order.items?.reduce((sum, item) => sum + (item.quantity * item.price), 0) || 0;
              
              return (
                <React.Fragment key={order._id}>
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
                      onClick={() => toggleExpanded(order._id)}
                    >
                      <Box sx={{
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                        pr: 0.75
                      }}>
                        {/* 單行顯示：出貨單號、金額、供應商及狀態 */}
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
                            {order.orderNumber ?? '無單號'}
                          </Typography>
                          
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 'bold',
                              color: 'success.main',
                              fontSize: '0.8rem',
                              lineHeight: 1.2,
                              flexShrink: 0
                            }}
                          >
                            ${orderTotal.toFixed(0)}
                          </Typography>
                          
                          {/* 供應商和狀態 */}
                          <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                            <Typography
                              variant="caption"
                              color="textSecondary"
                              sx={{
                                fontSize: '0.75rem',
                                lineHeight: 1.2,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '80px'
                              }}
                            >
                              {typeof order.supplier === 'string' ? order.supplier : order.supplier?.name ?? '未知供應商'}
                            </Typography>
                            <Chip
                              label={shippingOrderServiceV2.formatOrderStatus(order.status || 'pending')}
                              color={order.status === 'completed' ? 'success' : order.status === 'cancelled' ? 'error' : 'warning'}
                              size="small"
                              sx={{ fontSize: '0.7rem', height: 18 }}
                            />
                          </Box>
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
                          toggleExpanded(order._id);
                        }}
                      >
                        {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                      </IconButton>
                    </Box>

                    {/* 展開狀態：顯示詳細資訊 */}
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                        {/* 供應商和狀態資訊同一列 */}
                        <Box sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 1,
                          gap: 1
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                            <BusinessIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="body2" color="textSecondary" sx={{
                              fontSize: '0.8rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {typeof order.supplier === 'string' ? order.supplier : order.supplier?.name ?? '未知供應商'}
                            </Typography>
                          </Box>
                          
                          {/* 訂單狀態和付款狀態放右上 */}
                          <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                            <Chip
                              label={shippingOrderServiceV2.formatOrderStatus(order.status || 'pending')}
                              color={order.status === 'completed' ? 'success' : order.status === 'cancelled' ? 'error' : 'warning'}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                            <Chip
                              label={shippingOrderServiceV2.formatPaymentStatus(order.paymentStatus || '未收')}
                              color={order.paymentStatus === '已收款' ? 'success' : order.paymentStatus === '已開立' ? 'info' : 'warning'}
                              size="small"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          </Box>
                        </Box>
                        
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 0.5, fontSize: '0.8rem' }}>
                            商品明細：
                          </Typography>
                          {order.items?.map((item, itemIndex) => (
                            <Typography key={itemIndex} variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem', ml: 1 }}>
                              • {typeof item.product === 'object' && item.product?.name ? item.product.name : (typeof item.product === 'string' ? item.product : '未知商品')} x {item.quantity} = ${(item.quantity * item.price).toFixed(0)}
                            </Typography>
                          ))}
                        </Box>

                        {/* 詳情連結固定在右下角 */}
                        <Box sx={{ mt: 1, textAlign: 'right' }}>
                          <Link
                            href={`/shipping-orders/${order._id}`}
                            color="primary"
                            underline="hover"
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 'medium',
                              cursor: 'pointer'
                            }}
                            onClick={(e) => {
                              if (onShippingOrderClick) {
                                e.preventDefault();
                                onShippingOrderClick(order);
                              }
                              // 如果沒有 onShippingOrderClick，則使用預設的連結導航
                            }}
                          >
                            詳情
                          </Link>
                        </Box>
                      </Box>
                    </Collapse>
                  </ListItem>
                  {index < filteredShippingOrders.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Box>
    </Card>
  );
};

export default DailyShippingPanel;