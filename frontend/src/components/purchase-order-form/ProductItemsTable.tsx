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
  Close as CloseIcon,
  DragIndicator as DragIndicatorIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
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
  handleDragEnd: (result: DropResult) => void;
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
  handleDragEnd,
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
    <Box sx={{ height: '100%', position: 'relative' }}>
      {/* 固定的表格標題 */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          backgroundColor: 'white'
        }}
      >
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& > *': { padding: '6px 12px' } }}>
                <TableCell align="center" sx={{ width: '80px', minWidth: '80px', maxWidth: '80px' }}>序號</TableCell>
                <TableCell align="center" sx={{ width: '110px', minWidth: '110px', maxWidth: '110px' }}>藥品代碼</TableCell>
                <TableCell align="center" sx={{ width: 'auto', minWidth: '180px' }}>藥品名稱</TableCell>
                <TableCell align="center" sx={{ width: '70px', minWidth: '70px', maxWidth: '70px' }}>數量</TableCell>
                <TableCell align="center" sx={{ width: '90px', minWidth: '90px', maxWidth: '90px' }}>總成本</TableCell>
                <TableCell align="center" sx={{ width: '70px', minWidth: '70px', maxWidth: '70px' }}>單價</TableCell>
                <TableCell align="center" sx={{ width: '110px', minWidth: '110px', maxWidth: '110px' }}>操作</TableCell>
              </TableRow>
            </TableHead>
          </Table>
        </TableContainer>
      </Box>

      {/* 可滾動的表格內容 */}
      <Box
        sx={{
          position: 'absolute',
          top: '56px', // 標題高度
          bottom: '56px', // 總計高度
          left: 0,
          right: 0,
          overflow: 'auto'
        }}
      >
        <DragDropContext onDragEnd={handleDragEnd}>
          <TableContainer
            component={Paper}
            sx={{ height: '100%' }}
            ref={tableContainerRef}
          >
            <Table size="small">
              <Droppable droppableId="items-table">
                {(provided) => (
                  <TableBody {...provided.droppableProps} ref={provided.innerRef}>
                    {items.map((item, index) => (
                      <Draggable
                        key={`item-${item._id ?? index}-${index}`}
                        draggableId={`item-${item._id ?? index}-${index}`}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <TableRow
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            sx={{
                              '& > *': {
                                padding: '4px 12px',
                                fontSize: '1rem'
                              },
                              height: '40px',
                              backgroundColor: snapshot.isDragging ? '#f5f5f5' : 'inherit',
                              '&:hover': {
                                backgroundColor: snapshot.isDragging ? '#f5f5f5' : '#fafafa'
                              }
                            }}
                          >
                {editingItemIndex === index && editingItem ? (
                  // 編輯模式
                  <>
                            <TableCell align="center" sx={{ width: '80px', minWidth: '80px', maxWidth: '80px' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                <Box {...provided.dragHandleProps} sx={{ display: 'flex', alignItems: 'center', cursor: 'grab' }}>
                                  <DragIndicatorIcon fontSize="small" sx={{ color: '#999' }} />
                                </Box>
                                <Typography variant="caption">{index + 1}</Typography>
                              </Box>
                            </TableCell>
                    <TableCell align="center" sx={{ width: '110px', minWidth: '110px', maxWidth: '110px' }}>
                      <TextField
                        fullWidth
                        size="small"
                        value={editingItem.did}
                        disabled
                        sx={{ '& .MuiInputBase-root': { height: '32px', textAlign: 'center' } }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ width: 'auto', minWidth: '180px' }}>
                      <TextField
                        fullWidth
                        size="small"
                        value={editingItem.dname}
                        disabled
                        sx={{ '& .MuiInputBase-root': { height: '32px', textAlign: 'center' } }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ width: '70px', minWidth: '70px', maxWidth: '70px' }}>
                      <TextField
                        fullWidth
                        size="small"
                        name="dquantity"
                        type="number"
                        value={editingItem.dquantity}
                        onChange={handleEditingItemChange}
                        inputProps={{ min: 0 }}
                        sx={{ '& .MuiInputBase-root': { height: '32px', textAlign: 'center' } }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ width: '90px', minWidth: '90px', maxWidth: '90px' }}>
                      <TextField
                        fullWidth
                        size="small"
                        name="dtotalCost"
                        type="number"
                        value={editingItem.dtotalCost}
                        onChange={handleEditingItemChange}
                        inputProps={{ min: 0 }}
                        sx={{ '& .MuiInputBase-root': { height: '32px', textAlign: 'center' } }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ width: '70px', minWidth: '70px', maxWidth: '70px' }}>
                      <Typography variant="caption">
                        {Number(editingItem.dquantity) > 0 ? (Number(editingItem.dtotalCost) / Number(editingItem.dquantity)).toFixed(2) : '0.00'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ width: '110px', minWidth: '110px', maxWidth: '110px' }}>
                      <IconButton size="small" color="primary" onClick={handleSaveEditItem}>
                        <CheckIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={handleCancelEditItem}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </>
                ) : (
                  // 顯示模式
                  <>
                    <TableCell align="center" sx={{ width: '80px', minWidth: '80px', maxWidth: '80px' }}>
                      <Typography variant="caption">{index + 1}</Typography>
                    </TableCell>
                    {/* @ts-ignore */}
                    <TableCell align="center" sx={{ width: '110px', minWidth: '110px', maxWidth: '110px' }}>
                      <ProductCodeLink product={{ _id: item._id ?? '', code: item.did }} />
                    </TableCell>
                    <TableCell align="center" sx={{ width: 'auto', minWidth: '180px' }}>
                      <Typography variant="body2" sx={{ fontSize: '1rem' }}>
                        {item.dname}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ width: '70px', minWidth: '70px', maxWidth: '70px' }}>
                      <Typography variant="body2" sx={{ fontSize: '1rem' }}>{item.dquantity}</Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ width: '90px', minWidth: '90px', maxWidth: '90px' }}>
                      <Typography variant="body2" sx={{ fontSize: '1rem' }}>{Number(item.dtotalCost).toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ width: '70px', minWidth: '70px', maxWidth: '70px' }}>
                      <Typography variant="body2" sx={{ fontSize: '1rem' }}>
                        {Number(item.dquantity) > 0 ? (Number(item.dtotalCost) / Number(item.dquantity)).toFixed(2) : '0.00'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ width: '110px', minWidth: '110px', maxWidth: '110px' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
                        <IconButton size="small" onClick={() => handleMoveItem(index, 'up')} disabled={index === 0} sx={{ padding: '2px' }}>
                          <ArrowUpwardIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleMoveItem(index, 'down')} disabled={index === items.length - 1} sx={{ padding: '2px' }}>
                          <ArrowDownwardIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleEditItem(index)} sx={{ padding: '2px' }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleRemoveItem(index)} sx={{ padding: '2px' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </>
                            )}
                          </TableRow>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          尚未添加藥品項目
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                )}
              </Droppable>
            </Table>
          </TableContainer>
        </DragDropContext>
      </Box>

      {/* 固定的總計欄 */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          backgroundColor: 'white'
        }}
      >
        <TableContainer component={Paper}>
          <Table size="small">
            <TableBody>
              <TableRow
                sx={{
                  borderTop: '2px solid #e0e0e0',
                  '& > *': {
                    fontWeight: 'bold',
                    padding: '6px 12px'
                  },
                  height: '48px'
                }}
              >
                <TableCell sx={{ width: '80px', minWidth: '80px', maxWidth: '80px' }}></TableCell>
                <TableCell colSpan={3} align="center">
                  <Typography variant="subtitle1">總計：</Typography>
                </TableCell>
                <TableCell align="center" sx={{ width: '90px', minWidth: '90px', maxWidth: '90px' }}>
                  <Typography variant="subtitle1">{totalAmount.toLocaleString()}</Typography>
                </TableCell>
                <TableCell colSpan={2}></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
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
  handleDragEnd: PropTypes.func.isRequired,
  totalAmount: PropTypes.number.isRequired,
  codeField: PropTypes.string
} as any; // 使用 any 類型來避免 TypeScript 錯誤

export default ProductItemsTable;