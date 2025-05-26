import React from 'react';
import PropTypes from 'prop-types';
import { 
  Grid, 
  TextField,
  FormHelperText
} from '@mui/material';

/**
 * 其他資訊區塊
 * 包含學經歷、獎懲、傷病、其他應記載事項等欄位
 */
const AdditionalInfoSection = ({ formData, errors, onChange }) => {
  return (
    <Grid container spacing={2}>
      {/* 相關學經歷 */}
      <Grid item xs={12}>
        <TextField
          fullWidth
          id="experience"
          name="experience"
          label="相關學經歷"
          value={formData.experience}
          onChange={onChange}
          error={!!errors.experience}
          helperText={errors.experience}
          margin="normal"
          multiline
          rows={2}
        />
      </Grid>
      
      {/* 獎懲 */}
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          id="rewards"
          name="rewards"
          label="獎懲"
          value={formData.rewards}
          onChange={onChange}
          error={!!errors.rewards}
          helperText={errors.rewards}
          margin="normal"
          multiline
          rows={2}
        />
      </Grid>
      
      {/* 傷病 */}
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          id="injuries"
          name="injuries"
          label="傷病"
          value={formData.injuries}
          onChange={onChange}
          error={!!errors.injuries}
          helperText={errors.injuries}
          margin="normal"
          multiline
          rows={2}
        />
      </Grid>
      
      {/* 其他應記載事項 */}
      <Grid item xs={12}>
        <TextField
          fullWidth
          id="additionalInfo"
          name="additionalInfo"
          label="其他應記載事項"
          value={formData.additionalInfo}
          onChange={onChange}
          error={!!errors.additionalInfo}
          helperText={errors.additionalInfo}
          margin="normal"
          multiline
          rows={3}
        />
      </Grid>
      
      {/* 簽署日期提示 */}
      <Grid item xs={12}>
        <TextField
          fullWidth
          id="signDate"
          name="signDate"
          label="簽署日期"
          type="date"
          value={formData.signDate}
          onChange={onChange}
          error={!!errors.signDate}
          helperText={errors.signDate || "已確認以上資料無誤，於此日期親自填寫"}
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />
      </Grid>
    </Grid>
  );
};

// 添加 PropTypes 驗證
AdditionalInfoSection.propTypes = {
  formData: PropTypes.shape({
    experience: PropTypes.string,
    rewards: PropTypes.string,
    injuries: PropTypes.string,
    additionalInfo: PropTypes.string,
    signDate: PropTypes.string
  }).isRequired,
  errors: PropTypes.objectOf(PropTypes.string),
  onChange: PropTypes.func.isRequired
};

export default AdditionalInfoSection;
