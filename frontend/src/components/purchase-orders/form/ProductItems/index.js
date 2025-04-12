import React from 'react';
import { 
  Typography,
  Card,
  CardContent
} from '@mui/material';
import ItemsTable from './ItemsTable';

/**
 * 藥品項目主組件
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
 * @returns {React.ReactElement} 藥品項目主組件
 */
const ProductItems = ({
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
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          藥品項目
        </Typography>
        
        <ItemsTable 
          items={items}
          editingItemIndex={editingItemIndex}
          editingItem={editingItem}
          onEditItem={onEditItem}
          onSaveEditItem={onSaveEditItem}
          onCancelEditItem={onCancelEditItem}
          onRemoveItem={onRemoveItem}
          onMoveItem={onMoveItem}
          onEditingItemChange={onEditingItemChange}
          totalAmount={totalAmount}
        />
      </CardContent>
    </Card>
  );
};

export default ProductItems;
