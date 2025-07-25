import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../hooks/redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Typography,
  Chip,
  Card,
  CardContent,
  Divider,
  Stack,
  Box
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  CalendarToday as CalendarTodayIcon,
  PersonPin as SupplierIcon,
  Info as InfoIcon,
  Payment as PaymentIcon,
  Notes as NotesIcon,
  Inventory as InventoryIcon,
  Percent as PercentIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  ReceiptLong as ReceiptLongIcon,
  Business as BusinessIcon,
  SwapHoriz as SwapHorizIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

import { fetchPurchaseOrder } from '../redux/actions';
import ProductItemsTable from '../components/common/ProductItemsTable';
import DetailLayout from '../components/DetailLayout';
import { productServiceV2 } from '../services/productServiceV2';
import CollapsibleAmountInfo from '../components/common/CollapsibleAmountInfo';
import { RootState } from '../types/store';
import { Product, PurchaseOrder, PurchaseOrderItem } from '@pharmacy-pos/shared/types/entities';
import { Organization } from '@pharmacy-pos/shared/types/organization';
import { usePurchaseOrderActions } from '../components/purchase-orders/PurchaseOrderActions';
import { purchaseOrderServiceV2 } from '../services/purchaseOrderServiceV2';
import { useOrganizations } from '../hooks/useOrganizations';

// 擴展 PurchaseOrder 類型以包含實際使用的欄位
interface ExtendedPurchaseOrder extends Omit<PurchaseOrder, 'paymentStatus'> {
  paymentStatus?: string;  // 允許更寬泛的 string 型別
  poid?: string;           // 進貨單號
  pobill?: string;         // 發票號碼
  pobilldate?: string | Date; // 發票日期
  posupplier?: string;     // 供應商名稱
  transactionType?: string; // 交易類型
  discountAmount?: number; // 折扣金額
  relatedTransactionGroupId?: string; // 關聯的交易群組ID
  items: ExtendedPurchaseOrderItem[]; // 擴展的項目 - 保持必需以符合基礎介面
}

// 擴展 PurchaseOrderItem 類型以包含實際使用的欄位
interface ExtendedPurchaseOrderItem extends PurchaseOrderItem {
  did?: string;           // 產品代碼
  dname?: string;         // 產品名稱
  dquantity?: number;     // 數量
  dprice?: number;        // 單價
  dtotalCost?: number;    // 總成本
  batchNumber?: string;   // 批號
}

// 定義狀態類型
interface ProductDetailsState {
  [code: string]: Product;
}

// 定義 StatusChip 組件的 props 類型
interface StatusChipProps {
  status?: string;
}

// StatusChip 組件
const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
  let color: 'default' | 'success' | 'warning' | 'error' = 'default';
  let label = status ?? '未知';
  if (status === 'completed') { color = 'success'; label = '已完成'; }
  if (status === 'pending') { color = 'warning'; label = '待處理'; }
  if (status === 'cancelled') { color = 'error'; label = '已取消'; }
  return <Chip size="small" label={label} color={color} />;
};

// 定義 PaymentStatusChip 組件的 props 類型
interface PaymentStatusChipProps {
  status?: string;
}

// PaymentStatusChip 組件
const PaymentStatusChip: React.FC<PaymentStatusChipProps> = ({ status }) => {
  let color: 'default' | 'success' | 'warning' | 'error' = 'default';
  let label = status ?? '未付';
  if (status === 'paid' || status === '已付') { color = 'success'; label = '已付'; }
  if (status === 'unpaid' || status === '未付') { color = 'warning'; label = '未付'; }
  return <Chip size="small" label={label} color={color} />;
};

// 定義 CollapsibleDetail 類型
interface CollapsibleDetail {
  label: string;
  value: number;
  icon: React.ReactElement;
  color?: string;
  condition: boolean;
}

