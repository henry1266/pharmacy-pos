import React, { FC } from 'react';
import PropTypes from 'prop-types'; // 引入 PropTypes 進行 props 驗證
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  CircularProgress
} from '@mui/material';

// 定義進貨單項目的介面
interface PurchaseOrderItem {
  did: string;
  dname: string;
  dquantity: string | number;
  dtotalCost: string | number;
}

// 定義進貨單的介面
interface PurchaseOrder {
  items?: PurchaseOrderItem[];
  totalAmount?: number;
}

// 定義組件 props 的介面
interface PurchaseOrderPreviewProps {
  purchaseOrder?: PurchaseOrder;
  loading?: boolean;
  error?: string;
}

/**
 * 進貨單預覽組件
 * @param {PurchaseOrderPreviewProps} props - 組件屬性
 * @returns {React.ReactElement} 進貨單預覽組件
 */
const PurchaseOrderPreview: FC<PurchaseOrderPreviewProps> = ({ purchaseOrder, loading, error }) => {
  // 移除未使用的 getStatusChip 變數
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error" variant="body2">
          載入進貨單時發生錯誤
        </Typography>
      </Box>
    );
  }
  
  if (!purchaseOrder) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2">
          找不到進貨單
        </Typography>
      </Box>
    );
  }
  
  return (
    <Card sx={{ width: 550, maxHeight: 600, overflow: 'auto' }}>
      <CardContent sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          進貨單詳情
        </Typography>

        <TableContainer component={Paper} variant="outlined" sx={{ mb: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>藥品代碼</TableCell>
                <TableCell>藥品名稱</TableCell>
                <TableCell align="right">數量</TableCell>
                <TableCell align="right">總成本</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchaseOrder?.items?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">沒有藥品項目</TableCell>
                </TableRow>
              ) : (
                purchaseOrder?.items?.slice(0, 5).map((item) => (
                  <TableRow key={`${item.did}-${item.dname}`}>
                    <TableCell>{item.did}</TableCell>
                    <TableCell>{item.dname}</TableCell>
                    <TableCell align="right">{item.dquantity}</TableCell>
                    <TableCell align="right">{Number(item.dtotalCost).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
              {purchaseOrder?.items && purchaseOrder.items.length > 5 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography variant="body2" color="text.secondary">
                      還有 {purchaseOrder.items.length - 5} 個項目...
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell colSpan={3} align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    總計:
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    {purchaseOrder.totalAmount?.toLocaleString() ??
                     (purchaseOrder?.items?.reduce((sum, item) => sum + Number(item.dtotalCost), 0).toLocaleString())}
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

// 添加 PurchaseOrderPreview 的 PropTypes 驗證
PurchaseOrderPreview.propTypes = {
  purchaseOrder: PropTypes.shape({
    items: PropTypes.arrayOf(
      PropTypes.shape({
        did: PropTypes.string,
        dname: PropTypes.string,
        dquantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        dtotalCost: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      })
    ),
    totalAmount: PropTypes.number
  }),
  loading: PropTypes.bool,
  error: PropTypes.string
} as any; // 使用 any 類型來避免 TypeScript 錯誤

export default PurchaseOrderPreview;