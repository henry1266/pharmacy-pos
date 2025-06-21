import React, { useEffect, useRef, FC } from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableBody,
  TableContainer,
  TableHead,
  Paper
} from '@mui/material';
import PriceSummary from '../../../common/PriceSummary';
import {
  ItemsTableProps,
  EditableRow,
  DisplayRow,
  EmptyState,
  TableHeaderRow,
  TABLE_CONFIG
} from '../../shared';

/**
 * 藥品項目表格組件
 * @param {ItemsTableProps} props - 組件屬性
 * @returns {React.ReactElement} 藥品項目表格組件
 */
const ItemsTable: FC<ItemsTableProps> = ({
  items,
  editingItemIndex,
  editingItem,
  handleEditItem,
  handleSaveEditItem,
  handleCancelEditItem,
  handleRemoveItem,
  handleMoveItem,
  handleEditingItemChange,
  totalAmount
}) => {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  
  // 當項目數量變化時，滾動到底部
  useEffect(() => {
    if (tableContainerRef.current && items.length > 0) {
      // 使用setTimeout確保在DOM更新後執行滾動
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
        maxHeight: TABLE_CONFIG.maxHeight,
        overflow: 'auto'
      }}
      ref={tableContainerRef}
    >
      <Table>
        <TableHead>
          <TableHeaderRow />
        </TableHead>
        <TableBody>
          {items.map((item, index) => (
            <tr key={item.did ?? index}>
              {editingItemIndex === index && editingItem ? (
                <EditableRow
                  item={item}
                  index={index}
                  editingItem={editingItem}
                  handleEditingItemChange={handleEditingItemChange}
                  handleSaveEditItem={handleSaveEditItem}
                  handleCancelEditItem={handleCancelEditItem}
                />
              ) : (
                <DisplayRow
                  item={item}
                  index={index}
                  handleEditItem={handleEditItem}
                  handleRemoveItem={handleRemoveItem}
                  handleMoveItem={handleMoveItem}
                  isFirst={index === 0}
                  isLast={index === items.length - 1}
                />
              )}
            </tr>
          ))}
          {items.length === 0 && (
            <EmptyState message="尚未添加藥品項目" colSpan={7} />
          )}
          {/* 使用通用價格加總元件 */}
          <PriceSummary
            totalAmount={totalAmount}
            colSpan={3}
            totalColumns={7}
          />
        </TableBody>
      </Table>
    </TableContainer>
  );
};

ItemsTable.propTypes = {
  items: PropTypes.array.isRequired,
  editingItemIndex: PropTypes.number,
  editingItem: PropTypes.object,
  handleEditItem: PropTypes.func.isRequired,
  handleSaveEditItem: PropTypes.func.isRequired,
  handleCancelEditItem: PropTypes.func.isRequired,
  handleRemoveItem: PropTypes.func.isRequired,
  handleMoveItem: PropTypes.func.isRequired,
  handleEditingItemChange: PropTypes.func.isRequired,
  totalAmount: PropTypes.number.isRequired
} as any;

export default ItemsTable;