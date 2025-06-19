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
  SelectChangeEvent
} from '@mui/material';
// 單獨引入 Grid 組件
import Grid from '@mui/material/Grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { zhTW } from 'date-fns/locale';
import SupplierSelect from '../common/SupplierSelect';

// 定義供應商介面
interface Supplier {
  _id: string; // 修改為必需屬性
  name: string;
  shortCode?: string;
  [key: string]: any;
}

// 定義表單數據介面
interface FormData {
  poid?: string;
  pobill?: string;
  pobilldate?: Date | string | null;
  paymentStatus?: string;
  notes?: string;
  multiplierMode?: string | number;
  status?: string;
  [key: string]: any;
}

// 定義組件 props 的介面
interface BasicInfoFormProps {
  formData: FormData;
  handleInputChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => void;
  handleDateChange: (date: Date | null) => void;
  handleSupplierChange: (event: React.SyntheticEvent, supplier: Supplier | null) => void;
  suppliers?: Supplier[];
  selectedSupplier?: Supplier | null;
  isEditMode?: boolean;
  invoiceInputRef?: React.RefObject<HTMLInputElement>;
  isTestMode?: boolean;
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
  suppliers,
  selectedSupplier,
  isEditMode
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
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          基本資訊
        </Typography>
        
        <Grid container spacing={2}>
          {/* @ts-ignore */}
          <Grid item md={2} sm={6} xs={12}>
            <TextField
              fullWidth
              label="進貨單號"
              name="poid"
              value={formData?.poid}
              onChange={handleInputChange}
              variant="outlined"
              disabled={isEditMode}
              helperText="留空將自動生成"
            />
          </Grid>
          {/* @ts-ignore */}
          <Grid item md={2} sm={6} xs={12}>
            <TextField
              fullWidth
              label="發票號碼"
              name="pobill"
              value={formData?.pobill}
              onChange={handleInputChange}
              variant="outlined"
            />
          </Grid>
          {/* @ts-ignore */}
          <Grid item md={2} sm={6} xs={12}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
              <DatePicker
                label="發票日期"
                value={formData?.pobilldate}
                onChange={handleDateChange}
                slotProps={{
                  textField: { fullWidth: true }
                }}
              />
            </LocalizationProvider>
          </Grid>
          {/* @ts-ignore */}
          <Grid item md={2} sm={6} xs={12}>
            {/* @ts-ignore */}
            <SupplierSelect
              suppliers={suppliers || []}
              selectedSupplier={selectedSupplier} 
              onChange={handleSupplierChange}
              label={isEditMode ? "進貨商 (僅供查看)" : "進貨商 (可用名稱或簡碼)"}
            />
          </Grid>
          {/* @ts-ignore */}
          <Grid item md={2} sm={6} xs={12}>
            <Box
              sx={{
                backgroundColor: getPaymentStatusBackgroundColor()
              }}
            >
              <FormControl fullWidth>
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
          {/* @ts-ignore */}
          <Grid item md={6} sm={6} xs={12}>
            <TextField
              fullWidth
              label="備註"
              name="notes"
              value={formData?.notes}
              onChange={handleInputChange}
              variant="outlined"
              multiline
              rows={1}
            />
          </Grid>
          {/* @ts-ignore */}
          <Grid item md={2} sm={2} xs={12}>
            <TextField
              fullWidth
              label="倍率模式 (%)"
              name="multiplierMode"
              value={formData?.multiplierMode}
              onChange={handleInputChange}
              variant="outlined"
              type="number"
              inputProps={{ step: "0.1" }}
              helperText="正數增加，負數減少"
            />
          </Grid>
          {/* @ts-ignore */}
          <Grid item md={2} sm={6} xs={12}>
            <Box
              sx={{
                backgroundColor: getStatusBackgroundColor()
              }}
            >
              <FormControl fullWidth>
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
        </Grid>

      </CardContent>
    </Card>
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
    status: PropTypes.string
  }).isRequired,
  handleInputChange: PropTypes.func.isRequired,
  handleDateChange: PropTypes.func.isRequired,
  handleSupplierChange: PropTypes.func.isRequired,
  suppliers: PropTypes.array,
  selectedSupplier: PropTypes.object,
  isEditMode: PropTypes.bool
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