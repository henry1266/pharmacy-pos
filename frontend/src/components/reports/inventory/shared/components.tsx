/**
 * 庫存報表模組共用組件
 */

import React, { FC } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  TableCell,
  TableRow,
  Collapse,
  Table,
  TableHead,
  TableBody
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import {
  CustomTooltipProps,
  ChartCustomTooltipProps,
  ExpandableRowProps,
  Transaction
} from './types';
import {
  CHART_COLORS,
  TOOLTIP_STYLES,
  STATUS_COLORS
} from './constants';
import {
  formatCurrency,
  getOrderNumber,
  getTypeColor,
  getTypeBgColor,
  calculateCumulativeValues,
  sortTransactionsByOrderNumber
} from './utils';
import SingleProductProfitLossChart from '../SingleProductProfitLossChart';

// 自定義懸浮視窗組件
export const CustomTooltip: FC<CustomTooltipProps> = ({ 
  show, 
  position, 
  totalIncome, 
  totalCost, 
  formatCurrency: formatCurrencyProp 
}) => {
  if (!show) return null;
  
  return (
    <Paper
      sx={{
        ...TOOLTIP_STYLES,
        top: `${position.top + 3}px`,
        left: `${position.left}px`
      }}
    >
      <Typography variant="body2" fontWeight="500">
        總收入: {formatCurrencyProp(totalIncome)} - 總成本: {formatCurrencyProp(totalCost)}
      </Typography>
    </Paper>
  );
};

// 圖表自定義Tooltip組件
export const ChartCustomTooltip: FC<ChartCustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  
  const data = payload[0]?.payload;
  if (!data) return null;
  
  return (
    <Paper sx={{
      p: 2, 
      boxShadow: 'var(--card-shadow)',
      border: '1px solid var(--border-color)',
      bgcolor: 'var(--bg-paper)'
    }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        貨單號: {label}
      </Typography>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        商品: {data.productName} ({data.productCode})
      </Typography>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        類型: {data.type}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
        <Box
          component="span"
          sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            bgcolor: CHART_COLORS.stock,
            mr: 1
          }}
        />
        <Typography variant="body2">
          累積庫存: {data.cumulativeStock}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
        <Box
          component="span"
          sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            bgcolor: data.cumulativeProfitLoss >= 0 ? CHART_COLORS.profit : CHART_COLORS.loss,
            mr: 1
          }}
        />
        <Typography variant="body2">
          累積損益總和: {formatCurrency(data.cumulativeProfitLoss)}
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ 
        color: data.profitLoss >= 0 ? CHART_COLORS.profit : CHART_COLORS.loss,
        fontWeight: 500
      }}>
        本次交易損益: {formatCurrency(data.profitLoss)}
      </Typography>
    </Paper>
  );
};

// 狀態顯示組件
export const StatusChip: FC<{ status: string }> = ({ status }) => {
  const statusConfig = status === 'low' ? STATUS_COLORS.low : STATUS_COLORS.normal;
  
  return (
    <Box
      component="span"
      sx={{
        px: 1,
        py: 0.5,
        borderRadius: 'var(--border-radius-sm)',
        fontSize: '0.75rem',
        fontWeight: 500,
        bgcolor: statusConfig.bg,
        color: statusConfig.color,
      }}
    >
      {statusConfig.text}
    </Box>
  );
};

// 交易類型標籤組件
export const TransactionTypeChip: FC<{ type: string }> = ({ type }) => (
  <Chip
    label={type}
    size="small"
    sx={{
      bgcolor: getTypeBgColor(type),
      color: getTypeColor(type),
      fontWeight: 400,
    }}
  />
);

