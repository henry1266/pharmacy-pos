import React, { useState, useEffect, FC, ReactNode } from 'react';
import axios from 'axios';
import { ApiResponse } from '../types/api';
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
  Chip,
  Divider,
  CircularProgress,
  Stack,
  IconButton,
  ChipProps
} from '@mui/material';
import {
  MonetizationOn as MonetizationOnIcon,
  TrendingUp as TrendingUpIcon,
  ReceiptLong as ReceiptLongIcon,
  Percent as PercentIcon,
  Info as InfoIcon,
  Person as PersonIcon,
  CalendarToday as CalendarTodayIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  ListAlt as ListAltIcon,
  Visibility, // Added for profit toggle
  VisibilityOff // Added for profit toggle
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';

import ProductCodeLink from '../components/common/ProductCodeLink';
import DetailLayout from '../components/DetailLayout';
import GrossProfitCell from '../components/common/GrossProfitCell'; // Added import
import CollapsibleAmountInfo from '../components/common/CollapsibleAmountInfo';

// 定義類型
interface Product {
  _id: string;
  name: string;
  code?: string;
}

interface SaleItem {
  product?: Product;
  name?: string;
  price: number;
  quantity: number;
}

interface Customer {
  _id: string;
  name: string;
}

interface Sale {
  _id: string;
  saleNumber?: string;
  date?: string | Date;
  customer?: Customer;
  items: SaleItem[];
  totalAmount: number;
  discount?: number;
  tax?: number;
  paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'mobile_payment' | 'other';
  paymentStatus: 'paid' | 'pending' | 'partial' | 'cancelled';
  note?: string;
}

// 定義與 GrossProfitCell 組件兼容的 FifoProfit 類型
interface FifoProfit {
  totalCost: number;
  totalProfit: number;
  profitMargin: string;
  [key: string]: any; // 允許其他屬性
}

interface FifoItem {
  product?: Product;
  fifoProfit?: FifoProfit;
}

interface FifoData {
  summary: {
    totalCost: number;
    totalProfit: number;
    totalProfitMargin: string;
  };
  items?: FifoItem[];
}

interface PaymentStatusInfo {
  text: string;
  color: ChipProps['color'];
  icon: ReactNode;
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
  return methodMap[method] || method;
};

const getPaymentStatusInfo = (status: string): PaymentStatusInfo => {
  const statusMap: Record<string, PaymentStatusInfo> = {
    'paid': { text: '已付款', color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
    'pending': { text: '待付款', color: 'warning', icon: <PendingIcon fontSize="small" /> },
    'partial': { text: '部分付款', color: 'info', icon: <AccountBalanceWalletIcon fontSize="small" /> },
    'cancelled': { text: '已取消', color: 'error', icon: <CancelIcon fontSize="small" /> }
  };
  return statusMap[status] || { text: status, color: 'default', icon: <InfoIcon fontSize="small" /> };
};


// 定義明細項目類型，與 CollapsibleAmountInfo 兼容
interface CollapsibleDetail {
  label: string;
  value: any;
  icon?: React.ReactElement;
  color?: string;
  fontWeight?: string;
  condition: boolean;
  valueFormatter?: (val: any) => string;
  customContent?: React.ReactNode;
}

// 獲取可收合的明細資料
const getCollapsibleDetails = (sale: Sale, fifoLoading: boolean, fifoError: string | null, fifoData: FifoData | null): CollapsibleDetail[] => {
  const details: CollapsibleDetail[] = [];
  
  // 小計
  details.push({
    label: '小計',
    value: (sale.totalAmount + (sale.discount || 0) - (sale.tax || 0)),
    icon: <ReceiptLongIcon color="action" fontSize="small" />,
    condition: true,
    valueFormatter: val => val.toFixed(2)
  });

  // 折扣
  if (sale.discount && sale.discount > 0) {
    details.push({
      label: '折扣',
      value: -sale.discount,
      icon: <PercentIcon color="secondary" fontSize="small" />,
      color: 'secondary.main',
      condition: true,
      valueFormatter: val => val.toFixed(2)
    });
  }

  // FIFO 相關資料
  if (!fifoLoading && fifoData?.summary) {
    details.push({
      label: '總成本',
      value: fifoData.summary.totalCost,
      icon: <MonetizationOnIcon color="action" fontSize="small" />,
      condition: true,
      valueFormatter: val => typeof val === 'number' ? val.toFixed(2) : 'N/A'
    });
    details.push({
      label: '總毛利',
      value: fifoData.summary.totalProfit,
      icon: <TrendingUpIcon color={fifoData.summary.totalProfit >= 0 ? 'success' : 'error'} fontSize="small" />,
      color: fifoData.summary.totalProfit >= 0 ? 'success.main' : 'error.main',
      fontWeight: 'bold',
      condition: true,
      valueFormatter: val => typeof val === 'number' ? val.toFixed(2) : 'N/A'
    });
    details.push({
      label: '毛利率',
      value: fifoData.summary.totalProfitMargin,
      icon: <PercentIcon color={parseFloat(fifoData.summary.totalProfitMargin) >= 0 ? 'success' : 'error'} fontSize="small" />,
      color: parseFloat(fifoData.summary.totalProfitMargin) >= 0 ? 'success.main' : 'error.main',
      fontWeight: 'bold',
      condition: true
    });
  } else if (fifoLoading) {
    details.push({
      label: '毛利資訊',
      value: '',
      customContent: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CircularProgress size={16} sx={{ mr: 1 }} />
          <Typography variant="body2" color="text.secondary">計算中...</Typography>
        </Box>
      ),
      condition: true
    });
  } else if (fifoError) {
    details.push({
      label: '毛利資訊',
      value: '',
      customContent: <Typography variant="body2" color="error">{fifoError}</Typography>,
      condition: true
    });
  }

  return details;
};

// 銷售項目行元件
interface SalesItemRowProps {
  item: SaleItem;
  fifoLoading: boolean;
  fifoData: FifoData | null;
  showSalesProfitColumns: boolean;
}

const SalesItemRow: FC<SalesItemRowProps> = ({ item, fifoLoading, fifoData, showSalesProfitColumns }) => {
  const fifoItem = !fifoLoading && fifoData?.items?.find(fi => fi.product?._id === item.product?._id);
  
  return (
    <TableRow hover>
      <TableCell>
        <ProductCodeLink product={item.product} />
      </TableCell>
      <TableCell>{item.product?.name ?? item.name ?? 'N/A'}</TableCell>
      <TableCell align="right">{item.price.toFixed(2)}</TableCell>
      <TableCell align="right">{item.quantity}</TableCell>
      <TableCell align="right">{(item.price * item.quantity).toFixed(2)}</TableCell>
      {!fifoLoading && fifoData?.items && showSalesProfitColumns && (
        <>
          <TableCell align="right">{fifoItem?.fifoProfit?.totalCost.toFixed(2) ?? 'N/A'}</TableCell>
          {/* 型別斷言在此是必要的，因為可能存在兩個不同的 FifoProfit 介面定義 */}
          <GrossProfitCell fifoProfit={fifoItem?.fifoProfit as Record<string, any>} />
          <TableCell align="right" sx={{ color: fifoItem?.fifoProfit && parseFloat(fifoItem.fifoProfit.profitMargin) >= 0 ? 'success.main' : 'error.main' }}>
            {fifoItem?.fifoProfit ? fifoItem.fifoProfit.profitMargin : 'N/A'}
          </TableCell>
        </>
      )}
    </TableRow>
  );
};

// 銷售項目表格元件
interface SalesItemsTableProps {
  sale: Sale;
  fifoLoading: boolean;
  fifoData: FifoData | null;
  showSalesProfitColumns: boolean;
}

const SalesItemsTable: FC<SalesItemsTableProps> = ({ sale, fifoLoading, fifoData, showSalesProfitColumns }) => (
  <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>編號</TableCell>
          <TableCell>名稱</TableCell>
          <TableCell align="right">單價</TableCell>
          <TableCell align="right">數量</TableCell>
          <TableCell align="right">小計</TableCell>
          {!fifoLoading && fifoData?.items && showSalesProfitColumns && (
            <>
              <TableCell align="right">成本</TableCell>
              <TableCell align="right">毛利</TableCell>
              <TableCell align="right">毛利率</TableCell>
            </>
          )}
        </TableRow>
      </TableHead>
      <TableBody>
        {sale.items.map((item, index) => (
          <SalesItemRow 
            key={item.product?._id ?? `item-${index}`}
            item={item} 
            fifoLoading={fifoLoading} 
            fifoData={fifoData} 
            showSalesProfitColumns={showSalesProfitColumns} 
          />
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

// 基本信息側邊欄元件
interface SaleInfoSidebarProps {
  sale: Sale;
}

const SaleInfoSidebar: FC<SaleInfoSidebarProps> = ({ sale }) => (
  <Card variant="outlined">
    <CardContent>
      <Typography variant="h6" gutterBottom><InfoIcon sx={{ verticalAlign: 'middle', mr: 1 }}/>基本信息</Typography>
      <Divider sx={{ mb: 2 }} />
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} alignItems="center">
          <CalendarTodayIcon fontSize="small" color="action"/>
          <Typography variant="body2">銷售單號: {sale.saleNumber ?? 'N/A'}</Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <PersonIcon fontSize="small" color="action"/>
          <Typography variant="body2">客戶: {sale.customer?.name ?? '一般客戶'}</Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <PaymentIcon fontSize="small" color="action"/>
          <Typography variant="body2">付款方式: {getPaymentMethodText(sale.paymentMethod)}</Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          {getPaymentStatusInfo(sale.paymentStatus).icon}
          <Typography variant="body2">付款狀態: <Chip label={getPaymentStatusInfo(sale.paymentStatus).text} color={getPaymentStatusInfo(sale.paymentStatus).color} size="small" /></Typography>
        </Stack>
        <Typography variant="subtitle2" color="text.secondary" sx={{ pt: 1 }}>備註:</Typography>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{sale.note ?? '無'}</Typography>
      </Stack>
    </CardContent>
  </Card>
);

// 主要內容元件
interface MainContentProps {
  sale: Sale | null;
  fifoLoading: boolean;
  fifoError: string | null;
  fifoData: FifoData | null;
  showSalesProfitColumns: boolean;
  handleToggleSalesProfitColumns: () => void;
}

const MainContent: FC<MainContentProps> = ({
  sale,
  fifoLoading,
  fifoError,
  fifoData,
  showSalesProfitColumns,
  handleToggleSalesProfitColumns
}) => (
  <Stack spacing={3}>
    {sale && (
      <CollapsibleAmountInfo
        title="金額信息"
        titleIcon={<AccountBalanceWalletIcon />}
        mainAmountLabel="總金額"
        mainAmountValue={sale.totalAmount ?? 0}
        mainAmountIcon={<ReceiptLongIcon />}
        collapsibleDetails={getCollapsibleDetails(sale, fifoLoading, fifoError, fifoData)}
        initialOpenState={true}
        isLoading={false}
      />
    )}

    {sale?.items && (
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <ListAltIcon sx={{ verticalAlign: 'middle', mr: 1 }}/>銷售項目
            </Typography>
            {!fifoLoading && fifoData?.items && (
              <IconButton onClick={handleToggleSalesProfitColumns} size="small" aria-label={showSalesProfitColumns ? "隱藏毛利欄位" : "顯示毛利欄位"}>
                {showSalesProfitColumns ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            )}
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <SalesItemsTable
            sale={sale}
            fifoLoading={fifoLoading}
            fifoData={fifoData}
            showSalesProfitColumns={showSalesProfitColumns}
          />
        </CardContent>
      </Card>
    )}
  </Stack>
);

// 主元件
const SalesDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const [sale, setSale] = useState<Sale | null>(null);
  const [fifoData, setFifoData] = useState<FifoData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [fifoLoading, setFifoLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fifoError, setFifoError] = useState<string | null>(null);
  const [showSalesProfitColumns, setShowSalesProfitColumns] = useState<boolean>(true);

  // 獲取銷售數據
  const fetchSaleData = async (): Promise<void> => {
    try {
      setLoading(true);
      
      const response = await axios.get<ApiResponse<Sale>>(`/api/sales/${id}`);
      
      // 檢查 API 回應格式
      if (response.data && response.data.success && response.data.data) {
        // 驗證銷售資料的完整性
        const saleData = response.data.data;
        
        if (!saleData._id) {
          throw new Error('銷售資料格式不正確：缺少 ID');
        }
        
        if (!saleData.items || !Array.isArray(saleData.items)) {
          throw new Error('銷售資料格式不正確：缺少或無效的項目列表');
        }
        
        // 檢查每個銷售項目的商品資料
        const validatedItems = saleData.items.map((item, index) => {
          if (!item.product && !item.name) {
            console.warn(`銷售項目 ${index + 1} 缺少商品資訊`);
            return {
              ...item,
              name: item.name || '未知商品'
            };
          }
          
          // 確保商品資料完整性
          if (item.product && typeof item.product === 'object') {
            return {
              ...item,
              product: {
                _id: item.product._id || '',
                name: item.product.name || '未知商品',
                code: item.product.code || ''
              }
            };
          }
          
          return item;
        });
        
        setSale({
          ...saleData,
          items: validatedItems
        });
        setError(null);
      } else {
        throw new Error('API 回應格式不正確');
      }
    } catch (err: any) {
      console.error('獲取銷售數據失敗:', err);
      let errorMsg = '獲取銷售數據失敗';
      
      if (err.response?.data?.message) {
        errorMsg += ': ' + err.response.data.message;
      } else if (err.message) {
        errorMsg += ': ' + err.message;
      }
      
      setError(errorMsg);
      setSale(null);
    } finally {
      setLoading(false);
    }
  };

  // 獲取FIFO數據
  const fetchFifoData = async (): Promise<void> => {
    try {
      setFifoLoading(true);
      
      const response = await axios.get<ApiResponse<FifoData> | FifoData>(`/api/fifo/sale/${id}`);
      
      // 檢查是否為包裝的 API 回應格式
      if (response.data && 'success' in response.data && 'data' in response.data) {
        const apiResponse = response.data as ApiResponse<FifoData>;
        if (apiResponse.success && apiResponse.data) {
          setFifoData(apiResponse.data);
        } else {
          throw new Error('FIFO API 回應格式不正確');
        }
      } else {
        // 直接的 FifoData 格式
        setFifoData(response.data as FifoData);
      }
      
      setFifoError(null);
    } catch (err: any) {
      console.error('獲取FIFO毛利數據失敗:', err);
      let errorMsg = '獲取FIFO毛利數據失敗';
      
      if (err.response?.data?.message) {
        errorMsg += ': ' + err.response.data.message;
      } else if (err.message) {
        errorMsg += ': ' + err.message;
      }
      
      setFifoError(errorMsg);
      setFifoData(null);
    } finally {
      setFifoLoading(false);
    }
  };

  // 初始化數據
  useEffect(() => {
    if (id) {
      fetchSaleData();
      fetchFifoData();
    }
  }, [id]);

  // 切換銷售項目毛利欄位顯示
  const handleToggleSalesProfitColumns = (): void => {
    setShowSalesProfitColumns(!showSalesProfitColumns);
  };

  // 渲染主要內容
  const mainContent = (
    <MainContent
      sale={sale}
      fifoLoading={fifoLoading}
      fifoError={fifoError}
      fifoData={fifoData}
      showSalesProfitColumns={showSalesProfitColumns}
      handleToggleSalesProfitColumns={handleToggleSalesProfitColumns}
    />
  );

  // 渲染側邊欄內容
  const sidebarContent = sale ? <SaleInfoSidebar sale={sale} /> : null;

  // 使用DetailLayout渲染頁面
  return (
    <DetailLayout
      pageTitle="銷售單詳情"
      recordIdentifier={sale?.saleNumber}
      listPageUrl="/sales"
      editPageUrl={`/sales/edit/${id}`}
      printPageUrl={`/sales/print/${id}`}
      mainContent={mainContent}
      sidebarContent={sidebarContent}
      isLoading={loading}
      errorContent={error ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error" variant="h6">{error}</Typography>
        </Box>
      ) : null}
    />
  );
};

export default SalesDetailPage;