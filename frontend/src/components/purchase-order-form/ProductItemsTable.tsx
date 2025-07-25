import React, { useEffect, useRef, FC, ChangeEvent, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Paper,
  IconButton,
  TextField,
  Typography,
  Divider
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
import { DragDropContext, Draggable, DropResult } from 'react-beautiful-dnd';
import { StrictModeDroppable } from '../common/StrictModeDroppable';
import ProductCodeLink from '../common/ProductCodeLink';
import { PackageInventoryDisplay } from '../package-units';
import { ProductPackageUnit } from '@pharmacy-pos/shared/types/package';

// 定義項目介面
interface Item {
  _id?: string;
  did: string;
  dname: string;
  dquantity: string | number;
  dtotalCost: string | number;
  batchNumber?: string;
  packageQuantity?: string | number;
  boxQuantity?: string | number;
  packageUnits?: ProductPackageUnit[];
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
const ProductItemsTable: FC<ProductItemsTableProps> = memo(({
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
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (containerRef.current && items.length > 0) {
      setTimeout(() => {
        const scrollHeight = containerRef.current?.scrollHeight ?? 0;
        containerRef.current.scrollTop = scrollHeight;
      }, 100);
    }
  }, [items.length]);
  
  // 使用 useCallback 穩定拖拽處理函數
  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) {
      return;
    }
    
    if (handleDragEnd && typeof handleDragEnd === 'function') {
      handleDragEnd(result);
    }
  }, [handleDragEnd]);

  // 如果沒有項目，顯示簡化版本（不使用拖拽）
  if (!items || items.length === 0) {
    return (
      <Box sx={{ height: '100%', position: 'relative' }}>
        {/* 固定的表格標題 */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10
          }}
        >
          <Paper sx={{ p: 1 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '80px 110px 1fr 100px 70px 90px 70px 110px',
                gap: 1,
                alignItems: 'center',
                minHeight: '40px',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                pb: 1
              }}
            >
              <Typography variant="subtitle2" align="center">序號</Typography>
              <Typography variant="subtitle2" align="center">藥品代碼</Typography>
              <Typography variant="subtitle2" align="center">藥品名稱</Typography>
              <Typography variant="subtitle2" align="center">批號</Typography>
              <Typography variant="subtitle2" align="center">數量</Typography>
              <Typography variant="subtitle2" align="center">總成本</Typography>
              <Typography variant="subtitle2" align="center">單價</Typography>
              <Typography variant="subtitle2" align="center">操作</Typography>
            </Box>
          </Paper>
        </Box>

        {/* 空狀態內容 */}
        <Box
          sx={{
            position: 'absolute',
            top: '56px',
            bottom: '56px',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              尚未添加藥品項目
            </Typography>
          </Paper>
        </Box>

        {/* 固定的總計欄 */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 10
          }}
        >
          <Paper sx={{ p: 1 }}>
            <Divider sx={{ mb: 1 }} />
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '80px 110px 1fr 100px 70px 90px 70px 110px',
                gap: 1,
                alignItems: 'center',
                minHeight: '40px',
                fontWeight: 'bold'
              }}
            >
              <Box></Box>
              <Box></Box>
              <Typography variant="subtitle1" align="center">總計：</Typography>
              <Box></Box>
              <Box></Box>
              <Typography variant="subtitle1" align="center">
                {totalAmount.toLocaleString()}
              </Typography>
              <Box></Box>
              <Box></Box>
            </Box>
          </Paper>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', position: 'relative' }}>
      {/* 固定的表格標題 */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10
        }}
      >
        <Paper sx={{ p: 1 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '80px 110px 1fr 100px 70px 90px 70px 110px',
              gap: 1,
              alignItems: 'center',
              minHeight: '40px',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              pb: 1
            }}
          >
            <Typography variant="subtitle2" align="center">序號</Typography>
            <Typography variant="subtitle2" align="center">藥品代碼</Typography>
            <Typography variant="subtitle2" align="center">藥品名稱</Typography>
            <Typography variant="subtitle2" align="center">批號</Typography>
            <Typography variant="subtitle2" align="center">數量</Typography>
            <Typography variant="subtitle2" align="center">總成本</Typography>
            <Typography variant="subtitle2" align="center">單價</Typography>
            <Typography variant="subtitle2" align="center">操作</Typography>
          </Box>
        </Paper>
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
        <DragDropContext onDragEnd={onDragEnd}>
          <StrictModeDroppable droppableId="product-items-list">
            {(provided, snapshot) => (
              <Paper
                sx={{
                  height: '100%',
                  p: 1,
                }}
                ref={containerRef}
              >
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={{ minHeight: '100%' }}
                >
                  {items.map((item, index) => (
                    <Draggable
                      key={`item-${index}-${item.did || 'unknown'}`}
                      draggableId={`item-${index}-${item.did || 'unknown'}`}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          style={{
                            ...provided.draggableProps.style,
                            marginBottom: '8px'
                          }}
                        >
                          <Box
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: '80px 110px 1fr 100px 70px 90px 70px 110px',
                              gap: 1,
                              alignItems: 'center',
                              minHeight: '40px',
                              p: 1,
                              border: snapshot.isDragging ? '2px solid #2196f3' : '1px solid #e0e0e0',
                              borderRadius: 1,
                              boxShadow: snapshot.isDragging ? '0 4px 8px rgba(0,0,0,0.2)' : 'none',
                              '&:hover': {
                                backgroundColor: snapshot.isDragging ? '#e3f2fd' : '#fafafa'
                              }
                            }}
                          >
                            {editingItemIndex === index && editingItem ? (
                              // 編輯模式
                              <>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                  <Box {...provided.dragHandleProps} sx={{ display: 'flex', alignItems: 'center', cursor: 'grab' }}>
                                    <DragIndicatorIcon fontSize="small" sx={{ color: '#999' }} />
                                  </Box>
                                  <Typography variant="caption">{index + 1}</Typography>
                                </Box>
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={editingItem.did}
                                  disabled
                                  sx={{ '& .MuiInputBase-root': { height: '32px', textAlign: 'center' } }}
                                />
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={editingItem.dname}
                                  disabled
                                  sx={{ '& .MuiInputBase-root': { height: '32px', textAlign: 'center' } }}
                                />
                                <TextField
                                  fullWidth
                                  size="small"
                                  name="batchNumber"
                                  value={editingItem.batchNumber || ''}
                                  onChange={handleEditingItemChange}
                                  placeholder="批號"
                                  sx={{ '& .MuiInputBase-root': { height: '32px', textAlign: 'center' } }}
                                />
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
                                <Typography variant="caption" align="center">
                                  {Number(editingItem.dquantity) > 0 ? (Number(editingItem.dtotalCost) / Number(editingItem.dquantity)).toFixed(2) : '0.00'}
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
                                  <IconButton size="small" color="primary" onClick={handleSaveEditItem}>
                                    <CheckIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton size="small" color="error" onClick={handleCancelEditItem}>
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </>
                            ) : (
                              // 顯示模式
                              <>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                  <Box {...provided.dragHandleProps} sx={{ display: 'flex', alignItems: 'center', cursor: 'grab' }}>
                                    <DragIndicatorIcon fontSize="small" sx={{ color: '#999' }} />
                                  </Box>
                                  <Typography variant="caption">{index + 1}</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center' }}>
                                  <ProductCodeLink product={{ _id: item._id ?? '', code: item.did }} />
                                </Box>
                                <Typography variant="body2" sx={{ fontSize: '1rem' }} align="center">
                                  {item.dname}
                                </Typography>
                                <Typography variant="body2" sx={{ fontSize: '0.9rem' }} align="center">
                                  {item.batchNumber || '-'}
                                </Typography>
                                <Box sx={{ textAlign: 'center' }}>
                                  {item.packageUnits && item.packageUnits.length > 0 ? (
                                    <PackageInventoryDisplay
                                      packageUnits={item.packageUnits}
                                      totalQuantity={Number(item.dquantity)}
                                      baseUnitName={item.unit}
                                      variant="compact"
                                    />
                                  ) : (
                                    <Typography variant="body2" sx={{ fontSize: '1rem' }}>
                                      {item.dquantity}
                                    </Typography>
                                  )}
                                </Box>
                                <Typography variant="body2" sx={{ fontSize: '1rem' }} align="center">
                                  {Number(item.dtotalCost).toLocaleString()}
                                </Typography>
                                <Typography variant="body2" sx={{ fontSize: '1rem' }} align="center">
                                  {Number(item.dquantity) > 0 ? (Number(item.dtotalCost) / Number(item.dquantity)).toFixed(2) : '0.00'}
                                </Typography>
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
                              </>
                            )}
                          </Box>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </Paper>
            )}
          </StrictModeDroppable>
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
        <Paper sx={{ p: 1 }}>
          <Divider sx={{ mb: 1 }} />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '80px 110px 1fr 100px 70px 90px 70px 110px',
              gap: 1,
              alignItems: 'center',
              minHeight: '40px',
              fontWeight: 'bold'
            }}
          >
            <Box></Box>
            <Box></Box>
            <Typography variant="subtitle1" align="center">總計：</Typography>
            <Box></Box>
            <Box></Box>
            <Typography variant="subtitle1" align="center">
              {totalAmount.toLocaleString()}
            </Typography>
            <Box></Box>
            <Box></Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
});

// 設置 displayName 以便於調試
ProductItemsTable.displayName = 'ProductItemsTable';

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