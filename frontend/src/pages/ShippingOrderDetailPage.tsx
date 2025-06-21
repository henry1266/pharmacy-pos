import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../hooks/redux';
import axios from 'axios'; // Added import
import { downloadShippingOrderPdf } from '../services/pdf/shippingOrderPdf';
import {
  Chip,
  Typography,
  Card,
  CardContent,
  Divider,
  Stack,
  CircularProgress, // Added for fifoLoading in CollapsibleAmountInfo
  Box, // Added for fifoLoading in CollapsibleAmountInfo
  Button
} from '@mui/material';
import {
  CalendarToday as CalendarTodayIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Info as InfoIcon,
  CurrencyExchange as CurrencyExchangeIcon,
  MonetizationOn as MonetizationOnIcon,
  TrendingUp as TrendingUpIcon,
  Percent as PercentIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  ReceiptLong as ReceiptLongIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { format, isValid } from 'date-fns'; // Import isValid
import { zhTW } from 'date-fns/locale';

import { fetchShippingOrder } from '../redux/actions';
import DetailLayout from '../components/DetailLayout';
import ProductItemsTable from '../components/common/ProductItemsTable';
import CollapsibleAmountInfo from '../components/common/CollapsibleAmountInfo';
import { getProductByCode } from '../services/productService';

// 定義出貨單項目類型
interface ShippingOrderItem {
  did?: string;
  dname?: string;
  dquantity?: number;
  dprice?: number;
  dtotalCost?: number;
  totalPrice?: number;
  profit?: number;
  profitMargin?: number;
  [key: string]: any; // 允許其他屬性
}

// 定義出貨單類型
interface ShippingOrder {
  soid?: string;
  status?: string;
  paymentStatus?: string;
  totalAmount?: number;
  discountAmount?: number;
  customer?: {
    name?: string;
    [key: string]: any;
  } | string;
  sosupplier?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  items?: ShippingOrderItem[];
  [key: string]: any; // 允許其他屬性
}

// 定義 FIFO 數據類型
interface FifoData {
  items?: Array<{
    product?: {
      code?: string;
      [key: string]: any;
    };
    fifoProfit?: {
      grossProfit?: number;
      profitMargin?: number;
      [key: string]: any;
    };
    [key: string]: any;
  }>;
  summary?: {
    totalCost?: number;
    totalProfit?: number;
    totalProfitMargin?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

// 定義產品詳情類型
interface ProductDetails {
  [code: string]: any;
}

// 定義 Redux 狀態類型
interface ShippingOrdersState {
  currentShippingOrder?: ShippingOrder;
  loading?: boolean;
  error?: string;
  [key: string]: any;
}

// 定義 RootState 類型，使其更通用
interface RootState {
  shippingOrders: ShippingOrdersState;
  auth?: any;
  products?: any;
  suppliers?: any;
  customers?: any;
  [key: string]: any;
}

// 注意：我們使用默認的 useDispatch 類型，不需要顯式定義 AppThunk 類型

// 定義 RouteParams 類型，使其符合 Record<string, string>
interface RouteParams {
  id: string;
  [key: string]: string; // 添加字符串索引簽名
}

// DetailLayout 組件的 Props 類型定義
// 這個接口用於文檔目的，幫助理解 DetailLayout 組件期望的 props
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface DetailLayoutProps {
  pageTitle: string;
  recordIdentifier?: string | number;
  listPageUrl: string;
  editPageUrl?: string;
  printPageUrl?: string;
  additionalActions?: React.ReactNode[];
  mainContent: React.ReactNode;
  sidebarContent: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  errorContent?: React.ReactNode;
}

// StatusChip 組件的 Props 類型定義
interface StatusChipProps {
    status?: string;
}

const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
    let color: 'default' | 'success' | 'warning' | 'error' = 'default';
    let label = status ?? '未知';
    if (status === 'shipped') { color = 'success'; label = '已出貨'; }
    if (status === 'pending') { color = 'warning'; label = '待處理'; }
    if (status === 'cancelled') { color = 'error'; label = '已取消'; }
    return <Chip size="small" label={label} color={color} />;
};

// PaymentStatusChip 組件的 Props 類型定義
interface PaymentStatusChipProps {
    status?: string;
}

const PaymentStatusChip: React.FC<PaymentStatusChipProps> = ({ status }) => {
    let color: 'default' | 'success' | 'warning' | 'error' = 'default';
    let label = status ?? '未指定';
    if (status === 'paid') { color = 'success'; label = '已付款'; }
    if (status === 'unpaid') { color = 'warning'; label = '未付款'; }
    return <Chip size="small" label={label} color={color} />;
};

// ErrorContent 組件的 Props 類型定義
// 這些組件目前未使用，但保留作為可能的未來使用或文檔目的
interface ErrorContentProps {
  orderError?: string;
  productDetailsError?: string;
  fifoError?: string;
  fifoData?: any; // 可以進一步定義 fifoData 的具體類型
}

// Error content component extracted from parent component
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ErrorContent: React.FC<ErrorContentProps> = ({ orderError, productDetailsError, fifoError, fifoData }) => {
  if (orderError) {
    return <Typography color="error" variant="h6">載入出貨單時發生錯誤: {orderError}</Typography>;
  }
  if (productDetailsError) {
    return <Typography color="error">{productDetailsError}</Typography>;
  }
  if (fifoError && !fifoData) {
    return <Typography color="error">{fifoError}</Typography>;
  }
  return null;
};

// NoDataContent 組件的 Props 類型定義
interface NoDataContentProps {
  orderLoading?: boolean;
  currentShippingOrder?: any; // 可以進一步定義 currentShippingOrder 的具體類型
  orderError?: string;
}

// No data content component extracted from parent component
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const NoDataContent: React.FC<NoDataContentProps> = ({ orderLoading, currentShippingOrder, orderError }) => {
  if (!orderLoading && !currentShippingOrder && !orderError) {
    return <Typography variant="h6">找不到出貨單數據</Typography>;
  }
  return null;
};

const ShippingOrderDetailPage: React.FC = () => {
  const { id } = useParams<RouteParams>();
  // 使用更通用的 dispatch 類型
  const dispatch = useAppDispatch();

  const { currentShippingOrder, loading: orderLoading, error: orderError } = useSelector(
    (state: RootState) => state.shippingOrders
  );

  // 添加除錯日誌
  console.log('currentShippingOrder:', currentShippingOrder);

  const [productDetails, setProductDetails] = useState<ProductDetails>({});
  const [productDetailsLoading, setProductDetailsLoading] = useState<boolean>(false);
  const [productDetailsError, setProductDetailsError] = useState<string | null>(null);

  const [fifoData, setFifoData] = useState<FifoData | null>(null);
  const [fifoLoading, setFifoLoading] = useState<boolean>(true);
  const [fifoError, setFifoError] = useState<string | null>(null);

  const fetchFifoData = useCallback(async (): Promise<void> => {
    if (!id) return;
    try {
      setFifoLoading(true);
      // Assuming an API endpoint /api/fifo/shipping-order/:id for shipping order FIFO data
      const response = await axios.get(`/api/fifo/shipping-order/${id}`);
      setFifoData(response.data);
      setFifoError(null);
    } catch (err) {
      console.error('獲取FIFO毛利數據失敗 (出貨單):', err);
      const errorMsg = '獲取FIFO毛利數據失敗: ' + (err.response?.data?.msg ?? err.message);
      setFifoError(errorMsg);
    } finally {
      setFifoLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      dispatch(fetchShippingOrder(id));
      fetchFifoData();
    }
  }, [dispatch, id, fetchFifoData]);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!currentShippingOrder?.items?.length) {
        setProductDetails({});
        return;
      }
      setProductDetailsLoading(true);
      setProductDetailsError(null);
      const details = {};
      // 避免使用 Set 的展開運算符，改用 Array.from
      const productCodesSet = new Set(currentShippingOrder.items.map(item => item.did).filter(Boolean));
      const productCodes = Array.from(productCodesSet);
      try {
        const promises = productCodes.map(async (code) => {
          try {
            const productData = await getProductByCode(code);
            if (productData) {
              details[code] = productData;
            }
          } catch (err) {
            console.error(`獲取產品 ${code} 詳情失敗:`, err);
          }
        });
        await Promise.all(promises);
        setProductDetails(details);
      } catch (err) {
        console.error('獲取所有產品詳情過程中發生錯誤:', err);
        setProductDetailsError('無法載入部分或所有產品的詳細資料。');
      } finally {
        setProductDetailsLoading(false);
      }
    };
    fetchProductDetails();
  }, [currentShippingOrder]);

  const processedItems = useMemo<ShippingOrderItem[]>(() => {
    if (!currentShippingOrder?.items) {
      return [];
    }
    
    // 添加除錯日誌
    console.log('處理項目:', currentShippingOrder.items);
    
    if (!fifoData?.items) {
        return currentShippingOrder.items.map(item => ({...item})); // Return items without profit if no fifoData
    }
    return currentShippingOrder.items.map(item => {
      // Assuming fifoData.items has product code (did) for matching
      // And structure: { product: { code: 'item.did', ... }, fifoProfit: { grossProfit: ..., profitMargin: ... } }
      // Or simpler: { productCode: 'item.did', fifoProfit: { ... } }
      // Let's assume matching based on product code `item.did` with `fi.product.code`
      const matchedFifoItem = fifoData.items.find(fi => fi?.product?.code === item.did);

      if (matchedFifoItem?.fifoProfit) {
        return {
          ...item,
          profit: matchedFifoItem.fifoProfit.grossProfit, // For ProductItemsTable default 'profitField'
          profitMargin: matchedFifoItem.fifoProfit.profitMargin, // For ProductItemsTable default 'profitMarginField'
        };
      }
      return {...item}; // Return item as is if no match or no profit data
    });
  }, [currentShippingOrder, fifoData]);
   
  const formatDateSafe = (dateValue: string | Date | null | undefined, formatString: string = 'yyyy-MM-dd HH:mm'): string => {
    if (!dateValue) return 'N/A';
    const date = new Date(dateValue);
    return isValid(date) ? format(date, formatString, { locale: zhTW }) : 'N/A';
  };

  // 修改 CollapsibleDetail 接口，使其與 DetailItem 類型匹配
  interface CollapsibleDetail {
    label: string;
    value: any;
    icon?: React.ReactElement; // 將 ReactNode 改為 ReactElement
    color?: string;
    fontWeight?: string;
    condition: boolean;
    valueFormatter?: (val: any) => string;
    customContent?: React.ReactNode;
  }

  const getCollapsibleDetails = (): CollapsibleDetail[] => {
    if (!currentShippingOrder) return [];
    const details = [];
    const subtotal = (currentShippingOrder.totalAmount ?? 0) + (currentShippingOrder.discountAmount ?? 0);

    details.push({
      label: '小計',
      value: subtotal,
      icon: <ReceiptLongIcon color="action" fontSize="small" />,
      condition: true,
      valueFormatter: val => val.toFixed(2)
    });

    if (currentShippingOrder.discountAmount && currentShippingOrder.discountAmount > 0) {
      details.push({
        label: '折扣',
        value: -currentShippingOrder.discountAmount,
        icon: <PercentIcon color="secondary" fontSize="small" />,
        color: 'secondary.main',
        condition: true,
        valueFormatter: val => val.toFixed(2)
      });
    }

    if (!fifoLoading && fifoData?.summary) {
        details.push({
            label: '總成本',
            value: fifoData.summary.totalCost,
            icon: <MonetizationOnIcon color="action" fontSize="small"/>,
            condition: true,
            valueFormatter: val => typeof val === 'number' ? val.toFixed(2) : 'N/A'
        });
        details.push({
            label: '總毛利',
            value: fifoData.summary.totalProfit,
            icon: <TrendingUpIcon color={fifoData.summary.totalProfit >= 0 ? 'success' : 'error'} fontSize="small"/>,
            color: fifoData.summary.totalProfit >= 0 ? 'success.main' : 'error.main',
            fontWeight: 'bold',
            condition: true,
            valueFormatter: val => typeof val === 'number' ? val.toFixed(2) : 'N/A'
        });
        details.push({
            label: '毛利率',
            value: fifoData.summary.totalProfitMargin, // Expected to be a string like '10.50%'
            icon: <PercentIcon color={parseFloat(fifoData.summary.totalProfitMargin) >= 0 ? 'success' : 'error'} fontSize="small"/>,
            color: parseFloat(fifoData.summary.totalProfitMargin) >= 0 ? 'success.main' : 'error.main',
            fontWeight: 'bold',
            condition: true
        });
    } else if (fifoLoading) {
        details.push({
            label: '毛利資訊',
            value: '', // 添加空字符串作為值，滿足 CollapsibleAmountInfo 組件的要求
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
            value: '', // 添加空字符串作為值，滿足 CollapsibleAmountInfo 組件的要求
            customContent: <Typography variant="body2" color="error">{fifoError}</Typography>,
            condition: true
        });
    }

    return details;
  };

  const mainContent = (
    <Stack spacing={3}>
      {currentShippingOrder && (
        <CollapsibleAmountInfo
          title="金額信息"
          titleIcon={<AccountBalanceWalletIcon />}
          mainAmountLabel="總金額"
          mainAmountValue={currentShippingOrder.totalAmount ?? 0}
          mainAmountIcon={<ReceiptLongIcon />}
          collapsibleDetails={getCollapsibleDetails()} // Updated to include profit summary
          initialOpenState={true}
          isLoading={orderLoading} // Main order loading
          // Error and noDetailsText are for the main amount section, profit details handled within getCollapsibleDetails
        />
      )}
      {currentShippingOrder && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>項目</Typography>
            <Divider sx={{ mb: 2 }} />
            {productDetailsError && (
              <Typography color="error" sx={{ mb: 2 }}>{productDetailsError}</Typography>
            )}
            {/* 提取複雜的載入狀態邏輯為獨立變數 */}
            {(() => {
              const isTableLoading = !!(productDetailsLoading ?? false) || !!(orderLoading ?? false) || !!(fifoLoading ?? false);
              return (
                <ProductItemsTable
                  items={processedItems} // Use processed items with profit data
                  productDetails={productDetails}
                  codeField="did"
                  nameField="dname"
                  quantityField="dquantity"
                  priceField="dprice"
                  totalCostField="dtotalCost"
                  totalAmount={currentShippingOrder.totalAmount ?? 0}
                  title="" // Already has default title "項目"
                  isLoading={isTableLoading} // 使用提取的變數
                  // profitField and profitMarginField use defaults 'profit' and 'profitMargin'
                />
              );
            })()}
          </CardContent>
        </Card>
      )}
    </Stack>
  );

  const sidebarContent = (
    <Stack spacing={3}>
      {currentShippingOrder && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom><InfoIcon sx={{ verticalAlign: 'middle', mr: 1 }}/>基本信息</Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <ReceiptIcon fontSize="small" color="action"/>
                <Typography variant="body2">單號: {currentShippingOrder.soid ?? 'N/A'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <PersonIcon fontSize="small" color="action"/>
                <Typography variant="body2">客戶: {
                  typeof currentShippingOrder.customer === 'object'
                    ? currentShippingOrder.customer?.name
                    : currentShippingOrder.customer ?? currentShippingOrder.sosupplier ?? '未指定'
                }</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <InfoIcon fontSize="small" color="action"/>
                <Typography variant="body2">狀態: <StatusChip status={currentShippingOrder.status} /></Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CurrencyExchangeIcon fontSize="small" color="action"/>
                <Typography variant="body2">付款狀態: <PaymentStatusChip status={currentShippingOrder.paymentStatus} /></Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarTodayIcon fontSize="small" color="action"/>
                <Typography variant="body2">建立日期: {formatDateSafe(currentShippingOrder.createdAt)}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarTodayIcon fontSize="small" color="action"/>
                <Typography variant="body2">更新日期: {formatDateSafe(currentShippingOrder.updatedAt)}</Typography>
              </Stack>
              <Typography variant="subtitle2" color="text.secondary" sx={{ pt: 1 }}>備註:</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{currentShippingOrder.notes ?? '無'}</Typography>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );

  // 處理列印按鈕點擊事件
  const handlePrintClick = async () => {
    try {
      if (!currentShippingOrder || !id) return;
      await downloadShippingOrderPdf(id, currentShippingOrder.soid);
    } catch (error) {
      console.error('列印出貨單時發生錯誤:', error);
      // 可以在這裡加入錯誤處理，例如顯示錯誤訊息
    }
  };

  // 自定義列印按鈕
  const printButton = (() => {
    // 提取複雜的禁用狀態邏輯為獨立變數
    const isPrintButtonDisabled = !currentShippingOrder || !!(orderLoading ?? false) || !!(productDetailsLoading ?? false) || !!(fifoLoading ?? false);
    
    return (
      <Button
        key="print"
        variant="outlined"
        color="secondary"
        size="small"
        startIcon={<PrintIcon />}
        onClick={handlePrintClick}
        disabled={isPrintButtonDisabled}
      >
        列印
      </Button>
    );
  })();

  // 使用原來的 mainContent 和 sidebarContent，移除未使用的變量
  
  // 使用原來的 mainContent 和 sidebarContent，而不是簡化版的
  return (
    <DetailLayout
      pageTitle="出貨單詳情"
      recordIdentifier={currentShippingOrder?.soid ?? id}
      listPageUrl="/shipping-orders"
      mainContent={mainContent}
      sidebarContent={sidebarContent}
      isLoading={orderLoading}
      errorContent={orderError ? <Typography color="error" variant="h6">載入出貨單時發生錯誤: {orderError}</Typography> : null}
      additionalActions={[printButton]}
    />
  );
};

export default ShippingOrderDetailPage;