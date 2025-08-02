import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { zhTW } from 'date-fns/locale';
import { accounting3Service } from '../../../services/accounting3Service';

// 應付帳款資訊介面
interface PayableTransactionInfo {
  _id: string;
  groupNumber: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate?: Date;
  supplierInfo?: {
    supplierId: string;
    supplierName: string;
  };
  isPaidOff: boolean;
  paymentHistory: Array<{
    paymentTransactionId: string;
    paidAmount: number;
    paymentDate: Date;
    paymentMethod?: string;
  }>;
  transactionDate: Date;
}

// 付款交易資料介面
interface PaymentTransactionData {
  description: string;
  transactionDate: Date;
  paymentMethod: string;
  totalAmount: number;
  entries: Array<{
    sequence: number;
    accountId: string;
    debitAmount: number;
    creditAmount: number;
    description: string;
    sourceTransactionId?: string;
  }>;
  linkedTransactionIds: string[];
  organizationId?: string;
  paymentInfo: {
    paymentMethod: string;
    payableTransactions: Array<{
      transactionId: string;
      paidAmount: number;
      remainingAmount?: number;
    }>;
  };
}

// 帳戶選項介面
interface AccountOption {
  _id: string;
  name: string;
  code: string;
  accountType: string;
}

interface PaymentTransactionFormProps {
  selectedPayables: PayableTransactionInfo[];
  organizationId?: string;
  onSubmit: (paymentData: PaymentTransactionData) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

// 格式化金額
const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// 付款方式選項
const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: '銀行轉帳' },
  { value: 'cash', label: '現金' },
  { value: 'check', label: '支票' },
  { value: 'credit_card', label: '信用卡' },
  { value: 'other', label: '其他' }
];

