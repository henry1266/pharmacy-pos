import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Help as HelpIcon,
  Close as CloseIcon
} from '@mui/icons-material';

interface WildcardSearchHelpProps {
  /**
   * 是否顯示為圖示按鈕（預設為 true）
   */
  iconButton?: boolean;
  /**
   * 按鈕文字（當 iconButton 為 false 時使用）
   */
  buttonText?: string;
  /**
   * 按鈕大小
   */
  size?: 'small' | 'medium' | 'large';
}

const WildcardSearchHelp: React.FC<WildcardSearchHelpProps> = ({
  iconButton = true,
  buttonText = '萬用字元說明',
  size = 'small'
}) => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // 萬用字元規則資料
  const wildcardRules = [
    {
      symbol: '*',
      description: '匹配任意長度的字串（包含空字串）',
      examples: [
        { pattern: 'A*', matches: 'A001, A123, ABCD', notMatches: 'B001' },
        { pattern: '*001', matches: 'A001, B001, XYZ001', notMatches: 'A002' },
        { pattern: 'A*B', matches: 'AB, A123B, AXYZB', notMatches: 'A123C' },
        { pattern: 'j*', matches: 'j1, j3, j123, jABC', notMatches: 'k1, i3' }
      ]
    },
    {
      symbol: '?',
      description: '匹配單一字元',
      examples: [
        { pattern: 'A?01', matches: 'A001, A101, AB01', notMatches: 'A0001, A01' },
        { pattern: '??01', matches: 'A001, AB01, 1201', notMatches: 'A01, ABC01' },
        { pattern: 'j?', matches: 'j1, j3, jA, j9', notMatches: 'j12, k1' },
        { pattern: 'j??', matches: 'j12, j3A, jXY', notMatches: 'j1, j' }
      ]
    },
    {
      symbol: '[...]',
      description: '匹配方括號內的任一字元（字元類別）',
      examples: [
        { pattern: 'j[1-9]', matches: 'j1, j3, j9', notMatches: 'j0, jA, j12' },
        { pattern: '[A-Z]001', matches: 'A001, B001, Z001', notMatches: 'a001, 1001' },
        { pattern: 'j[135]', matches: 'j1, j3, j5', notMatches: 'j2, j4, j6' },
        { pattern: '[a-z][0-9]', matches: 'a1, b2, z9', notMatches: 'A1, 12, ab' }
      ]
    }
  ];

  // 搜尋欄位說明
  const searchFields = [
    { field: '銷貨單號', description: '搜尋銷售記錄的單號' },
    { field: '客戶名稱', description: '搜尋客戶姓名' },
    { field: '商品名稱', description: '搜尋銷售項目中的商品名稱' },
    { field: '備註', description: '搜尋銷售記錄的備註內容' }
  ];

  const TriggerButton = iconButton ? (
    <Tooltip title="萬用字元搜尋說明">
      <IconButton
        size={size}
        onClick={handleOpen}
        sx={{
          color: 'text.secondary',
          '&:hover': {
            color: 'primary.main'
          }
        }}
      >
        <HelpIcon fontSize={size} />
      </IconButton>
    </Tooltip>
  ) : (
    <Button
      size={size}
      variant="outlined"
      startIcon={<HelpIcon />}
      onClick={handleOpen}
      sx={{ flexShrink: 0 }}
    >
      {buttonText}
    </Button>
  );

  return (
    <>
      {TriggerButton}
      
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { maxHeight: '80vh' }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1
        }}>
          <Typography variant="h6" component="div">
            萬用字元搜尋說明
          </Typography>
          <IconButton
            size="small"
            onClick={handleClose}
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers>
          {/* 概述 */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" paragraph>
              萬用字元搜尋讓您可以使用特殊符號來進行更靈活的搜尋。
              系統會在以下欄位中搜尋符合條件的記錄：
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {searchFields.map((field) => (
                <Tooltip key={field.field} title={field.description}>
                  <Chip
                    label={field.field}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                </Tooltip>
              ))}
            </Box>
          </Box>

          {/* 萬用字元規則表格 */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              萬用字元規則
            </Typography>
            
            {wildcardRules.map((rule) => (
              <Box key={rule.symbol} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Chip
                    label={rule.symbol}
                    color="secondary"
                    sx={{ 
                      fontFamily: 'monospace', 
                      fontWeight: 'bold',
                      mr: 2,
                      minWidth: '40px'
                    }}
                  />
                  <Typography variant="body1">
                    {rule.description}
                  </Typography>
                </Box>
                
                <TableContainer component={Paper} variant="outlined" sx={{ ml: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>搜尋模式</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>符合範例</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>不符合範例</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rule.examples.map((example, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{ 
                                fontFamily: 'monospace',
                                backgroundColor: 'grey.100',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                display: 'inline-block'
                              }}
                            >
                              {example.pattern}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="success.main">
                              {example.matches}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="error.main">
                              {example.notMatches}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ))}
          </Box>

          {/* 使用提示 */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              使用提示
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2" paragraph>
                萬用字元搜尋不區分大小寫
              </Typography>
              <Typography component="li" variant="body2" paragraph>
                可以組合使用多個萬用字元，例如：<code>A*?01</code>
              </Typography>
              <Typography component="li" variant="body2" paragraph>
                如果要搜尋實際的 * 或 ? 字元，請使用反斜線跳脫：<code>\*</code> 或 <code>\?</code>
              </Typography>
              <Typography component="li" variant="body2" paragraph>
                搜尋會同時在多個欄位中進行，只要任一欄位符合就會顯示該記錄
              </Typography>
            </Box>
          </Box>

          {/* 常見搜尋範例 */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              常見搜尋範例
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>搜尋需求</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>搜尋模式</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>說明</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>搜尋 j1, j3 等特定組合</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', backgroundColor: 'grey.100', px: 1, py: 0.5, borderRadius: 1, display: 'inline-block' }}>
                        j1
                      </Typography>
                      {' 或 '}
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', backgroundColor: 'grey.100', px: 1, py: 0.5, borderRadius: 1, display: 'inline-block' }}>
                        j3
                      </Typography>
                    </TableCell>
                    <TableCell>直接輸入完整字串</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>搜尋 j 後面跟一個字元</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', backgroundColor: 'grey.100', px: 1, py: 0.5, borderRadius: 1, display: 'inline-block' }}>
                        j?
                      </Typography>
                    </TableCell>
                    <TableCell>匹配 j1, j3, jA, j9 等</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>搜尋 j 後面跟任意字元</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', backgroundColor: 'grey.100', px: 1, py: 0.5, borderRadius: 1, display: 'inline-block' }}>
                        j*
                      </Typography>
                    </TableCell>
                    <TableCell>匹配 j1, j3, j123, jABC 等</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>搜尋 j 後面跟兩個字元</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', backgroundColor: 'grey.100', px: 1, py: 0.5, borderRadius: 1, display: 'inline-block' }}>
                        j??
                      </Typography>
                    </TableCell>
                    <TableCell>匹配 j12, j3A, jXY 等</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>搜尋 j 後面跟 1-9 數字</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', backgroundColor: 'grey.100', px: 1, py: 0.5, borderRadius: 1, display: 'inline-block' }}>
                        j[1-9]
                      </Typography>
                    </TableCell>
                    <TableCell>匹配 j1, j3, j9，不匹配 j0, jA</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>搜尋 j 後面跟特定數字</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', backgroundColor: 'grey.100', px: 1, py: 0.5, borderRadius: 1, display: 'inline-block' }}>
                        j[135]
                      </Typography>
                    </TableCell>
                    <TableCell>匹配 j1, j3, j5，不匹配 j2, j4</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>搜尋字母+數字組合</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', backgroundColor: 'grey.100', px: 1, py: 0.5, borderRadius: 1, display: 'inline-block' }}>
                        [a-z][0-9]
                      </Typography>
                    </TableCell>
                    <TableCell>匹配 a1, b2, z9 等</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>搜尋以數字結尾的記錄</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', backgroundColor: 'grey.100', px: 1, py: 0.5, borderRadius: 1, display: 'inline-block' }}>
                        *[1-9]
                      </Typography>
                    </TableCell>
                    <TableCell>匹配 A001, j1, XYZ3 等</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} variant="contained">
            了解
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default WildcardSearchHelp;