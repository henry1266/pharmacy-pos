import React, { FC, useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  List,
  ListItem,
  Button,
  Grid,
  Paper
} from '@mui/material';
import { format } from 'date-fns';
import { productServiceV2 } from '@/services/productServiceV2';

// 引入銷售記錄類型
import { Sale, SaleItem } from '../../types/list';
import { Product } from '@pharmacy-pos/shared';

// 定義產品詳情狀態類型
interface ProductDetailsState {
  [id: string]: Product;
}

interface SalesDetailPanelProps {
  selectedSale: Sale | null;
  onEdit?: (id: string) => void;
}

const SalesDetailPanel: FC<SalesDetailPanelProps> = ({
  selectedSale
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [productDetails, setProductDetails] = useState<ProductDetailsState>({});
  const [productDetailsLoading, setProductDetailsLoading] = useState<boolean>(false);
  
  // 獲取產品詳情
  useEffect(() => {
    const fetchProductDetails = async (): Promise<void> => {
      if (!selectedSale?.items?.length) {
        setProductDetails({});
        return;
      }

      setProductDetailsLoading(true);
      const details: ProductDetailsState = {};
      // 使用產品ID作為產品識別字段
      const productIds = Array.from(new Set(selectedSale.items?.map(item => item.product?._id).filter(Boolean) || []));

      try {
        const promises = productIds.map(async (id) => {
          try {
            if (id) {
              const productData = await productServiceV2.getProductById(id);
              if (productData) {
                details[id] = productData;
              }
            }
          } catch (err) {
            console.error(`獲取產品 ${id} 詳情失敗:`, err);
          }
        });

        await Promise.all(promises);
        setProductDetails(details);

      } catch (err) {
        console.error('獲取所有產品詳情過程中發生錯誤:', err);
      } finally {
        setProductDetailsLoading(false);
      }
    };

    fetchProductDetails();
  }, [selectedSale]);

  if (!selectedSale) {
    return (
      <Card elevation={2} sx={{ borderRadius: '0.5rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            選擇一個銷售記錄查看詳情
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // 格式化日期
  const formattedDate = selectedSale.date 
    ? format(new Date(selectedSale.date), 'yyyy-MM-dd')
    : '無日期';

  return (
    <Card elevation={2} sx={{ borderRadius: '0.5rem', height: '100%' }}>
      <CardContent sx={{ py: 1 }}>
        {<Typography component="div" sx={{ fontWeight: 600 }}>銷售單 {selectedSale.saleNumber}</Typography>}
        <List dense sx={{ py: 0 }}>
          {/* 客戶和日期左右排列 */}
          <ListItem sx={{ py: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    backgroundColor: 'background.paper',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: 3,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        mb: 0.5,
                        fontWeight: 400
                      }}
                    >
                      客戶
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 600,
                        color: 'text.primary'
                      }}
                    >
                      {selectedSale.customer?.name || '一般客戶'}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    backgroundColor: 'background.paper',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: 3,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        mb: 0.5,
                        fontWeight: 400
                      }}
                    >
                      日期
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 600,
                        color: 'text.primary'
                      }}
                    >
                      {formattedDate}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </ListItem>
          {selectedSale.notes && (
            <ListItem sx={{ py: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>備註:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'pre-wrap' }}>{selectedSale.notes}</Typography>
            </ListItem>
          )}
        </List>

        {selectedSale.items && selectedSale.items.length > 0 && (
          <>
            <Divider sx={{ my: 1.5 }} />
            
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>商品項目</Typography>
            <List dense sx={{ py: 0 }}>
              {selectedSale.items.slice(0, isExpanded ? selectedSale.items.length : 3).map((item, index) => (
                <ListItem key={index} sx={{ py: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.product?.name || item.name || '未命名商品'}</Typography>
                    <Typography variant="body2">
                      ${typeof item.subtotal === 'number'
                        ? item.subtotal.toLocaleString()
                        : typeof item.amount === 'number'
                          ? item.amount.toLocaleString()
                          : (item.price * item.quantity).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    {item.product?._id && (
                      <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                        產品ID: <Typography
                                  component="span"
                                  variant="caption"
                                  color="primary"
                                  sx={{
                                    textDecoration: 'underline',
                                    cursor: 'pointer',
                                    '&:hover': { color: 'primary.dark' }
                                  }}
                                  onClick={() => {
                                    window.open(`/products/${item.product?._id}`, '_blank');
                                  }}
                                >
                                  {item.product?._id}
                                </Typography>
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {typeof item.quantity === 'number'
                        ? item.quantity
                        : parseFloat(String(item.quantity || '0'))} 件
                    </Typography>
                  </Box>
                </ListItem>
              ))}
              {selectedSale.items.length > 3 && (
                <ListItem sx={{ py: 0.5 }}>
                  <Button
                    onClick={() => setIsExpanded(!isExpanded)}
                    color="primary"
                    size="small"
                    sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
                  >
                    {isExpanded
                      ? '收起項目列表'
                      : `+${selectedSale.items.length - 3} 個更多項目...`}
                  </Button>
                </ListItem>
              )}
            </List>
          </>
        )}

        <Divider sx={{ my: 1.5 }} />
        <ListItem sx={{ py: 1 }}>
          <Paper
            elevation={1}
            sx={{
              p: 1.5,
              borderRadius: 1.5,
              backgroundColor: 'background.paper',
              transition: 'all 0.2s',
              width: '100%',
              '&:hover': {
                boxShadow: 3,
                transform: 'translateY(-2px)'
              }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 400
                }}
              >
                總金額
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 600,
                  color: 'primary.main'
                }}
              >
                ${selectedSale.totalAmount ? selectedSale.totalAmount.toLocaleString() : '0'}
              </Typography>
            </Box>
          </Paper>
        </ListItem>
      </CardContent>
    </Card>
  );
};

export default SalesDetailPanel;