export const PaymentTransactionForm: React.FC<PaymentTransactionFormProps> = ({
  selectedPayables,
  organizationId,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [paymentAccount, setPaymentAccount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [paymentMethod, setPaymentMethod] = useState<string>('bank_transfer');
  const [description, setDescription] = useState<string>('');
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [payableAccounts, setPayableAccounts] = useState<AccountOption[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 計算總付款金額
  const totalPaymentAmount = selectedPayables.reduce((sum, p) => sum + p.remainingAmount, 0);

  // 獲取可用的付款帳戶（資產類帳戶）和應付帳款科目（負債類帳戶）
  const fetchAccounts = useCallback(async () => {
    setAccountsLoading(true);
    try {
      const response = await accounting3Service.accounts.getAll(organizationId);
      
      if (response.success && response.data) {
        // 過濾出資產類帳戶作為付款帳戶選項
        const assetAccounts = response.data
          .filter((account: any) => account.accountType === 'asset')
          .map((account: any) => ({
            _id: account._id,
            name: account.name,
            code: account.code,
            accountType: account.accountType
          }));
        
        // 過濾出負債類帳戶作為應付帳款科目
        const liabilityAccounts = response.data
          .filter((account: any) => account.accountType === 'liability')
          .map((account: any) => ({
            _id: account._id,
            name: account.name,
            code: account.code,
            accountType: account.accountType
          }));
        
        setAccounts(assetAccounts);
        setPayableAccounts(liabilityAccounts);
        console.log('✅ 帳戶載入成功: 付款帳戶', assetAccounts.length, '個, 應付帳款科目', liabilityAccounts.length, '個');
      }
    } catch (err) {
      console.error('❌ 載入帳戶失敗:', err);
      setError('載入帳戶失敗');
    } finally {
      setAccountsLoading(false);
    }
  }, [organizationId]);

  // 生成預設描述
  const generateDefaultDescription = useCallback(() => {
    if (selectedPayables.length === 0) return '';
    
    if (selectedPayables.length === 1) {
      const payable = selectedPayables[0];
      return `${payable.supplierInfo?.supplierName || payable.groupNumber}`;
    } else {
      const suppliers = [...new Set(selectedPayables.map(p => p.supplierInfo?.supplierName).filter(Boolean))];
      if (suppliers.length === 1) {
        return `${suppliers[0]} - ${selectedPayables.length} 筆應付帳款`;
      } else {
        return `付款 - ${selectedPayables.length} 筆應付帳款`;
      }
    }
  }, [selectedPayables]);

  // 獲取選中帳戶的名稱
  const getAccountName = (accountId: string): string => {
    const account = accounts.find(a => a._id === accountId);
    return account ? `${account.code} - ${account.name}` : '';
  };

  // 直接使用交易記錄中的廠商子科目 ID
  const getPayableAccountId = (payable: PayableTransactionInfo): string => {
    // 直接使用 supplierInfo 中的 supplierId，這就是廠商子科目的 ID
    if (payable.supplierInfo?.supplierId) {
      return payable.supplierInfo.supplierId;
    }
    
    // 如果沒有 supplierInfo，這表示資料可能有問題
    console.error('⚠️ 應付帳款缺少廠商科目資訊:', payable);
    
    // 備選：使用第一個非主科目的負債類科目
    const supplierAccounts = payableAccounts.filter(account =>
      account.name !== '應付帳款' &&
      !account.name.startsWith('應付帳款') &&
      account.accountType === 'liability'
    );
    
    return supplierAccounts.length > 0 ? supplierAccounts[0]._id : '';
  };

  // 處理表單提交
  const handleSubmit = async () => {
    if (!paymentAccount) {
      setError('請選擇付款帳戶');
      return;
    }

    if (selectedPayables.length === 0) {
      setError('請選擇要付款的應付帳款');
      return;
    }

    if (payableAccounts.length === 0) {
      setError('找不到應付帳款科目，請確認會計科目設定');
      return;
    }

    setError(null);

    try {
      // 建立付款交易資料 - 合併相同科目的金額
      const accountAmountMap = new Map<string, {
        totalAmount: number;
        descriptions: string[];
        sourceTransactionIds: string[];
      }>();

      // 將相同科目的金額合併
      selectedPayables.forEach(payable => {
        const payableAccountId = getPayableAccountId(payable);
        if (!payableAccountId) {
          throw new Error(`無法找到應付帳款科目: ${payable.supplierInfo?.supplierName || payable.groupNumber}`);
        }

        if (accountAmountMap.has(payableAccountId)) {
          const existing = accountAmountMap.get(payableAccountId)!;
          existing.totalAmount += payable.remainingAmount;
          existing.descriptions.push(payable.groupNumber);
          existing.sourceTransactionIds.push(payable._id);
        } else {
          accountAmountMap.set(payableAccountId, {
            totalAmount: payable.remainingAmount,
            descriptions: [payable.groupNumber],
            sourceTransactionIds: [payable._id]
          });
        }
      });

      // 生成合併後的分錄
      const debitEntries = Array.from(accountAmountMap.entries()).map(([accountId, data], index) => ({
        sequence: index + 1,
        accountId,
        debitAmount: data.totalAmount,
        creditAmount: 0,
        description: `付款 - ${data.descriptions.join(', ')}`,
        sourceTransactionId: data.sourceTransactionIds[0] // 使用第一筆作為主要來源
      }));

      const paymentData: PaymentTransactionData = {
        description: description || generateDefaultDescription(),
        transactionDate: paymentDate,
        paymentMethod,
        totalAmount: totalPaymentAmount,
        entries: [
          // 借方：應付帳款 (減少負債) - 合併相同科目
          ...debitEntries,
          // 貸方：付款帳戶 (減少資產)
          {
            sequence: debitEntries.length + 1,
            accountId: paymentAccount,
            debitAmount: 0,
            creditAmount: totalPaymentAmount,
            description: `付款 - ${PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label}`
          }
        ],
        linkedTransactionIds: selectedPayables.map(p => p._id),
        ...(organizationId && { organizationId }),
        paymentInfo: {
          paymentMethod,
          payableTransactions: selectedPayables.map(p => ({
            transactionId: p._id,
            paidAmount: p.remainingAmount,
            remainingAmount: 0
          }))
        }
      };

      console.log('💰 提交付款交易:', paymentData);
      console.log('📋 應付帳款科目對應:', selectedPayables.map(p => ({
        payable: p.groupNumber,
        supplier: p.supplierInfo?.supplierName,
        accountId: getPayableAccountId(p),
        accountName: payableAccounts.find(a => a._id === getPayableAccountId(p))?.name
      })));
      
      await onSubmit(paymentData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '建立付款交易失敗';
      setError(errorMessage);
      console.error('❌ 建立付款交易失敗:', err);
    }
  };

  // 初始化
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // 更新預設描述
  useEffect(() => {
    if (!description) {
      setDescription(generateDefaultDescription());
    }
  }, [selectedPayables, generateDefaultDescription, description]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            建立付款交易
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* 付款基本資訊 */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                付款資訊
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={loading}>
                <InputLabel>付款帳戶</InputLabel>
                <Select
                  value={paymentAccount}
                  onChange={(e) => setPaymentAccount(e.target.value)}
                  label="付款帳戶"
                >
                  {accountsLoading ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      載入中...
                    </MenuItem>
                  ) : (
                    accounts.map((account) => (
                      <MenuItem key={account._id} value={account._id}>
                        {account.code} - {account.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <DatePicker
                label="付款日期"
                value={paymentDate}
                onChange={(date: Date | null) => setPaymentDate(date || new Date())}
                disabled={loading}
                renderInput={(params) => (
                  <TextField {...params} fullWidth />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={loading}>
                <InputLabel>付款方式</InputLabel>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  label="付款方式"
                >
                  {PAYMENT_METHODS.map((method) => (
                    <MenuItem key={method.value} value={method.value}>
                      {method.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="付款總金額"
                value={formatAmount(totalPaymentAmount)}
                disabled
                helperText="根據選擇的應付帳款自動計算"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="付款說明"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={3}
                disabled={loading}
                helperText="可選，系統會自動生成預設說明"
              />
            </Grid>

            {/* 付款明細 */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                付款明細
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>交易編號</TableCell>
                      <TableCell>供應商</TableCell>
                      <TableCell>描述</TableCell>
                      <TableCell align="right">應付金額</TableCell>
                      <TableCell align="right">已付金額</TableCell>
                      <TableCell align="right">本次付款</TableCell>
                      <TableCell>狀態</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedPayables.map((payable) => (
                      <TableRow key={payable._id}>
                        <TableCell>{payable.groupNumber}</TableCell>
                        <TableCell>{payable.supplierInfo?.supplierName || '-'}</TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {payable.description}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {formatAmount(payable.totalAmount)}
                        </TableCell>
                        <TableCell align="right">
                          {formatAmount(payable.paidAmount)}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium" color="primary">
                            {formatAmount(payable.remainingAmount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label="將付清"
                            color="success"
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            {/* 付款摘要 */}
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  付款摘要
                </Typography>
                <Typography variant="body2">
                  付款筆數: {selectedPayables.length} 筆
                </Typography>
                <Typography variant="body2">
                  總付款金額: {formatAmount(totalPaymentAmount)}
                </Typography>
                <Typography variant="body2">
                  付款帳戶: {paymentAccount ? getAccountName(paymentAccount) : '請選擇'}
                </Typography>
                <Typography variant="body2">
                  付款方式: {PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label}
                </Typography>
              </Box>
            </Grid>

            {/* 操作按鈕 */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                {onCancel && (
                  <Button
                    variant="outlined"
                    onClick={onCancel}
                    disabled={loading}
                  >
                    取消
                  </Button>
                )}
                
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={!paymentAccount || selectedPayables.length === 0 || loading}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      建立中...
                    </>
                  ) : (
                    '建立付款交易'
                  )}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </LocalizationProvider>
  );
};

export default PaymentTransactionForm;