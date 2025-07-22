import React, { useEffect, useRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  Typography,
  Box,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  SyncAlt as SyncAltIcon // Icon for toggling input mode
} from '@mui/icons-material';

// 定義銷售項目的型別
interface SalesItem {
  product: string;
  name: string;
  code: string;
  price: number | string;
  quantity: number | string;
  subtotal: number;
  packageName?: string; // 套餐名稱（如果來自套餐）
}

interface SalesItemsTableProps {
  items: SalesItem[];
  inputModes: string[];
  onQuantityChange: (index: number, quantity: number | string) => void;
  onPriceChange: (index: number, price: number) => void;
  onRemoveItem: (index: number) => void;
  onToggleInputMode: (index: number) => void;
  onSubtotalChange: (index: number, subtotal: number) => void;
  totalAmount?: number;
  discount?: number | string;
  onQuantityInputComplete?: () => void;
}

const SalesItemsTable: React.FC<SalesItemsTableProps> = ({
  items,
  inputModes,
  onQuantityChange,
  onPriceChange,
  onRemoveItem,
  onToggleInputMode,
  onSubtotalChange,
  totalAmount,
  discount,
  onQuantityInputComplete // New prop for focus management
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // 當商品項目增加時，自動滾動到底部
  useEffect(() => {
    if (tableContainerRef.current && items.length > 0) {
      const container = tableContainerRef.current;
      // 延遲滾動確保DOM更新完成
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 100);
    }
  }, [items.length]);

  return (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      mt: 2
    }}>
      <TableContainer
        ref={tableContainerRef}
        component={Paper}
        sx={{
          flex: 1,
          overflow: 'auto',
          // 智能滾輪：只有在需要時才顯示
          '&::-webkit-scrollbar': {
            width: '6px'
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent'
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '3px',
            '&:hover': {
              background: 'rgba(0,0,0,0.4)'
            }
          },
          // Firefox 滾輪樣式
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0,0,0,0.2) transparent',
          // 當內容不超出時，滾輪會自動隱藏
          overflowY: items.length > 8 ? 'scroll' : 'auto' // 超過8個項目才強制顯示滾輪
        }}
      >
        <Table
          sx={{
            minWidth: isMobile ? 300 : 650,
            '& .MuiTableCell-root': {
              borderBottom: '1px solid rgba(224, 224, 224, 1)'
            }
          }}
          aria-label="銷售項目表格"
          stickyHeader
        >
        <TableHead>
          <TableRow>
            <TableCell sx={{ px: 1, width: '60px' }} align="center">序號</TableCell>
            <TableCell sx={{ pl: isMobile ? 1 : 2, pr: isMobile ? 0 : 1 }}>產品名稱</TableCell>
            {!isMobile && <TableCell align="right" sx={{ px: 1 }}>代碼</TableCell>}
            <TableCell align="center" sx={{ px: 1, width: isMobile ? 'auto' : '150px' }}>數量</TableCell>
            <TableCell align="right" sx={{ px: 1 }}>單價/小計</TableCell>
            <TableCell align="center" sx={{ px: 1 }}>操作</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isMobile ? 5 : 6} align="center">
                <Typography color="textSecondary">尚未添加任何項目</Typography>
              </TableCell>
            </TableRow>
          ) : (
            items.map((item, index) => (
              <TableRow key={item.product + index}>
                <TableCell align="center" sx={{ px: 1, fontWeight: 'bold', color: 'primary.main' }}>
                  {index + 1}
                </TableCell>
                <TableCell component="th" scope="row" sx={{ pl: isMobile ? 1 : 2, pr: isMobile ? 0 : 1 }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {item.name}
                    </Typography>
                    {item.packageName && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontSize: '0.75rem',
                          fontStyle: 'italic',
                          display: 'block',
                          mt: 0.25
                        }}
                      >
                        來自套餐: {item.packageName}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                {!isMobile && <TableCell align="right" sx={{ px: 1 }}>{item.code}</TableCell>}
                <TableCell align="right" sx={{ px: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}> {/* Centered content */}
                    <IconButton 
                      size="small" 
                      onClick={() => onQuantityChange(index, Number(item.quantity) - 1)} 
                      disabled={Number(item.quantity) <= 1}
                    >
                      <RemoveIcon fontSize="inherit" />
                    </IconButton>
                    <TextField
                      type="number"
                      value={item.quantity}
                      onClick={(e) => {
                        // 點擊時選中全部文字，方便直接輸入新數量
                        (e.target as HTMLInputElement).select();
                      }}
                      onChange={(e) => {
                        const newQuantityStr = e.target.value;
                        // 只允許數字輸入，避免非法字符
                        if (newQuantityStr === '') {
                            onQuantityChange(index, ''); // 允許暫時為空
                        } else if (/^\d+$/.test(newQuantityStr)) {
                            const newQuantity = parseInt(newQuantityStr, 10);
                            if (newQuantity >= 1) {
                                onQuantityChange(index, newQuantity);
                            }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault(); // 防止表單提交
                          // 確保數量有效
                          if (item.quantity === '' || isNaN(parseInt(String(item.quantity))) || parseInt(String(item.quantity)) < 1) {
                            onQuantityChange(index, 1); // 無效時重置為 1
                          }
                          // 完成輸入，返回到條碼輸入框
                          (e.target as HTMLInputElement).blur();
                          setTimeout(() => {
                            // 使用可選鏈運算符替代條件判斷
                            onQuantityInputComplete?.();
                          }, 50); // 短暫延遲確保狀態更新
                        }
                      }}
                      onBlur={(e) => {
                        // 失去焦點時確保數量有效
                        if (item.quantity === '' || isNaN(parseInt(String(item.quantity))) || parseInt(String(item.quantity)) < 1) {
                          onQuantityChange(index, 1); // 無效時重置為 1
                        }
                        // 使用 setTimeout 確保狀態更新後再切換焦點
                        setTimeout(() => {
                          // 使用可選鏈運算符替代條件判斷
                          onQuantityInputComplete?.();
                        }, 50);
                      }}
                      size="small"
                      sx={{ width: '80px', mx: 0.5, "& input": { textAlign: "center" } }} // Increased width
                      inputProps={{ min: 1, style: { textAlign: 'center' } }}
                    />
                    <IconButton 
                      size="small" 
                      onClick={() => onQuantityChange(index, Number(item.quantity) + 1)}
                    >
                      <AddIcon fontSize="inherit" />
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell align="right" sx={{ px: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    {inputModes[index] === 'price' ? (
                      <TextField
                        type="number"
                        label="單價"
                        value={item.price}
                        onChange={(e) => onPriceChange(index, parseFloat(e.target.value) || 0)}
                        size="small"
                        sx={{ width: '90px' }}
                        inputProps={{ min: 0, step: "1" }}
                      />
                    ) : (
                      <TextField
                        type="number"
                        label="小計"
                        value={item.subtotal}
                        onChange={(e) => onSubtotalChange(index, parseFloat(e.target.value) || 0)}
                        size="small"
                        sx={{ width: '90px' }}
                        inputProps={{ min: 0, step: "1" }}
                      />
                    )}
                    <IconButton 
                      size="small" 
                      onClick={() => onToggleInputMode(index)} 
                      sx={{ ml: 0.5 }} 
                      title={inputModes[index] === 'price' ? "切換為輸入小計" : "切換為輸入單價"}
                    >
                      <SyncAltIcon fontSize="inherit" />
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell align="center" sx={{ px: 1 }}>
                  <IconButton color="error" onClick={() => onRemoveItem(index)} size="small">
                    <DeleteIcon fontSize="inherit" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
    
    {/* 固定在底部的總計欄位 */}
    <Paper sx={{
      mt: {
        xs: 0.5,         // 小手機：減少上方間距
        sm: 1,        // 平板：大幅減少上方間距
        md: 1,         // 平板橫向：減少上方間距
        lg: 1          // 桌面：減少上方間距
      },
      p: {
        xs: 1.5,         // 小手機
        sm: 1,           // 平板：大幅減少內距
        md: 1.25,        // 平板橫向：大幅減少內距
        lg: 1.5           // 桌面
      },
      backgroundColor: 'grey.50',
      borderTop: '2px solid',
      borderColor: 'primary.main'
    }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: {
          xs: 1,           // 小手機
          sm: 1,           // 平板：減少間距
          md: 1.5,         // 平板橫向：減少間距
          lg: 1.5            // 桌面
        }
      }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 'bold',
            fontSize: {
              xs: '1.1rem',    // 小手機
              sm: '1.15rem',   // 平板：稍微縮小
              md: '1.2rem',    // 平板橫向：稍微縮小
              lg: '1.25rem'    // 桌面
            }
          }}
        >
          總計:
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 'bold',
              color: 'primary.main',
              fontSize: {
                xs: '1.5rem',    // 小手機
                sm: '1.6rem',    // 平板：稍微縮小
                md: '1.7rem',    // 平板橫向：稍微縮小
                lg: '1.75rem'    // 桌面
              }
            }}
          >
            ${totalAmount?.toFixed(2) ?? '0.0'}
          </Typography>
          {/* 只有在有折扣且折扣大於0時才顯示折扣信息 */}
          {discount != null && discount !== '' && Number(discount) > 0 && (
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontSize: {
                  xs: '0.7rem',    // 小手機
                  sm: '0.7rem',    // 平板：稍微縮小
                  md: '0.75rem',   // 平板橫向：稍微縮小
                  lg: '0.75rem'    // 桌面
                },
                mt: -0.5 // 減少上方間距
              }}
            >
              (折扣: ${Number(discount).toFixed(2)})
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  </Box>
  );
};

export default SalesItemsTable;