import React, { FC, ChangeEvent } from 'react';
import {
  Box,
  TextField,
  Grid as MuiGrid,
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
import { Supplier } from '@pharmacy-pos/shared/types/entities';

// 直接使用 MuiGrid
const Grid = MuiGrid;

// 定義表單數據介面
interface FormData {
  soid: string;
  paymentStatus: string;
  status: string;
  notes: string;
  multiplierMode?: string | number;
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Card>
        <CardContent sx={{ pb: 1, '&:last-child': { pb: 1 } }}>
          <Typography variant="h6" gutterBottom>
            基本資訊
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="出貨單號"
                name="soid"
                value={formData.soid}
                onChange={handleInputChange}
                disabled={isEditMode || false}
                variant="outlined"
                size="small"
                helperText={!isEditMode ? "留空將自動生成" : ""}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="倍率模式 (%)"
                name="multiplierMode"
                value={formData.multiplierMode || ''}
                onChange={handleInputChange}
                variant="outlined"
                size="small"
                type="number"
                inputProps={{ step: "0.1" }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <SupplierSelect
                suppliers={suppliers ?? []}
                selectedSupplier={selectedSupplier || null}
                onChange={(_event, supplier) => handleSupplierChange(supplier as Supplier)}
                label={isEditMode ? "供應商 (僅供查看)" : "供應商 (可用名稱或簡碼搜索)"}
                required={true}
                showCode={true}
                autoFocus={autoFocus || false}
              />
            </Grid>
            
            <Grid item xs={6}>
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

            <Grid item xs={6}>
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
    </Box>
  );
};

export default BasicInfoForm;

BasicInfoForm.propTypes = {
  formData: PropTypes.shape({
    soid: PropTypes.string,
    paymentStatus: PropTypes.string,
    status: PropTypes.string,
    notes: PropTypes.string,
    multiplierMode: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }).isRequired,
  handleInputChange: PropTypes.func.isRequired,
  handleSupplierChange: PropTypes.func.isRequired,
  suppliers: PropTypes.array,
  selectedSupplier: PropTypes.object,
  isEditMode: PropTypes.bool,
  autoFocus: PropTypes.bool
} as any; // 使用 any 類型來避免 TypeScript 錯誤