import React, { FC, useState } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Divider,
  List,
  ListItem,
  Avatar,
  IconButton,
  Tooltip,
  Button,
  Chip,
  Grid,
  Paper
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon,
  Link as LinkIcon,
  Lock as LockIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import StatusChip from '../common/StatusChip';
import PaymentStatusChip from '../common/PaymentStatusChip';
import { format } from 'date-fns';

// 引入進貨單項目類型
import { PurchaseOrder as PurchaseOrderType, PurchaseOrderItem } from '@/modules/purchase-order/types/list';

// 定義進貨單的介面，擴展自 PurchaseOrderType
interface PurchaseOrder extends PurchaseOrderType {
  notes?: string;
}

interface PurchaseOrderDetailPanelProps {
  selectedPurchaseOrder: PurchaseOrder | null;
  onEdit: (id: string) => void;
}

const PurchaseOrderDetailPanel: FC<PurchaseOrderDetailPanelProps> = ({
  selectedPurchaseOrder
}) => {
  // 添加展開/摺疊狀態
  const [expanded, setExpanded] = useState(false);

  // 切換展開/摺疊狀態
  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };
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
          <ListItem sx={{ py: 0.5 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>供應商:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedPurchaseOrder.posupplier}</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>日期:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{formattedDate}</Typography>
                </Box>
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
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>商品項目</Typography>
              {selectedPurchaseOrder.items.length > 3 && (
                <Button
                  size="small"
                  color="primary"
                  onClick={handleToggleExpand}
                  endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  sx={{
                    textTransform: 'none',
                    minWidth: 'auto',
                    py: 0.5
                  }}
                >
                  {expanded ? '收起' : '展開全部'}
                </Button>
              )}
            </Box>
            
            <Paper
              variant="outlined"
              sx={{
                borderRadius: '0.5rem',
                overflow: 'hidden',
                transition: 'all 0.3s ease'
              }}
            >
              <List dense sx={{ py: 0 }}>
                {/* 根據展開狀態決定顯示的項目數量 */}
                {(expanded
                  ? selectedPurchaseOrder.items!
                  : selectedPurchaseOrder.items!.slice(0, 3)
                ).map((item, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      py: 0.5,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      borderBottom: index < (expanded ? selectedPurchaseOrder.items!.length - 1 : Math.min(selectedPurchaseOrder.items!.length, 3) - 1)
                        ? '1px solid rgba(0, 0, 0, 0.08)'
                        : 'none',
                      bgcolor: index % 2 === 0 ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.dname || '未命名商品'}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'primary.main' }}>
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
                                onClick={() => window.open(`/products?code=${item.did}`, '_blank')}
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
                
                {/* 未展開且項目數量超過3個時顯示展開按鈕 */}
                {!expanded && selectedPurchaseOrder.items.length > 3 && (
                  <ListItem
                    button
                    onClick={handleToggleExpand}
                    sx={{
                      py: 0.5,
                      justifyContent: 'center',
                      bgcolor: 'rgba(0, 0, 0, 0.03)',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.06)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', color: 'primary.main' }}>
                      <Typography variant="body2" sx={{ mr: 0.5 }}>
                        顯示全部 {selectedPurchaseOrder.items!.length} 個項目
                      </Typography>
                      <ExpandMoreIcon fontSize="small" />
                    </Box>
                  </ListItem>
                )}
              </List>
            </Paper>
          </>
        )}

          <Divider sx={{ my: 1.5 }} />
          <Paper
            variant="outlined"
            sx={{
              borderRadius: '0.5rem',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              bgcolor: 'rgba(0, 0, 0, 0.02)'
            }}
          >
            <ListItem
              sx={{
                py: 1,
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(0, 0, 0, 0.08)'
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.secondary' }}>總金額</Typography>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 700,
                  color: 'primary.main',
                  fontSize: '1.1rem'
                }}
              >
                ${selectedPurchaseOrder.totalAmount ? selectedPurchaseOrder.totalAmount.toLocaleString() : '0'}
              </Typography>
            </ListItem>
            
            {/* 可以在這裡添加更多摘要信息，如稅額、折扣等 */}
          </Paper>
      </CardContent>
    </Card>
  );
};

export default PurchaseOrderDetailPanel;