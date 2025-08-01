import React, { FC, ChangeEvent } from 'react';
import PropTypes from 'prop-types'; // 引入 PropTypes 進行 props 驗證
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Card,
  CardContent,
  SelectChangeEvent,
  Grid as MuiGrid
} from '@mui/material';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { zhTW } from 'date-fns/locale';
import { Supplier } from '@pharmacy-pos/shared/types/entities';
import SupplierSelect from '../common/SupplierSelect'; // 假設你有一個供應商選擇組件
import SupplierAccountSelect from './SupplierAccountSelect';
import AccountingEntrySelector from './AccountingEntrySelector';

// 直接使用 MuiGrid
const Grid = MuiGrid;

// 定義表單數據介面
interface FormData {
  poid?: string;
  pobill?: string;
  pobilldate?: Date | string | null;
  paymentStatus?: string;
  transactionType?: string;
  notes?: string;
  multiplierMode?: string | number;
  status?: string;
  supplier?: string; // 供應商ID
  selectedAccountIds?: string[]; // 選中的會計科目ID
  organizationId?: string; // 機構ID
  accountingEntryType?: 'expense-asset' | 'asset-liability'; // 會計分錄類型
  [key: string]: any;
}

// 定義組件 props 的介面
interface BasicInfoFormProps {
  formData: FormData;
  handleInputChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => void;
  handleDateChange: (date: Date | null) => void;
  handleSupplierChange: (event: React.SyntheticEvent, value: Supplier | null) => void;
  handleAccountChange?: (accountIds: string[]) => void;
  handleAccountingEntryChange?: (accountIds: string[], entryType: 'expense-asset' | 'asset-liability') => void;
  suppliers?: Supplier[];
  selectedSupplier?: Supplier | null;
  isEditMode?: boolean;
  isTestMode?: boolean;
  invoiceInputRef?: React.RefObject<HTMLInputElement>;
}

/**
 * 進貨單基本資訊表單組件
 * @param {BasicInfoFormProps} props - 組件屬性
 * @returns {React.ReactElement} 基本資訊表單組件
 */
