import React, { FC, useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  List,
  ListItem,
  Grid,
  Paper,
  Button
} from '@mui/material';
import { format } from 'date-fns';
import { productServiceV2 } from '@/services/productServiceV2';

// 定義項目介面
interface Item {
  _id?: string;
  dname?: string;
  name?: string;
  did?: string;
  id?: string;
  dquantity?: string | number;
  quantity?: string | number;
  dtotalCost?: string | number;
  totalCost?: string | number;
  [key: string]: any;
}

// 定義出貨單介面
interface ShippingOrder {
  _id?: string;
  soid?: string;
  items?: Item[];
  totalAmount?: number;
  notes?: string;
  [key: string]: any;
}

interface ShippingOrderDetailPanelProps {
  selectedShippingOrder: ShippingOrder | null;
  onEdit?: (id: string) => void;
}

// 定義產品詳情狀態類型
interface ProductDetailsState {
  [code: string]: any;
}

const ShippingOrderDetailPanel: FC<ShippingOrderDetailPanelProps> = ({
  selectedShippingOrder
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [productDetails, setProductDetails] = useState<ProductDetailsState>({});
  const [productDetailsLoading, setProductDetailsLoading] = useState<boolean>(false);
  
  // 獲取產品詳情
  useEffect(() => {
    const fetchProductDetails = async (): Promise<void> => {
      if (!selectedShippingOrder?.items?.length) {
        setProductDetails({});
        return;
      }

      setProductDetailsLoading(true);
      const details: ProductDetailsState = {};
      // 使用 'did' 作為產品代碼字段
      const productCodes = Array.from(new Set(selectedShippingOrder.items?.map(item => item.did || item.id).filter(Boolean) || []));

      try {
        const promises = productCodes.map(async (code) => {
          try {
            if (code) {
              const productData = await productServiceV2.getProductByCode(code);
              if (productData) {
                details[code] = productData;
              }
            }
          } catch (err) {
            console.error(`獲取產品 ${code} 詳情失敗:`, err);
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
  }, [selectedShippingOrder]);

  if (!selectedShippingOrder) {
    return (
      <Card elevation={2} sx={{ borderRadius: '0.5rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            選擇一個出貨單查看詳情
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // 格式化日期
  const formattedDate = selectedShippingOrder.sodate 
    ? format(new Date(selectedShippingOrder.sodate), 'yyyy-MM-dd')
    : '無日期';

  return (
    <Card elevation={2} sx={{ borderRadius: '0.5rem', height: '100%' }}>
      <CardContent sx={{ py: 1 }}>
        {<Typography component="div" sx={{ fontWeight: 600 }}>出貨單 {selectedShippingOrder.soid}</Typography>}
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
                      {(() => {
                        // 確保供應商數據正確顯示
                        if (selectedShippingOrder.socustomer) {
                          return selectedShippingOrder.socustomer;
                        } else if (selectedShippingOrder.sosupplier) {
                          return selectedShippingOrder.sosupplier;
                        } else if (selectedShippingOrder.supplier) {
                          // 如果 supplier 是對象，則獲取其名稱
                          const supplierObj = selectedShippingOrder.supplier;
                          if (supplierObj && typeof supplierObj === 'object') {
                            return supplierObj.name || supplierObj.supplierName || '無客戶資訊';
                          } else {
                            return String(supplierObj || '無客戶資訊');
                          }
                        } else {
                          return '無客戶資訊';
                        }
                      })()}
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
          {selectedShippingOrder.notes && (
            <ListItem sx={{ py: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>備註:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'pre-wrap' }}>{selectedShippingOrder.notes}</Typography>
            </ListItem>
          )}
        </List>

        {selectedShippingOrder.items && selectedShippingOrder.items.length > 0 && (
          <>
            <Divider sx={{ my: 1.5 }} />
            
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>商品項目</Typography>
            <List dense sx={{ py: 0 }}>
              {selectedShippingOrder.items.slice(0, isExpanded ? selectedShippingOrder.items.length : 3).map((item, index) => (
                <ListItem key={index} sx={{ py: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.dname || item.name || '未命名商品'}</Typography>
                    <Typography variant="body2">
                      ${typeof item.dtotalCost === 'number'
                        ? item.dtotalCost.toLocaleString()
                        : typeof item.totalCost === 'number'
                          ? item.totalCost.toLocaleString()
                          : parseFloat(String(item.dtotalCost || item.totalCost || '0')).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                      編號: <Typography
                              component="span"
                              variant="caption"
                              color="primary"
                              sx={{
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                '&:hover': { color: 'primary.dark' }
                              }}
                              onClick={() => {
                                const productCode = item.did || item.id;
                                if (productCode && productDetails[productCode]) {
                                  const product = productDetails[productCode];
                                  window.open(`/products${product?._id ? `/${product._id}` : `?code=${productCode}`}`, '_blank');
                                } else {
                                  window.open(`/products?code=${productCode || ''}`, '_blank');
                                }
                              }}
                            >
                              {item.did || item.id}
                            </Typography>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {typeof item.dquantity === 'number'
                        ? item.dquantity
                        : typeof item.quantity === 'number'
                          ? item.quantity
                          : parseFloat(item.dquantity || item.quantity || '0')} 件
                    </Typography>
                  </Box>
                </ListItem>
              ))}
              {selectedShippingOrder.items.length > 3 && (
                <ListItem sx={{ py: 0.5 }}>
                  <Button
                    onClick={() => setIsExpanded(!isExpanded)}
                    color="primary"
                    size="small"
                    sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
                  >
                    {isExpanded
                      ? '收起項目列表'
                      : `+${selectedShippingOrder.items.length - 3} 個更多項目...`}
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
                ${selectedShippingOrder.totalAmount ? selectedShippingOrder.totalAmount.toLocaleString() : '0'}
              </Typography>
            </Box>
          </Paper>
        </ListItem>
      </CardContent>
    </Card>
  );
};

export default ShippingOrderDetailPanel;