// 主組件
const PurchaseOrderDetailPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const { currentPurchaseOrder, loading: orderLoading, error: orderError } = useSelector((state: RootState) => state.purchaseOrders) as {
    currentPurchaseOrder: ExtendedPurchaseOrder | null;
    loading: boolean;
    error: string | null;
  };

  // 產品詳情狀態
  const [productDetails, setProductDetails] = useState<ProductDetailsState>({});
  const [productDetailsLoading, setProductDetailsLoading] = useState<boolean>(false);
  const [productDetailsError, setProductDetailsError] = useState<string | null>(null);
  
  // 機構資料
  const { organizations } = useOrganizations();
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  
  // 分錄資訊狀態
  const [transactionGroupId, setTransactionGroupId] = useState<string | null>(null);
  const [transactionLoading, setTransactionLoading] = useState<boolean>(false);
  
  // 獲取進貨單數據
  useEffect(() => {
    if (id) {
      dispatch(fetchPurchaseOrder(id));
    }
  }, [dispatch, id]);

  // 根據進貨單的 organizationId 設置當前機構
  useEffect(() => {
    if (currentPurchaseOrder?.organizationId && organizations.length > 0) {
      const foundOrganization = organizations.find(org => org._id === currentPurchaseOrder.organizationId);
      setCurrentOrganization(foundOrganization || null);
    } else {
      setCurrentOrganization(null);
    }
  }, [currentPurchaseOrder?.organizationId, organizations]);

  // 獲取關聯的分錄資訊
  useEffect(() => {
    const fetchTransactionInfo = async () => {
      if (!currentPurchaseOrder?.relatedTransactionGroupId) {
        setTransactionGroupId(null);
        return;
      }

      setTransactionLoading(true);
      try {
        // 設置交易群組ID
        setTransactionGroupId(currentPurchaseOrder.relatedTransactionGroupId.toString());
      } catch (error) {
        console.error('獲取分錄資訊時發生錯誤:', error);
        setTransactionGroupId(null);
      } finally {
        setTransactionLoading(false);
      }
    };

    fetchTransactionInfo();
  }, [currentPurchaseOrder?.relatedTransactionGroupId]);

  // 處理編輯按鈕點擊事件
  const handleEditClick = () => {
    if (id) {
      navigate(`/purchase-orders/edit/${id}`);
    }
  };

  // 處理解鎖按鈕點擊事件
  const handleUnlock = useCallback(async (): Promise<void> => {
    if (!id) return;
    
    try {
      await purchaseOrderServiceV2.unlockPurchaseOrder(id);
      // 重新載入進貨單資料
      dispatch(fetchPurchaseOrder(id));
      console.log('進貨單已解鎖並改為待處理狀態');
    } catch (error: any) {
      console.error('解鎖進貨單時發生錯誤:', error);
      const errorMessage = error.response?.data?.message || error.message || '未知錯誤';
      alert(`解鎖失敗: ${errorMessage}`);
    }
  }, [id, dispatch]);

  // 獲取產品詳情
  useEffect(() => {
    const fetchProductDetails = async (): Promise<void> => {
      if (!currentPurchaseOrder?.items?.length) {
        setProductDetails({});
        return;
      }

      setProductDetailsLoading(true);
      setProductDetailsError(null);
      const details: ProductDetailsState = {};
      // 使用 'did' 作為產品代碼字段
      const productCodes = Array.from(new Set(currentPurchaseOrder.items?.map(item => item.did).filter(Boolean) || []));

      try {
        const promises = productCodes.map(async (code) => {
          try {
            const productData = await productServiceV2.getProductByCode(code);
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
  }, [currentPurchaseOrder]);

  // 獲取可收合的金額詳情
  const getCollapsibleDetails = (): CollapsibleDetail[] => {
    if (!currentPurchaseOrder) return [];
  
    const details: CollapsibleDetail[] = [];
    const subtotal = (currentPurchaseOrder.totalAmount ?? 0) + (currentPurchaseOrder.discountAmount ?? 0);
  
    details.push({
      label: '小計',
      value: subtotal,
      icon: <ReceiptLongIcon color="action" fontSize="small" />,
      condition: true
    });
  
    if (currentPurchaseOrder?.discountAmount && currentPurchaseOrder.discountAmount > 0) {
      details.push({
        label: '折扣',
        value: -currentPurchaseOrder.discountAmount,
        icon: <PercentIcon color="secondary" fontSize="small" />,
        color: 'secondary.main',
        condition: true
      });
    }
  
    return details;
  };
  
  // 主要內容
  const mainContent = (
    <Stack spacing={3}>
      {currentPurchaseOrder && (
        <CollapsibleAmountInfo
          title="金額信息"
          titleIcon={<AccountBalanceWalletIcon />}
          mainAmountLabel="總金額"
          mainAmountValue={currentPurchaseOrder.totalAmount ?? 0}
          mainAmountIcon={<ReceiptLongIcon />}
          collapsibleDetails={getCollapsibleDetails()}
          initialOpenState={true}
          isLoading={orderLoading}
          error={orderError ? "金額資訊載入失敗" : null}
          noDetailsText="無金額明細"
        />
      )}
      {currentPurchaseOrder && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom><InventoryIcon sx={{ verticalAlign: 'middle', mr: 1 }}/>藥品項目</Typography>
            <Divider sx={{ mb: 2 }} />
            {productDetailsError && (
              <Typography color="error" sx={{ mb: 2 }}>{productDetailsError}</Typography>
            )}
            <ProductItemsTable
              items={currentPurchaseOrder.items || []}
              productDetails={productDetails}
              codeField="did"
              nameField="dname"
              quantityField="dquantity"
              totalCostField="dtotalCost"
              batchNumberField="batchNumber"
              showBatchNumber={true}
              totalAmount={currentPurchaseOrder.totalAmount ??
                          (currentPurchaseOrder.items ?? []).reduce((sum, item) => sum + Number(item.dtotalCost ?? 0), 0)}
              title=""
              isLoading={productDetailsLoading}
            />
          </CardContent>
        </Card>
      )}
    </Stack>
  );

  // 側邊欄內容
  const sidebarContent = (
    <Stack spacing={3}>
      {currentPurchaseOrder && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom><InfoIcon sx={{ verticalAlign: 'middle', mr: 1 }}/>基本資訊</Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <ReceiptIcon fontSize="small" color="action"/>
                <Typography variant="body2">進貨單號: {currentPurchaseOrder.poid || 'N/A'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <ReceiptIcon fontSize="small" color="action"/>
                <Typography variant="body2">發票號碼: {currentPurchaseOrder.pobill || 'N/A'}</Typography>
              </Stack>
               <Stack direction="row" spacing={1} alignItems="center">
                <CalendarTodayIcon fontSize="small" color="action"/>
                <Typography variant="body2">發票日期: {currentPurchaseOrder.pobilldate ? format(new Date(currentPurchaseOrder.pobilldate), 'yyyy-MM-dd', { locale: zhTW }) : 'N/A'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <SupplierIcon fontSize="small" color="action"/>
                <Typography variant="body2">供應商: {currentPurchaseOrder.posupplier || '未指定'}</Typography>
              </Stack>
              {transactionGroupId && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <AccountBalanceIcon fontSize="small" color="action"/>
                  <Typography variant="body2">
                    分錄:
                    <Link
                      to={`/accounting3/transaction/${transactionGroupId}`}
                      style={{
                        textDecoration: 'none',
                        color: 'inherit',
                        marginLeft: '4px'
                      }}
                    >
                      <Typography
                        component="span"
                        variant="body2"
                        sx={{
                          color: 'primary.main',
                          textDecoration: 'underline',
                          '&:hover': {
                            color: 'primary.dark'
                          }
                        }}
                      >
                        {transactionGroupId}
                      </Typography>
                    </Link>
                  </Typography>
                </Stack>
              )}
              <Stack direction="row" spacing={1} alignItems="center">
                <InfoIcon fontSize="small" color="action"/>
                <Typography variant="body2" component="div">狀態: <StatusChip status={currentPurchaseOrder.status} /></Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <PaymentIcon fontSize="small" color="action"/>
                <Typography variant="body2" component="div">付款狀態: <PaymentStatusChip status={currentPurchaseOrder.paymentStatus} /></Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarTodayIcon fontSize="small" color="action"/>
                <Typography variant="body2">建立日期: {currentPurchaseOrder.createdAt ? format(new Date(currentPurchaseOrder.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhTW }) : 'N/A'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarTodayIcon fontSize="small" color="action"/>
                <Typography variant="body2">更新日期: {currentPurchaseOrder.updatedAt ? format(new Date(currentPurchaseOrder.updatedAt), 'yyyy-MM-dd HH:mm', { locale: zhTW }) : 'N/A'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <NotesIcon fontSize="small" color="action" sx={{ mt: 0.5 }}/>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">備註:</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {currentPurchaseOrder.notes ?? '無'}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );

  // 合併載入狀態
  const combinedLoading = orderLoading || productDetailsLoading || transactionLoading;

  // 使用 PurchaseOrderActions hook 生成操作按鈕
  const additionalActions = usePurchaseOrderActions({
    purchaseOrder: currentPurchaseOrder,
    orderId: id,
    orderLoading: orderLoading,
    productDetailsLoading: productDetailsLoading,
    fifoLoading: false, // 進貨單沒有 FIFO 功能
    onEdit: handleEditClick,
    onUnlock: handleUnlock
  });

  return (
    <DetailLayout
      pageTitle="進貨單詳情"
      recordIdentifier={currentPurchaseOrder?.poid}
      listPageUrl="/purchase-orders"
      mainContent={mainContent}
      sidebarContent={sidebarContent}
      isLoading={combinedLoading}
      errorContent={orderError ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error" variant="h6">載入進貨單時發生錯誤: {orderError}</Typography>
          </Box>
        ) : null}
      additionalActions={additionalActions}
    />
  );
};

export default PurchaseOrderDetailPage;