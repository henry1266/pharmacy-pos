import React from 'react';
import { 
  Grid, 
  TextField, 
  FormControl, 
  FormLabel, 
  RadioGroup, 
  FormControlLabel, 
  Radio,
  FormHelperText
} from '@mui/material';

/**
 * 個人基本資料區塊
 * 包含姓名、性別、出生年月日、身分證號碼、教育程度、籍貫等欄位
 */
const PersonalInfoSection = ({ formData, errors, onChange }) => {
  return (
    <Grid container spacing={2}>
      {/* 姓名 */}
      <Grid item xs={12} sm={6} md={4}>
        <TextField
          required
          fullWidth
          id="name"
          name="name"
          label="姓名"
          value={formData.name}
          onChange={onChange}
          error={!!errors.name}
          helperText={errors.name}
          margin="normal"
        />
      </Grid>
      
      {/* 性別 */}
      <Grid item xs={12} sm={6} md={4}>
        <FormControl 
          required 
          error={!!errors.gender} 
          component="fieldset" 
          margin="normal"
        >
          <FormLabel component="legend">性別</FormLabel>
          <RadioGroup
            row
            name="gender"
            value={formData.gender}
            onChange={onChange}
          >
            <FormControlLabel value="male" control={<Radio />} label="男" />
            <FormControlLabel value="female" control={<Radio />} label="女" />
          </RadioGroup>
          {errors.gender && <FormHelperText>{errors.gender}</FormHelperText>}
        </FormControl>
      </Grid>
      
      {/* 出生年月日 */}
      <Grid item xs={12} sm={6} md={4}>
        <TextField
          required
          fullWidth
          id="birthDate"
          name="birthDate"
          label="出生年月日"
          type="date"
          value={formData.birthDate}
          onChange={onChange}
          error={!!errors.birthDate}
          helperText={errors.birthDate}
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />
      </Grid>
      
      {/* 身分證統一號碼 */}
      <Grid item xs={12} sm={6} md={4}>
        <TextField
          required
          fullWidth
          id="idNumber"
          name="idNumber"
          label="身分證統一號碼"
          value={formData.idNumber}
          onChange={onChange}
          error={!!errors.idNumber}
          helperText={errors.idNumber}
          margin="normal"
        />
      </Grid>
      
      {/* 教育程度 */}
      <Grid item xs={12} sm={6} md={4}>
        <TextField
          fullWidth
          id="education"
          name="education"
          label="教育程度"
          value={formData.education}
          onChange={onChange}
          error={!!errors.education}
          helperText={errors.education}
          margin="normal"
        />
      </Grid>
      
      {/* 籍貫 */}
      <Grid item xs={12} sm={6} md={4}>
        <TextField
          fullWidth
          id="nativePlace"
          name="nativePlace"
          label="籍貫"
          value={formData.nativePlace}
          onChange={onChange}
          error={!!errors.nativePlace}
          helperText={errors.nativePlace}
          margin="normal"
        />
      </Grid>
    </Grid>
  );
};

export default PersonalInfoSection;
