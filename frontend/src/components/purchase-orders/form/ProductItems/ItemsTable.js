import React, { useEffect, useRef } from 'react';
import { 
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography
} from '@mui/material';
import ItemActions from './ItemActions';
import ItemForm from './ItemForm';

/**
 * 藥品項目表格組件
 * @param {Object} props - 組件屬性
 * @param {Array} props.items - 藥品項目列表
 * @param {number} props.editingItemIndex - 當前正在編輯的項目索引
 * @param {Object} props.editingItem - 當前正在編輯的項目數據
 * @param {Function} props.onEditItem - 開始編輯項目的函數
 * @param {Function} props.onSaveEditItem - 保存編輯項目的函數
 * @param {Function} props.onCancelEditItem - 取消編輯項目的函數
 * @param {Function} props.onRemoveItem - 刪除項目的函數
 * @param {Function} props.onMoveItem - 移動項目順序的函數
 * @param {Function} props.onEditingItemChange - 處理編輯中項目變更的函數
 * @param {number} props.totalAmount - 總金額
 * @returns {React.ReactElement} 藥品項目表格組件
 */
const ItemsTable = ({
  items,
  editingItemIndex,
  editingItem,
  onEditItem,
  onSaveEditItem,
  onCancelEditItem,
  onRemoveItem,
  onMoveItem,
  onEditingItemChange,
  totalAmount
}) => {
  const tableContainerRef = useRef(null);
  
  // 當項目數量變化時，滾動到底部
  useEffect(() => {
    if (tableContainerRef.current && items.length > 0) {
      // 使用setTimeout確保在DOM更新後執行滾動
      setTimeout(() => {
        const scrollHeight = tableContainerRef.current.scrollHeight;
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
            editingItemIndex === index ? (
              <ItemForm 
                key={index}
                editingItem={editingItem}
                index={index}
                onChange={onEditingItemChange}
                onSave={onSaveEditItem}
                onCancel={onCancelEditItem}
              />
            ) : (
              <TableRow key={index}>
                <TableCell align="center">
                  <Typography variant="body2">{index + 1}</Typography>
                </TableCell>
                <TableCell>{item.did}</TableCell>
                <TableCell>{item.dname}</TableCell>
                <TableCell align="right">{item.dquantity}</TableCell>
                <TableCell align="right">{Number(item.dtotalCost).toLocaleString()}</TableCell>
                <TableCell align="right">
                  {item.dquantity > 0 ? (item.dtotalCost / item.dquantity).toFixed(2) : '0.00'}
                </TableCell>
                <TableCell align="center">
                  <ItemActions 
                    index={index}
                    itemsLength={items.length}
                    onEdit={onEditItem}
                    onDelete={onRemoveItem}
                    onMove={onMoveItem}
                  />
                </TableCell>
              </TableRow>
            )
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} align="center">
                尚未添加藥品項目
              </TableCell>
            </TableRow>
          )}
          {/* 固定的總計欄 */}
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

export default ItemsTable;
