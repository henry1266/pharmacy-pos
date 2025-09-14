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

// 引入進貨單項目類型
import { PurchaseOrder as PurchaseOrderType } from '@/features/purchase-order/types/list';
import { Product } from '@pharmacy-pos/shared';

// 定義進貨單的介面，擴展自 PurchaseOrderType
interface PurchaseOrder extends PurchaseOrderType {
  notes?: string;
}

interface PurchaseOrderDetailPanelProps {
  selectedPurchaseOrder: PurchaseOrder | null;
  onEdit: (id: string) => void;
}

// 定義產品詳情狀態類型
interface ProductDetailsState {
  [code: string]: Product;
}

const PurchaseOrderDetailPanel: FC<PurchaseOrderDetailPanelProps> = ({
  selectedPurchaseOrder
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [productDetails, setProductDetails] = useState<ProductDetailsState>({});
  const [productDetailsLoading, setProductDetailsLoading] = useState<boolean>(false);
  
  // 獲取產品詳情
  useEffect(() => {
    const fetchProductDetails = async (): Promise<void> => {
      if (!selectedPurchaseOrder?.items?.length) {
        setProductDetails({});
        return;
      }

      setProductDetailsLoading(true);
      const details: ProductDetailsState = {};
      // 使用 'did' 作為產品代碼字段
      const productCodes = Array.from(new Set(selectedPurchaseOrder.items?.map(item => item.did).filter(Boolean) || []));

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
  }, [selectedPurchaseOrder]);
  if (!selectedPurchaseOrder) {
    return (
      <Card elevation={2} sx={{ borderRadius: '0.5rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            選擇一個進貨單查看詳情
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // 格式化日期
  const formattedDate = selectedPurchaseOrder.pobilldate 
    ? format(new Date(selectedPurchaseOrder.pobilldate), 'yyyy-MM-dd')
    : '無日期';

  return (
    <Card elevation={2} sx={{ borderRadius: '0.5rem', height: '100%' }}>
      <CardContent sx={{ py: 1 }}>
        {<Typography component="div" sx={{ fontWeight: 600 }}>進貨單 {selectedPurchaseOrder.poid}</Typography>}
        {`發票號碼: ${selectedPurchaseOrder.pobill || '無'}`}
        <List dense sx={{ py: 0 }}>
          {/* 供應商和日期左右排列 */}
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
                      供應商
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 600,
                        color: 'text.primary'
                      }}
                    >
                      {selectedPurchaseOrder.posupplier}
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
          {selectedPurchaseOrder.notes && (
            <ListItem sx={{ py: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>備註:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'pre-wrap' }}>{selectedPurchaseOrder.notes}</Typography>
            </ListItem>
          )}
        </List>

        {selectedPurchaseOrder.items && selectedPurchaseOrder.items.length > 0 && (
          <>
            <Divider sx={{ my: 1.5 }} />
            
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>商品項目</Typography>
            <List dense sx={{ py: 0 }}>
              {selectedPurchaseOrder.items.slice(0, isExpanded ? selectedPurchaseOrder.items.length : 3).map((item, index) => (
                <ListItem key={index} sx={{ py: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.dname || '未命名商品'}</Typography>
                    <Typography variant="body2">
                      ${typeof item.dtotalCost === 'number'
                        ? item.dtotalCost.toLocaleString()
                        : parseFloat(item.dtotalCost || '0').toLocaleString()}
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
                                const product = productDetails[item.did];
                                window.open(`/products${product?._id ? `/${product._id}` : `?code=${item.did}`}`, '_blank');
                              }}
                            >
                              {item.did}
                            </Typography>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {typeof item.dquantity === 'number'
                        ? item.dquantity
                        : parseFloat(item.dquantity || '0')} 件
                    </Typography>
                  </Box>
                </ListItem>
              ))}
              {selectedPurchaseOrder.items.length > 3 && (
                <ListItem sx={{ py: 0.5 }}>
                  <Button
                    onClick={() => setIsExpanded(!isExpanded)}
                    color="primary"
                    size="small"
                    sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
                  >
                    {isExpanded
                      ? '收起項目列表'
                      : `+${selectedPurchaseOrder.items.length - 3} 個更多項目...`}
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
                            ${selectedPurchaseOrder.totalAmount ? selectedPurchaseOrder.totalAmount.toLocaleString() : '0'}
                          </Typography>
                        </Box>
                      </Paper>
                    </ListItem>
      </CardContent>
    </Card>
  );
};

export default PurchaseOrderDetailPanel;