// 展開行組件
export const ExpandableRow: FC<ExpandableRowProps> = ({ item, formatCurrency: formatCurrencyProp }) => {
  const [open, setOpen] = React.useState<boolean>(false);

  // 計算累積庫存和損益總和
  const transactionsWithCumulativeValues = calculateCumulativeValues(item.transactions);

  // 按貨單號排序（由大到小）用於顯示
  const displayTransactions = sortTransactionsByOrderNumber(transactionsWithCumulativeValues, false);

  return (
    <>
      <TableRow
        sx={{ 
          '& > *': { borderBottom: 'unset' },
          bgcolor: open ? 'rgba(0, 0, 0, 0.04)' : 'transparent'
        }}
      >
        <TableCell>
          <IconButton
            aria-label="展開行"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell>{item.productCode}</TableCell>
        <TableCell>{item.productName}</TableCell>
        <TableCell>{item.category}</TableCell>
        <TableCell>{item.supplier ? item.supplier.name : '-'}</TableCell>
        <TableCell align="right">{item.totalQuantity}</TableCell>
        <TableCell>{item.unit}</TableCell>
        <TableCell align="right">{formatCurrencyProp(item.price)}</TableCell>
        <TableCell align="right">{formatCurrencyProp(item.totalInventoryValue)}</TableCell>
        <TableCell>
          <StatusChip status={item.status} />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={13}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div" fontSize="1rem">
                交易記錄
              </Typography>
              <Table size="small" aria-label="交易記錄">
                <TableHead>
                  <TableRow>
                    <TableCell>貨單號</TableCell>
                    <TableCell>類型</TableCell>
                    <TableCell align="right">數量</TableCell>
                    <TableCell align="right">單價</TableCell>
                    <TableCell align="right">庫存</TableCell>
                    <TableCell align="right">損益總和</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayTransactions.map((transaction) => (
                    <TableRow key={`${transaction.type}-${getOrderNumber(transaction)}-${transaction.price}`}>
                      <TableCell>
                        <Typography
                          component="span"
                          sx={{
                            color: getTypeColor(transaction.type),
                            cursor: 'pointer',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                        >
                          {getOrderNumber(transaction)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <TransactionTypeChip type={transaction.type} />
                      </TableCell>
                      <TableCell align="right" sx={{ 
                        color: getTypeColor(transaction.type),
                        fontWeight: 400
                      }}>
                        {transaction.quantity}
                      </TableCell>
                      <TableCell align="right">{formatCurrencyProp(transaction.price)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {transaction.cumulativeStock}
                      </TableCell>
                      <TableCell align="right" sx={{ 
                        color: (transaction.cumulativeProfitLoss || 0) >= 0 ? 'success.main' : 'error.main',
                        fontWeight: 'bold'
                      }}>
                        {formatCurrencyProp(transaction.cumulativeProfitLoss || 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* 添加單一品項的盈虧圖表 */}
              <SingleProductProfitLossChart 
                transactions={sortTransactionsByOrderNumber(item.transactions, true)} 
              />
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

// PropTypes 驗證
CustomTooltip.propTypes = {
  show: PropTypes.bool.isRequired,
  position: PropTypes.shape({
    top: PropTypes.number.isRequired,
    left: PropTypes.number.isRequired
  }).isRequired,
  totalIncome: PropTypes.number.isRequired,
  totalCost: PropTypes.number.isRequired,
  formatCurrency: PropTypes.func.isRequired
} as any;

ChartCustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.arrayOf(
    PropTypes.shape({
      payload: PropTypes.shape({
        productName: PropTypes.string,
        productCode: PropTypes.string,
        type: PropTypes.string,
        cumulativeStock: PropTypes.number,
        cumulativeProfitLoss: PropTypes.number,
        profitLoss: PropTypes.number
      })
    })
  ),
  label: PropTypes.string
} as any;

StatusChip.propTypes = {
  status: PropTypes.string.isRequired
};

TransactionTypeChip.propTypes = {
  type: PropTypes.string.isRequired
};

ExpandableRow.propTypes = {
  item: PropTypes.shape({
    productCode: PropTypes.string,
    productName: PropTypes.string,
    category: PropTypes.string,
    supplier: PropTypes.shape({
      name: PropTypes.string
    }),
    totalQuantity: PropTypes.number,
    unit: PropTypes.string,
    price: PropTypes.number,
    totalInventoryValue: PropTypes.number,
    status: PropTypes.string,
    transactions: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string,
        quantity: PropTypes.number,
        price: PropTypes.number,
        purchaseOrderNumber: PropTypes.string,
        shippingOrderNumber: PropTypes.string,
        saleNumber: PropTypes.string
      })
    )
  }).isRequired,
  formatCurrency: PropTypes.func.isRequired
} as any;

// 載入中組件
export const LoadingSpinner: FC = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '200px',
      flexDirection: 'column'
    }}
  >
    <Box
      sx={{
        width: 40,
        height: 40,
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 2s linear infinite',
        '@keyframes spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        }
      }}
    />
    <Typography sx={{ mt: 2, color: 'text.secondary' }}>
      載入中...
    </Typography>
  </Box>
);

// 錯誤警告組件
export const ErrorAlert: FC<{ message: string }> = ({ message }) => (
  <Box
    sx={{
      p: 2,
      mb: 2,
      bgcolor: 'error.light',
      color: 'error.contrastText',
      borderRadius: 1,
      border: '1px solid',
      borderColor: 'error.main'
    }}
  >
    <Typography variant="body2">
      ⚠️ {message}
    </Typography>
  </Box>
);

// 總計卡片組件
export const SummaryCards: FC<{
  totalInventoryQuantity: number;
  totalProfitLoss: number;
}> = ({ totalInventoryQuantity, totalProfitLoss }) => (
  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
    <Paper sx={{ flex: 1, p: 2 }}>
      <Typography variant="h6" color="primary" gutterBottom>
        總庫存數量
      </Typography>
      <Typography variant="h4" component="div">
        {totalInventoryQuantity.toLocaleString()}
      </Typography>
    </Paper>
    <Paper sx={{ flex: 1, p: 2 }}>
      <Typography variant="h6" color="secondary" gutterBottom>
        總損益
      </Typography>
      <Typography
        variant="h4"
        component="div"
        sx={{ color: totalProfitLoss >= 0 ? 'success.main' : 'error.main' }}
      >
        {formatCurrency(totalProfitLoss)}
      </Typography>
    </Paper>
  </Box>
);

// 庫存數據表格組件
export const InventoryDataTable: FC<{
  data: any[];
  page: number;
  rowsPerPage: number;
  totalCount: number;
  onPageChange: (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ data, page, rowsPerPage, totalCount, onPageChange, onRowsPerPageChange }) => (
  <Paper>
    <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="h6">庫存列表</Typography>
    </Box>
    <Box sx={{ overflow: 'auto', maxHeight: 'calc(100vh - 300px)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}></th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>產品代碼</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>產品名稱</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>類別</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>供應商</th>
            <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>數量</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>單位</th>
            <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>單價</th>
            <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>庫存價值</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>狀態</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <ExpandableRow key={item.productId} item={item} formatCurrency={formatCurrency} />
          ))}
        </tbody>
      </table>
    </Box>
    <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          顯示 {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, totalCount)} 共 {totalCount} 筆
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">每頁顯示:</Typography>
          <select
            value={rowsPerPage}
            onChange={onRowsPerPageChange as any}
            style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <button
            onClick={(e) => onPageChange(e, Math.max(0, page - 1))}
            disabled={page === 0}
            style={{
              padding: '4px 8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: page === 0 ? '#f5f5f5' : 'white',
              cursor: page === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            上一頁
          </button>
          <span style={{ padding: '0 8px' }}>
            {page + 1} / {Math.ceil(totalCount / rowsPerPage)}
          </span>
          <button
            onClick={(e) => onPageChange(e, Math.min(Math.ceil(totalCount / rowsPerPage) - 1, page + 1))}
            disabled={page >= Math.ceil(totalCount / rowsPerPage) - 1}
            style={{
              padding: '4px 8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: page >= Math.ceil(totalCount / rowsPerPage) - 1 ? '#f5f5f5' : 'white',
              cursor: page >= Math.ceil(totalCount / rowsPerPage) - 1 ? 'not-allowed' : 'pointer'
            }}
          >
            下一頁
          </button>
        </Box>
      </Box>
    </Box>
  </Paper>
);

// PropTypes 驗證
ErrorAlert.propTypes = {
  message: PropTypes.string.isRequired
};

SummaryCards.propTypes = {
  totalInventoryQuantity: PropTypes.number.isRequired,
  totalProfitLoss: PropTypes.number.isRequired
};

InventoryDataTable.propTypes = {
  data: PropTypes.array.isRequired,
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onRowsPerPageChange: PropTypes.func.isRequired
};