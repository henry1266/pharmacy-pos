import React, { useEffect, useRef, FC, ChangeEvent } from 'react';
import PropTypes from 'prop-types';
import { 
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  Typography
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  Edit as EditIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import ProductCodeLink from '../common/ProductCodeLink';

// 定義項目介面
interface Item {
  _id?: string;
  did: string;
  dname: string;
  dquantity: string | number;
  dtotalCost: string | number;
  [key: string]: any;
}

// 定義組件 props 的介面
interface ProductItemsTableProps {
  items: Item[];
  editingItemIndex: number | null;
  editingItem: Item | null;
  handleEditItem: (index: number) => void;
  handleSaveEditItem: () => void;
  handleCancelEditItem: () => void;
  handleRemoveItem: (index: number) => void;
  handleMoveItem: (index: number, direction: 'up' | 'down') => void;
  handleEditingItemChange: (event: ChangeEvent<HTMLInputElement>) => void;
  totalAmount: number;
  codeField?: string;
}

/**
 * 藥品項目表格組件
 * @param {ProductItemsTableProps} props - 組件屬性
 * @returns {React.ReactElement} 藥品項目表格組件
 */
const ProductItemsTable: FC<ProductItemsTableProps> = ({
  items,
  editingItemIndex,
  editingItem,
  handleEditItem,
  handleSaveEditItem,
  handleCancelEditItem,
  handleRemoveItem,
  handleMoveItem,
  handleEditingItemChange,
  totalAmount,
  codeField
}) => {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (tableContainerRef.current && items.length > 0) {
      setTimeout(() => {
        const scrollHeight = tableContainerRef.current?.scrollHeight ?? 0;
        tableContainerRef.current.scrollTop = scrollHeight;
      }, 100);
    }
  }, [items.length]);
  
  return (
    <TableContainer 
      component={Paper}
      sx={{ 
        maxHeight: '350px', 
        overflow: 'auto' 
      }}
      ref={tableContainerRef}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell align="center" width="60px">序號</TableCell>
            <TableCell>藥品代碼</TableCell>
            <TableCell>藥品名稱</TableCell>
            <TableCell align="right">數量</TableCell>
            <TableCell align="right">總成本</TableCell>
            <TableCell align="right">單價</TableCell>
            <TableCell align="center">操作</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={`item-${item._id ?? index}-${index}`}>
              {editingItemIndex === index && editingItem ? (
                // 編輯模式
                <>
                  <TableCell align="center">
                    <Typography variant="body2">{index + 1}</Typography>
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      value={editingItem.did}
                      disabled
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      value={editingItem.dname}
                      disabled
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      fullWidth
                      size="small"
                      name="dquantity"
                      type="number"
                      value={editingItem.dquantity}
                      onChange={handleEditingItemChange}
                      inputProps={{ min: 0 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      fullWidth
                      size="small"
                      name="dtotalCost"
                      type="number"
                      value={editingItem.dtotalCost}
                      onChange={handleEditingItemChange}
                      inputProps={{ min: 0 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {Number(editingItem.dquantity) > 0 ? (Number(editingItem.dtotalCost) / Number(editingItem.dquantity)).toFixed(2) : '0.00'}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton color="primary" onClick={handleSaveEditItem}>
                      <CheckIcon />
                    </IconButton>
                    <IconButton color="error" onClick={handleCancelEditItem}>
                      <CloseIcon />
                    </IconButton>
                  </TableCell>
                </>
              ) : (
                // 顯示模式
                <>
                  <TableCell align="center">
                    <Typography variant="body2">{index + 1}</Typography>
                  </TableCell>
                  {/* @ts-ignore */}
                  <TableCell><ProductCodeLink product={{ _id: item._id ?? '', code: item.did }} /></TableCell> {/* MODIFIED LINE */}
                  <TableCell>{item.dname}</TableCell>
                  <TableCell align="right">{item.dquantity}</TableCell>
                  <TableCell align="right">{Number(item.dtotalCost).toLocaleString()}</TableCell>
                  <TableCell align="right">
                    {Number(item.dquantity) > 0 ? (Number(item.dtotalCost) / Number(item.dquantity)).toFixed(2) : '0.00'}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <IconButton size="small" onClick={() => handleMoveItem(index, 'up')} disabled={index === 0}>
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleMoveItem(index, 'down')} disabled={index === items.length - 1}>
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleEditItem(index)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleRemoveItem(index)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} align="center">
                尚未添加藥品項目
              </TableCell>
            </TableRow>
          )}
          <TableRow
            sx={{
              position: 'sticky',
              bottom: 0,
              backgroundColor: 'white',
              zIndex: 5,
              borderTop: '2px solid #e0e0e0',
              '& > *': { fontWeight: 'bold' }
            }}
          >
            <TableCell></TableCell>
            <TableCell colSpan={3} align="right">
              <Typography variant="subtitle1">總計：</Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="subtitle1">{totalAmount.toLocaleString()}</Typography>
            </TableCell>
            <TableCell colSpan={2}></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// 新增缺少的 props validation
ProductItemsTable.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      did: PropTypes.string,
      dname: PropTypes.string,
      dquantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      dtotalCost: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    })
  ).isRequired,
  editingItemIndex: PropTypes.number,
  editingItem: PropTypes.shape({
    did: PropTypes.string,
    dname: PropTypes.string,
    dquantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    dtotalCost: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }),
  handleEditItem: PropTypes.func.isRequired,
  handleSaveEditItem: PropTypes.func.isRequired,
  handleCancelEditItem: PropTypes.func.isRequired,
  handleRemoveItem: PropTypes.func.isRequired,
  handleMoveItem: PropTypes.func.isRequired,
  handleEditingItemChange: PropTypes.func.isRequired,
  totalAmount: PropTypes.number.isRequired,
  codeField: PropTypes.string
} as any; // 使用 any 類型來避免 TypeScript 錯誤

export default ProductItemsTable;