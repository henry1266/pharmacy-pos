import React, { FC, ChangeEvent } from 'react';
import { 
  TextField, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Card, 
  CardContent, 
  Typography,
  SelectChangeEvent
} from '@mui/material';
import PropTypes from 'prop-types';
import SupplierSelect from '../../../common/SupplierSelect'; // 假設你有一個供應商選擇組件

// 定義供應商介面
interface Supplier {
  _id: string;
  name: string;
  shortCode?: string;
  [key: string]: any;
}

// 定義表單數據介面
interface FormData {
  soid: string;
  paymentStatus: string;
  status: string;
  notes: string;
  [key: string]: any;
}

// 定義組件 props 的介面
interface BasicInfoFormProps {
  formData: FormData;
  handleInputChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => void;
  handleSupplierChange: (supplier: Supplier | null) => void;
  suppliers?: Supplier[];
  selectedSupplier?: Supplier | null;
  isEditMode?: boolean;
  autoFocus?: boolean;
}

/**
 * 出貨單基本信息表單組件
 * @param {BasicInfoFormProps} props - 組件屬性
 * @returns {React.ReactElement} 基本信息表單組件
 */
const BasicInfoForm: FC<BasicInfoFormProps> = ({
  formData,
  handleInputChange,
  handleSupplierChange,
  suppliers,
  selectedSupplier,
  isEditMode,
  autoFocus
}) => {

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          基本資訊
        </Typography>
        
        
        <Grid container spacing={2}>
          {/* @ts-ignore */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="出貨單號"
              name="soid"
              value={formData.soid}
              onChange={handleInputChange}
              disabled={isEditMode}
              variant="outlined"
              size="small"
              helperText={!isEditMode ? "留空將自動生成" : ""}
            />
          </Grid>
          
          {/* @ts-ignore */}
          <Grid item xs={12} sm={6} md={3}>
            {/* @ts-ignore */}
            <SupplierSelect
              suppliers={suppliers ?? []}
              selectedSupplier={selectedSupplier}
              onChange={(event, supplier) => handleSupplierChange(supplier as Supplier)}
              label="供應商 (可用名稱或簡碼搜索)"
              required={true}
              showCode={true}
              autoFocus={autoFocus}
            />
          </Grid>
          
          {/* @ts-ignore */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="payment-status-select-label">付款狀態</InputLabel>
              <Select
                labelId="payment-status-select-label"
                id="payment-status-select"
                name="paymentStatus"
                value={formData.paymentStatus}
                label="付款狀態"
                onChange={handleInputChange}
              >
                <MenuItem value="未收">未收</MenuItem>
                <MenuItem value="已收款">已收款</MenuItem>
                <MenuItem value="已開立">已開立</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* @ts-ignore */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="status-select-label">狀態</InputLabel>
              <Select
                labelId="status-select-label"
                id="status-select"
                name="status"
                value={formData.status}
                label="狀態"
                onChange={handleInputChange}
              >
                <MenuItem value="pending">處理中</MenuItem>
                <MenuItem value="completed">已完成</MenuItem>
                <MenuItem value="cancelled">已取消</MenuItem>
              </Select>
            </FormControl>
          </Grid>          
          
          
          {/* @ts-ignore */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="備註"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              multiline
              rows={2}
              variant="outlined"
              size="small"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default BasicInfoForm;

BasicInfoForm.propTypes = {
  formData: PropTypes.shape({
    soid: PropTypes.string,
    paymentStatus: PropTypes.string,
    status: PropTypes.string,
    notes: PropTypes.string
  }).isRequired,
  handleInputChange: PropTypes.func.isRequired,
  handleSupplierChange: PropTypes.func.isRequired,
  suppliers: PropTypes.array,
  selectedSupplier: PropTypes.object,
  isEditMode: PropTypes.bool,
  autoFocus: PropTypes.bool
} as any; // 使用 any 類型來避免 TypeScript 錯誤