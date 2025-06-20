import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Button,
  Divider
} from '@mui/material';
// Placeholder for a color picker component (we might need to install one)
// import { SketchPicker } from 'react-color'; 

// Placeholder for theme context if we use one
// import { ThemeContext } from '../context/ThemeContext';

const SettingsPage: React.FC = () => {
  // Placeholder states for selected colors
  const [primaryColor] = useState<string>('#1976d2'); // Default MUI blue
  const [secondaryColor] = useState<string>('#dc004e'); // Default MUI pink

  // Placeholder handler for saving settings
  const handleSaveSettings = (): void => {
    console.log('Saving colors:', { primary: primaryColor, secondary: secondaryColor });

    alert('設定已儲存（功能待實現）');
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>系統配色設定</Typography>
        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>選擇主題顏色</Typography>
        <Grid container spacing={3}>
          <Grid {...{ item: true, xs: 12, sm: 6 } as any}>
            <Typography gutterBottom>主要顏色 (Primary)</Typography>
            {/* Placeholder for Color Picker */}
            <Box sx={{ width: 50, height: 50, bgcolor: primaryColor, border: '1px solid grey', mb: 1 }} />
            {/* <SketchPicker color={primaryColor} onChangeComplete={(color) => setPrimaryColor(color.hex)} /> */}
            <Typography variant="caption">點擊方塊或使用調色盤選擇 (調色盤待實現)</Typography>
          </Grid>
          <Grid {...{ item: true, xs: 12, sm: 6 } as any}>
            <Typography gutterBottom>次要顏色 (Secondary)</Typography>
            {/* Placeholder for Color Picker */}
            <Box sx={{ width: 50, height: 50, bgcolor: secondaryColor, border: '1px solid grey', mb: 1 }} />
            {/* <SketchPicker color={secondaryColor} onChangeComplete={(color) => setSecondaryColor(color.hex)} /> */}
            <Typography variant="caption">點擊方塊或使用調色盤選擇 (調色盤待實現)</Typography>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={handleSaveSettings}>
            儲存設定
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default SettingsPage;