import React from 'react';
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

const SalesItemsTable = ({
  items,
  inputModes,
  onQuantityChange,
  onPriceChange,
  onRemoveItem,
  onToggleInputMode,
  onSubtotalChange,
  totalAmount,
  discount
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table sx={{ minWidth: isMobile ? 300 : 650 }} aria-label="銷售項目表格">
        <TableHead>
          <TableRow>
            <TableCell sx={{ pl: isMobile ? 1 : 2, pr: isMobile ? 0 : 1 }}>產品名稱</TableCell>
            {!isMobile && <TableCell align="right" sx={{ px: 1 }}>代碼</TableCell>}
            <TableCell align="right" sx={{ px: 1 }}>數量</TableCell>
            <TableCell align="right" sx={{ px: 1 }}>單價/小計</TableCell>
            <TableCell align="center" sx={{ px: 1 }}>操作</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isMobile ? 4 : 5} align="center">
                <Typography color="textSecondary">尚未添加任何項目</Typography>
              </TableCell>
            </TableRow>
          ) : (
            items.map((item, index) => (
              <TableRow key={item.product + index}> {/* Use index as part of key if product ID might repeat before save */}
                <TableCell component="th" scope="row" sx={{ pl: isMobile ? 1 : 2, pr: isMobile ? 0 : 1 }}>
                  {item.name}
                </TableCell>
                {!isMobile && <TableCell align="right" sx={{ px: 1 }}>{item.code}</TableCell>}
                <TableCell align="right" sx={{ px: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <IconButton size="small" onClick={() => onQuantityChange(index, item.quantity - 1)} disabled={item.quantity <= 1}>
                      <RemoveIcon fontSize="inherit" />
                    </IconButton>
                    <TextField
                      type="number"
                      value={item.quantity}
                      onChange={(e) => onQuantityChange(index, parseInt(e.target.value, 10) || 1)}
                      size="small"
                      sx={{ width: '60px', mx: 0.5, "& input": { textAlign: "center" } }}
                      inputProps={{ min: 1, style: { textAlign: 'center' } }}
                    />
                    <IconButton size="small" onClick={() => onQuantityChange(index, item.quantity + 1)}>
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
                        inputProps={{ min: 0, step: "0.01" }}
                      />
                    ) : (
                      <TextField
                        type="number"
                        label="小計"
                        value={item.subtotal}
                        onChange={(e) => onSubtotalChange(index, parseFloat(e.target.value) || 0)}
                        size="small"
                        sx={{ width: '90px' }}
                        inputProps={{ min: 0, step: "0.01" }}
                      />
                    )}
                    <IconButton size="small" onClick={() => onToggleInputMode(index)} sx={{ ml: 0.5 }} title={inputModes[index] === 'price' ? "切換為輸入小計" : "切換為輸入單價"}>
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
          {/* Summary Row */}
          <TableRow>
            <TableCell colSpan={isMobile ? 1 : 2} />
            <TableCell align="right"><Typography variant="subtitle1">折扣:</Typography></TableCell>
            <TableCell align="right" colSpan={isMobile ? 1 : 2}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                ${discount?.toFixed(2) || '0.00'}
              </Typography>
            </TableCell>
          </TableRow>
          <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
            <TableCell colSpan={isMobile ? 1 : 2} />
            <TableCell align="right"><Typography variant="h6">總計:</Typography></TableCell>
            <TableCell align="right" colSpan={isMobile ? 1 : 2}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                ${totalAmount?.toFixed(2) || '0.00'}
              </Typography>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SalesItemsTable;

