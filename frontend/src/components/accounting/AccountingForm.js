import React from 'react';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import zhTW from 'date-fns/locale/zh-TW';
import { format } from 'date-fns';

/**
 * 記帳表單對話框組件
 * 
 * @param {Object} props
 * @param {boolean} props.open - 對話框是否開啟
 * @param {Function} props.onClose - 關閉對話框的處理函數
 * @param {Object} props.formData - 表單數據
 * @param {Function} props.setFormData - 設置表單數據的函數
 * @param {boolean} props.editMode - 是否為編輯模式
 * @param {Function} props.onSubmit - 提交表單的處理函數
 */
const AccountingForm = ({
  open,
  onClose,
  formData,
  setFormData,
  editMode,
  onSubmit
}) => {
  // 處理表單變更
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // 處理日期變更
  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      date
    });
  };
  
  // 處理項目變更
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'amount' ? (value === '' ? '' : parseFloat(value)) : value
    };
    
    setFormData({
      ...formData,
      items: updatedItems
    });
  };
  
  // 新增項目
  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { amount: '', category: '', note: '' }]
    });
  };
  
  // 刪除項目
  const handleRemoveItem = (index) => {
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    
    setFormData({
      ...formData,
      items: updatedItems.length ? updatedItems : [{ amount: '', category: '', note: '' }]
    });
  };
  
  // 計算總金額
  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editMode ? '編輯記帳記錄' : '新增記帳記錄'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
              <DatePicker
                label="日期"
                value={formData.date}
                onChange={handleDateChange}
                renderInput={(params) => <TextField {...params} fullWidth required />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>班別</InputLabel>
              <Select
                name="shift"
                value={formData.shift}
                label="班別"
                onChange={handleFormChange}
              >
                <MenuItem value="早">早班</MenuItem>
                <MenuItem value="中">中班</MenuItem>
                <MenuItem value="晚">晚班</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {/* 項目列表 */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              項目
            </Typography>
            
            {formData.items.map((item, index) => (
              <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="金額"
                    type="number"
                    value={item.amount}
                    onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth required>
                    <InputLabel>名目</InputLabel>
                    <Select
                      value={item.category}
                      label="名目"
                      onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                    >
                      <MenuItem value="掛號費">掛號費</MenuItem>
                      <MenuItem value="部分負擔">部分負擔</MenuItem>
                      <MenuItem value="其他">其他</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="備註"
                    value={item.note}
                    onChange={(e) => handleItemChange(index, 'note', e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <IconButton
                    color="error"
                    onClick={() => handleRemoveItem(index)}
                    disabled={formData.items.length <= 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            ))}
            
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddItem}
              sx={{ mt: 1 }}
            >
              新增項目
            </Button>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="h6" align="right">
              總金額: ${calculateTotal(formData.items)}
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={onSubmit} variant="contained" color="primary">
          {editMode ? '更新' : '新增'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AccountingForm;
