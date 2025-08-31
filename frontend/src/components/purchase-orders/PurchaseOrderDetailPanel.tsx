import React, { FC } from 'react';
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
  Chip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import StatusChip from '../common/StatusChip';
import PaymentStatusChip from '../common/PaymentStatusChip';
import { format } from 'date-fns';

// 定義進貨單的介面
interface PurchaseOrder {
  _id: string;
  poid: string;
  pobill: string;
  pobilldate: string;
  posupplier: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  items?: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  notes?: string;
  // 會計分錄相關欄位
  relatedTransactionGroupId?: string;
  accountingEntryType?: 'expense-asset' | 'asset-liability';
  selectedAccountIds?: string[];
  // 付款狀態相關欄位
  hasPaidAmount?: boolean;
}

interface PurchaseOrderDetailPanelProps {
  selectedPurchaseOrder: PurchaseOrder | null;
  onEdit: (id: string) => void;
  onDelete: (order: PurchaseOrder) => void;
  onViewAccountingEntry?: (transactionGroupId: string) => void;
}

const PurchaseOrderDetailPanel: FC<PurchaseOrderDetailPanelProps> = ({
  selectedPurchaseOrder,
  onEdit,
  onDelete,
  onViewAccountingEntry
}) => {
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
      <CardHeader
        avatar={<Avatar sx={{ bgcolor: 'primary.main' }}>{selectedPurchaseOrder.poid.charAt(0) || 'P'}</Avatar>}
        title={<Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>進貨單 {selectedPurchaseOrder.poid}</Typography>}
        subheader={`發票號碼: ${selectedPurchaseOrder.pobill || '無'}`}
        action={
          <Box>
            <Tooltip title="編輯">
              <IconButton color="primary" onClick={() => onEdit(selectedPurchaseOrder._id)} size="small"><EditIcon /></IconButton>
            </Tooltip>
            <Tooltip title="刪除">
              <IconButton 
                color="error" 
                onClick={() => onDelete(selectedPurchaseOrder)} 
                size="small"
                disabled={selectedPurchaseOrder.status === 'completed'}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        }
        sx={{ pb: 1 }}
      />
      <Divider />
      <CardContent sx={{ py: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>進貨單資訊</Typography>
        <List dense sx={{ py: 0 }}>
          <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>供應商:</Typography>
            <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedPurchaseOrder.posupplier}</Typography>
          </ListItem>
          <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>日期:</Typography>
            <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{formattedDate}</Typography>
          </ListItem>
          <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>總金額:</Typography>
            <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>${selectedPurchaseOrder.totalAmount.toLocaleString()}</Typography>
          </ListItem>
          <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>狀態:</Typography>
            <Box sx={{ width: '60%' }}><StatusChip status={selectedPurchaseOrder.status} /></Box>
          </ListItem>
          <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>付款狀態:</Typography>
            <Box sx={{ width: '60%' }}><PaymentStatusChip status={selectedPurchaseOrder.paymentStatus} /></Box>
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
              {selectedPurchaseOrder.items.slice(0, 3).map((item, index) => (
                <ListItem key={index} sx={{ py: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.productName}</Typography>
                    <Typography variant="body2">${item.subtotal.toLocaleString()}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {item.quantity} x ${item.unitPrice.toLocaleString()}
                  </Typography>
                </ListItem>
              ))}
              {selectedPurchaseOrder.items.length > 3 && (
                <ListItem sx={{ py: 0.5 }}>
                  <Typography variant="body2" color="primary">
                    +{selectedPurchaseOrder.items.length - 3} 個更多項目...
                  </Typography>
                </ListItem>
              )}
            </List>
          </>
        )}

        {selectedPurchaseOrder.relatedTransactionGroupId && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AccountBalanceIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>會計資訊</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Chip 
                label={selectedPurchaseOrder.accountingEntryType === 'expense-asset' ? '費用-資產' : '資產-負債'} 
                size="small" 
                color="primary" 
                variant="outlined"
                sx={{ mr: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                已建立會計分錄
              </Typography>
            </Box>
          </>
        )}

        <Divider sx={{ my: 1.5 }} />
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 1 }}>
          <Button
            onClick={() => onEdit(selectedPurchaseOrder._id)}
            variant="contained"
            color="primary"
            size="small"
            startIcon={<EditIcon />}
            sx={{ textTransform: 'none' }}
          >
            編輯進貨單
          </Button>
          {selectedPurchaseOrder.relatedTransactionGroupId && onViewAccountingEntry && (
            <Button
              onClick={() => onViewAccountingEntry(selectedPurchaseOrder.relatedTransactionGroupId!)}
              variant="outlined"
              color="secondary"
              size="small"
              startIcon={<ReceiptIcon />}
              sx={{ textTransform: 'none' }}
            >
              查看會計分錄
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default PurchaseOrderDetailPanel;