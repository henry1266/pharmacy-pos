import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
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
  CircularProgress,
  IconButton,
  Collapse,
  Link,
  Tooltip,
  Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ReceiptIcon from '@mui/icons-material/Receipt';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PercentIcon from '@mui/icons-material/Percent';
import PaidIcon from '@mui/icons-material/Paid';

// 定義 FIFO 相關的型別
interface FIFOSummary {
  totalCost: number;
  totalRevenue: number;
  totalProfit: number;
  averageProfitMargin: string;
}

interface CostPart {
  batchTime: string;
  orderNumber?: string;
  orderType?: string;
  orderId?: string | number;
  quantity: number;
  unit_price: number;
}

interface FIFOMatch {
  outTime: string;
  costParts: CostPart[];
}

interface ProfitMargin {
  orderNumber?: string;
  orderType?: string;
  orderId?: string | number;
  saleTime: string;
  totalQuantity: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: string;
}

interface FIFOData {
  success: boolean;
  error?: string;
  summary: FIFOSummary;
  profitMargins: ProfitMargin[];
  fifoMatches: FIFOMatch[];
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface FIFOProfitCalculatorProps {
  productId: string | number;
}

// 提取狀態顯示元件
interface StatusDisplayProps {
  children: React.ReactNode;
  isError?: boolean;
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({ children, isError = false }) => (
  <Box sx={{ p: 2 }}>
    <Typography color={isError ? "error" : "textPrimary"} variant="body2">
      {children}
    </Typography>
  </Box>
);

// 提取摘要項目元件
interface SummaryItemProps {
  label: string;
  value: number | string;
  isMonetary?: boolean;
  isProfit?: boolean;
  icon?: React.ReactNode;
}

const SummaryItem: React.FC<SummaryItemProps> = ({ label, value, isMonetary = true, isProfit = false, icon }) => {
  // 解決巢狀三元運算式問題
  let isPositive = true;
  if (isProfit) {
    isPositive = parseFloat(value.toString()) >= 0;
  }
  
  // 解決另一個巢狀三元運算式問題
  let textColor = 'inherit';
  if (isProfit) {
    // 使用更鮮明的顏色
    textColor = isPositive ? '#00C853' : '#FF1744';
  }
  
  return (
    <Card
      elevation={2}
      sx={{
        minWidth: 180,
        borderRadius: 2,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {icon}
          <Typography variant="subtitle1" color="text.secondary" fontWeight="medium" sx={{ ml: icon ? 1 : 0 }}>
            {label}
          </Typography>
        </Box>
        <Typography
          variant="h5"
          fontWeight="bold"
          color={textColor}
        >
          {isMonetary ? `$${parseFloat(value.toString()).toFixed(2)}` : value}
        </Typography>
      </CardContent>
    </Card>
  );
};

// 提取表頭單元格元件
interface SortableHeaderCellProps {
  label: string;
  columnKey: string;
  sortable?: boolean;
  sortConfig: SortConfig;
  onSort: (key: string) => void;
}

const SortableHeaderCell: React.FC<SortableHeaderCellProps> = ({ 
  label, 
  columnKey, 
  sortable = true, 
  sortConfig, 
  onSort 
}) => {
  const cellStyle = {
    fontWeight: 'bold',
    cursor: sortable ? 'pointer' : 'default',
    '&:hover': sortable ? { backgroundColor: 'action.selected' } : {}
  };
  
  return (
    <TableCell
      align="center"
      sx={cellStyle}
      onClick={sortable ? () => onSort(columnKey) : undefined}
    >
      {sortable ? (
        <Tooltip title="點擊排序" arrow>
          <Box>
            <span>{label}</span>
            <SortIcon sortConfig={sortConfig} columnKey={columnKey} />
          </Box>
        </Tooltip>
      ) : (
        <span>{label}</span>
      )}
    </TableCell>
  );
};

// 提取表格行元件
interface FifoTableRowProps {
  item: ProfitMargin;
  index: number;
  isExpanded: boolean;
  onToggleExpand: (index: number) => void;
  renderOrderCell: (item: ProfitMargin) => React.ReactNode;
  fifoMatches: FIFOMatch[];
}

const FifoTableRow: React.FC<FifoTableRowProps> = ({ 
  item, 
  index, 
  isExpanded, 
  onToggleExpand, 
  renderOrderCell, 
  fifoMatches 
}) => {
  // 使用更好的唯一識別符作為key
  const uniqueKey = `${item.orderNumber ?? ''}-${item.saleTime}-${index}`;
  
  // 計算單價
  const unitPrice = (item.totalRevenue / item.totalQuantity).toFixed(2);
  
  // 判斷是否為正值
  const isPositiveProfit = item.grossProfit >= 0;
  const isPositiveMargin = parseFloat(item.profitMargin) >= 0;
  
  return (
    <React.Fragment key={uniqueKey}>
      <TableRow
        sx={{
          backgroundColor: 'background.paper',
          '&:hover': { backgroundColor: 'action.hover' }
        }}
      >
        <TableCell>{renderOrderCell(item)}</TableCell>
        <TableCell align="right">{item.totalQuantity}</TableCell>
        <TableCell align="right">${unitPrice}</TableCell>
        <TableCell align="right">${item.totalRevenue.toFixed(2)}</TableCell>
        <TableCell align="right">${item.totalCost.toFixed(2)}</TableCell>
        <TableCell
          align="right"
          sx={{
            color: isPositiveProfit ? 'success.main' : 'error.main',
            fontWeight: 'medium'
          }}
        >
          ${item.grossProfit.toFixed(2)}
        </TableCell>
        <TableCell
          align="right"
          sx={{
            color: isPositiveMargin ? 'success.main' : 'error.main',
            fontWeight: 'medium'
          }}
        >
          {item.profitMargin}
        </TableCell>
        <TableCell align="center">
          <IconButton
            size="small"
            onClick={() => onToggleExpand(index)}
            title={isExpanded ? "收起明細" : "展開明細"}
          >
            {isExpanded ? <RemoveIcon fontSize="small" /> : <AddIcon fontSize="small" />}
          </IconButton>
        </TableCell>
      </TableRow>
      
      {/* FIFO明細展開區域 */}
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ maxWidth: 380, marginLeft: 28, backgroundColor: 'action.hover', p: 1, borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom component="div" sx={{ fontWeight: 'bold' }}>
                成本分佈明細
              </Typography>
              <FifoDetailTable
                fifoMatches={fifoMatches}
                saleTime={item.saleTime}
              />
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

// 提取排序邏輯的輔助函數
// 比較訂單號
const compareOrderNumbers = (a: ProfitMargin, b: ProfitMargin): number => {
  // 提取數字部分進行比較
  const aNum = a.orderNumber?.replace(/\D/g, '') || '';
  const bNum = b.orderNumber?.replace(/\D/g, '') || '';
  
  // 如果兩者都有數字部分，先比較數字
  if (aNum && bNum) {
    return parseInt(aNum) - parseInt(bNum);
  }
  
  // 如果兩者都有訂單號，按字母順序比較
  if (a.orderNumber && b.orderNumber) {
    return a.orderNumber.localeCompare(b.orderNumber);
  }
  
  // 處理一方沒有訂單號的情況
  if (a.orderNumber) return -1;
  if (b.orderNumber) return 1;
  
  // 都沒有訂單號，按時間排序
  return new Date(a.saleTime).getTime() - new Date(b.saleTime).getTime();
};

// 比較日期
const compareDates = (a: ProfitMargin, b: ProfitMargin): number => {
  return new Date(a.saleTime).getTime() - new Date(b.saleTime).getTime();
};

// 比較數值
const compareNumbers = (a: ProfitMargin, b: ProfitMargin, key: keyof ProfitMargin): number => {
  const aValue = a[key] as number;
  const bValue = b[key] as number;
  return aValue - bValue;
};

// 比較毛利率
const compareProfitMargins = (a: ProfitMargin, b: ProfitMargin): number => {
  return parseFloat(a.profitMargin) - parseFloat(b.profitMargin);
};

// 應用排序方向
const applyDirection = (comparison: number, direction: 'asc' | 'desc'): number => {
  return direction === 'asc' ? comparison : -comparison;
};

// 主排序函數
const sortFifoData = (data: ProfitMargin[], sortConfig: SortConfig): ProfitMargin[] => {
  if (!data?.length) return [];
  if (!sortConfig.key) return [...data];
  
  const sortableItems = [...data];
  
  sortableItems.sort((a, b) => {
    let comparison = 0;
    
    // 根據不同的排序鍵選擇比較方法
    switch (sortConfig.key) {
      case 'orderNumber':
        comparison = compareOrderNumbers(a, b);
        break;
      case 'saleTime':
        comparison = compareDates(a, b);
        break;
      case 'profitMargin':
        comparison = compareProfitMargins(a, b);
        break;
      case 'totalQuantity':
      case 'totalCost':
      case 'totalRevenue':
      case 'grossProfit':
        comparison = compareNumbers(a, b, sortConfig.key as keyof ProfitMargin);
        break;
      // default case is not needed as comparison is already initialized to 0
    }
    
    // 應用排序方向
    return applyDirection(comparison, sortConfig.direction);
  });
  
  return sortableItems;
};

// 提取排序圖標元件，降低主元件複雜度
interface SortIconProps {
  sortConfig: SortConfig;
  columnKey: string;
}

const SortIcon: React.FC<SortIconProps> = ({ sortConfig, columnKey }) => {
  if (sortConfig.key !== columnKey) {
    return null;
  }
  return sortConfig.direction === 'asc' 
    ? <ArrowUpwardIcon fontSize="small" /> 
    : <ArrowDownwardIcon fontSize="small" />;
};

// 提取訂單連結元件，降低主元件複雜度
interface OrderLinkProps {
  orderType?: string;
  orderId?: string | number;
  orderNumber?: string;
}

const OrderLink: React.FC<OrderLinkProps> = ({ orderType, orderId, orderNumber }) => {
  if (!orderNumber) return null;
  
  let to = '#';
  let icon: React.ReactNode = null;
  
  if (orderType === 'sale') {
    to = `/sales/${orderId}`;
    icon = <ReceiptIcon fontSize="small" sx={{ mr: 0.5 }} />;
  } else if (orderType === 'shipping') {
    to = `/shipping-orders/${orderId}`;
    icon = <LocalShippingIcon fontSize="small" sx={{ mr: 0.5 }} />;
  } else if (orderType === 'purchase') {
    to = `/purchase-orders/${orderId}`;
    icon = <ShoppingCartIcon fontSize="small" sx={{ mr: 0.5 }} />;
  }
  
  return (
    <Link
      component={RouterLink}
      to={to}
      sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
    >
      {icon}
      {orderNumber}
    </Link>
  );
};

// 提取FIFO明細表格元件，降低主元件複雜度
interface FifoDetailTableProps {
  fifoMatches: FIFOMatch[];
  saleTime: string;
}

const FifoDetailTable: React.FC<FifoDetailTableProps> = ({ fifoMatches, saleTime }) => {
  return (
    <Table size="small" aria-label="fifo-details">
      <TableHead>
        <TableRow sx={{ backgroundColor: 'action.hover' }}>
          <TableCell sx={{ fontWeight: 'bold' }}>批次時間</TableCell>
          <TableCell align="right" sx={{ fontWeight: 'bold' }}>數量</TableCell>
          <TableCell align="right" sx={{ fontWeight: 'bold' }}>單價</TableCell>                              
          <TableCell align="right" sx={{ fontWeight: 'bold' }}>小計</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {fifoMatches
          .filter(match => new Date(match.outTime).getTime() === new Date(saleTime).getTime())
          .flatMap(match => {
            // 對costParts進行排序，按照批次號從大到小排序
            const sortedCostParts = [...match.costParts].sort((a, b) => {
              // 提取數字部分進行比較
              const aNum = a.orderNumber?.replace(/\D/g, '') ?? '';
              const bNum = b.orderNumber?.replace(/\D/g, '') ?? '';
              
              if (aNum && bNum) {
                // 從大到小排序
                return parseInt(bNum) - parseInt(aNum);
              }
              
              // 如果無法比較數字，則按時間從新到舊排序
              return new Date(b.batchTime).getTime() - new Date(a.batchTime).getTime();
            });
            
            return sortedCostParts.map((part, partIndex) => {
              // 使用唯一識別符作為key，而不是索引
              const uniqueKey = `${part.batchTime}-${part.orderNumber ?? ''}-${partIndex}`;
              return (
                <TableRow key={uniqueKey}>
                  <TableCell>
                    {part.orderNumber ? (
                      <OrderLink 
                        orderType={part.orderType}
                        orderId={part.orderId}
                        orderNumber={part.orderNumber}
                      />
                    ) : (
                      new Date(part.batchTime).toLocaleDateString()
                    )}
                  </TableCell>
                  <TableCell align="right">{part.quantity}</TableCell>
                  <TableCell align="right">${part.unit_price.toFixed(2)}</TableCell>
                  <TableCell align="right">${(part.unit_price * part.quantity).toFixed(2)}</TableCell>
                </TableRow>
              );
            });
          })
        }
      </TableBody>
    </Table>
  );
};

const FIFOProfitCalculator: React.FC<FIFOProfitCalculatorProps> = ({ productId }) => {
  const [fifoData, setFifoData] = useState<FIFOData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<{ [key: number]: boolean }>({});
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'orderNumber',
    direction: 'desc'
  });
  
  // 切換展開/收起狀態
  const toggleRowExpand = (index: number): void => {
    setExpandedRows(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  // 處理排序
  const requestSort = (key: string): void => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  // 使用提取的排序函數處理數據
  const sortedData = React.useMemo(() => {
    if (!fifoData?.profitMargins) return [];
    return sortFifoData(fifoData.profitMargins, sortConfig);
  }, [fifoData, sortConfig]);

  useEffect(() => {
    const fetchFIFOData = async (): Promise<void> => {
      try {
        setLoading(true);
        const response = await axios.get<FIFOData>(`/api/fifo/product/${productId}`);
        setFifoData(response.data);
        setLoading(false);
      } catch (err: any) {
        console.error('獲取FIFO數據失敗:', err);
        setError(err.response?.data?.message ?? '獲取FIFO數據失敗');
        setLoading(false);
      }
    };

    if (productId) {
      fetchFIFOData();
    }
  }, [productId]);

  
  // 條件渲染處理
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return <StatusDisplay isError>{error}</StatusDisplay>;
  }
  
  if (!fifoData?.success) {
    return <StatusDisplay>{fifoData?.error ?? '無法計算FIFO數據'}</StatusDisplay>;
  }

  if (fifoData.profitMargins.length === 0) {
    return <StatusDisplay>無銷售記錄，無法計算毛利</StatusDisplay>;
  }

  // 提取巢狀三元運算式為獨立變數
  const renderOrderCell = (item: ProfitMargin): React.ReactNode => {
    if (item.orderNumber) {
      return (
        <OrderLink 
          orderType={item.orderType}
          orderId={item.orderId}
          orderNumber={item.orderNumber}
        />
      );
    } else {
      return new Date(item.saleTime).toLocaleDateString();
    }
  };

  // 使用外部定義的元件，不再重複定義
  
  // 主要渲染
  const summary = fifoData.summary;
  
  return (
    <Box sx={{ mt: 1, backgroundColor: 'action.hover', p: 1.5, borderRadius: 1 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        FIFO毛利計算
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <SummaryItem
              label="總成本"
              value={summary.totalCost}
              icon={<MonetizationOnIcon color="action" fontSize="medium" />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <SummaryItem
              label="總收入"
              value={summary.totalRevenue}
              icon={<PaidIcon color="primary" fontSize="medium" />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <SummaryItem
              label="總毛利"
              value={summary.totalProfit}
              isProfit={true}
              icon={
                <TrendingUpIcon
                  sx={{ color: summary.totalProfit >= 0 ? "#00C853" : "#FF1744" }}
                  fontSize="medium"
                />
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <SummaryItem
              label="平均毛利率"
              value={summary.averageProfitMargin}
              isMonetary={false}
              isProfit={true}
              icon={
                <PercentIcon
                  sx={{ color: parseFloat(summary.averageProfitMargin) >= 0 ? "#00C853" : "#FF1744" }}
                  fontSize="medium"
                />
              }
            />
          </Grid>
        </Grid>
      </Box>

      <TableContainer component={Paper} sx={{ overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'action.hover' }}>
              <SortableHeaderCell label="單號" columnKey="orderNumber" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeaderCell label="數量" columnKey="totalQuantity" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeaderCell label="單價" columnKey="unitPrice" sortable={false} sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeaderCell label="收入" columnKey="totalRevenue" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeaderCell label="成本" columnKey="totalCost" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeaderCell label="毛利" columnKey="grossProfit" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeaderCell label="毛利率" columnKey="profitMargin" sortConfig={sortConfig} onSort={requestSort} />
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>明細</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((item, index) => {
              // 使用唯一識別符作為key，而不是索引
              const uniqueId = `${item.orderNumber ?? ''}-${item.saleTime}-${item.totalQuantity}`;
              return (
                <FifoTableRow
                  key={uniqueId}
                  item={item}
                  index={index}
                  isExpanded={expandedRows[index] ?? false}
                  onToggleExpand={toggleRowExpand}
                  renderOrderCell={renderOrderCell}
                  fifoMatches={fifoData.fifoMatches}
                />
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default FIFOProfitCalculator;