const BasicInfoForm: FC<BasicInfoFormProps> = ({
  formData,
  handleInputChange,
  handleDateChange,
  handleSupplierChange,
  handleAccountChange,
  handleAccountingEntryChange,
  suppliers,
  selectedSupplier,
  isEditMode,
  isTestMode,
  invoiceInputRef
}) => {

  // 將巢狀三元運算子拆解為獨立陳述式
  const getPaymentStatusBackgroundColor = () => {
    if (formData?.paymentStatus === '未付') return '#F8D7DA';
    if (formData?.paymentStatus === '已下收' || formData?.paymentStatus === '已匯款') return '#D4EDDA';
    return 'transparent';
  };

  // 將巢狀三元運算子拆解為獨立陳述式
  const getStatusBackgroundColor = () => {
    if (formData?.status === 'pending') return '#FFF3CD';
    if (formData?.status === 'completed') return '#D4EDDA';
    return 'transparent';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* 基本資訊區塊 */}
      <Card>
        <CardContent sx={{ pb: 1, '&:last-child': { pb: 1 } }}>
          {isTestMode && (
            <Typography
              variant="caption"
              color="warning.main"
              sx={{
                display: 'block',
                mb: 1,
                fontWeight: 'bold',
                backgroundColor: '#fff3cd',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #ffeaa7'
              }}
            >
              🧪 測試模式 - 開發環境
            </Typography>
          )}
          <Typography variant="h6" gutterBottom>
            基本資訊
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="進貨單號"
                name="poid"
                value={formData?.poid}
                onChange={handleInputChange}
                variant="outlined"
                size="small"
                disabled={isEditMode || false}
                helperText="留空將自動生成"
              />
            </Grid>
                        <Grid item xs={6}>
              <TextField
                fullWidth
                label="倍率模式 (%)"
                name="multiplierMode"
                value={formData?.multiplierMode}
                onChange={handleInputChange}
                variant="outlined"
                size="small"
                type="number"
                inputProps={{ step: "0.1" }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="發票號碼"
                name="pobill"
                value={formData?.pobill}
                onChange={handleInputChange}
                variant="outlined"
                size="small"
                {...(invoiceInputRef && { inputRef: invoiceInputRef })}
              />
            </Grid>
<Grid item xs={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
                <DatePicker
                  label="發票日期"
                  value={formData?.pobilldate}
                  onChange={handleDateChange}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <SupplierSelect
                suppliers={suppliers ?? []}
                selectedSupplier={selectedSupplier || null}
                onChange={handleSupplierChange}
                label={isEditMode ? "進貨商 (僅供查看)" : "進貨商 (可用名稱或簡碼)"}
              />
            </Grid>
            <Grid item xs={6}>
              <Box
                sx={{
                  backgroundColor: getPaymentStatusBackgroundColor()
                }}
              >
                <FormControl fullWidth size="small">
                 <InputLabel id="payment-status-select-label">付款狀態</InputLabel>
                    <Select
                      labelId="payment-status-select-label"
                      id="payment-status-select"
                      name="paymentStatus"
                      value={formData?.paymentStatus || ''}
                      label="付款狀態"
                      onChange={handleInputChange}
                    >
                  <MenuItem value="未付">未付</MenuItem>
                  <MenuItem value="已下收">已下收</MenuItem>
                  <MenuItem value="已匯款">已匯款</MenuItem>
                </Select>
              </FormControl>
              </Box>
            </Grid>
            
            <Grid item xs={6}>
              <Box
                sx={{
                  backgroundColor: getStatusBackgroundColor()
                }}
              >
                <FormControl fullWidth size="small">
                  <InputLabel>狀態</InputLabel>
                  <Select
                    name="status"
                    value={formData?.status || ''}
                    onChange={handleInputChange}
                    label="狀態"
                    id="status-select"
                  >
                    <MenuItem value="pending">處理中</MenuItem>
                    <MenuItem value="completed">已完成</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Grid>
            

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="備註"
                name="notes"
                value={formData?.notes}
                onChange={handleInputChange}
                variant="outlined"
                size="small"
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 會計科目配對區塊 */}
      <Card>
        <CardContent sx={{ pb: 1, pt: 1.5, '&:last-child': { pb: 1 } }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            會計科目配對
          </Typography>
          
            {/* 原有的供應商科目配對 */}
            <Grid item xs={12}>
              <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #e0e0e0' }}>
                <SupplierAccountSelect
                  supplierId={formData?.supplier || ''}
                  selectedAccountIds={formData?.selectedAccountIds || []}
                  onChange={handleAccountChange || (() => {})}
                  label="已配對的會計科目"
                  size="small"
                  disabled={!formData?.supplier}
                />
              </Box>
            </Grid>
          
          
          <Grid container spacing={1.5}>
            {/* 新的記帳格式選擇 */}
            <Grid item xs={12}>
              <AccountingEntrySelector
                organizationId={formData?.organizationId || ''}
                selectedAccountIds={formData?.selectedAccountIds || []}
                onChange={handleAccountingEntryChange || (() => {})}
                disabled={!formData?.supplier}
                currentEntryType={formData?.accountingEntryType}
              />
            </Grid>
            

          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

// 添加 BasicInfoForm 的 PropTypes 驗證
BasicInfoForm.propTypes = {
  formData: PropTypes.shape({
    poid: PropTypes.string,
    pobill: PropTypes.string,
    pobilldate: PropTypes.oneOfType([PropTypes.string, PropTypes.object, PropTypes.instanceOf(Date)]),
    paymentStatus: PropTypes.string,
    notes: PropTypes.string,
    multiplierMode: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.string,
    supplier: PropTypes.string,
    selectedAccountIds: PropTypes.array
  }).isRequired,
  handleInputChange: PropTypes.func.isRequired,
  handleDateChange: PropTypes.func.isRequired,
  handleSupplierChange: PropTypes.func.isRequired,
  handleAccountChange: PropTypes.func,
  suppliers: PropTypes.array,
  selectedSupplier: PropTypes.object,
  isEditMode: PropTypes.bool,
  isTestMode: PropTypes.bool,
  invoiceInputRef: PropTypes.object
} as any; // 使用 any 類型來避免 TypeScript 錯誤

// 過濾供應商的函數
const filterSuppliers = (options: Supplier[], inputValue?: string): Supplier[] => {
  const filterValue = inputValue?.toLowerCase() || '';
  return options.filter(option =>
    option.name.toLowerCase().includes(filterValue) ||
    (option.shortCode?.toLowerCase().includes(filterValue))
  );
};

export default BasicInfoForm;