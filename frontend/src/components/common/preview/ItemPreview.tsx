import React from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  CircularProgress,
  Divider
} from '@mui/material';

/**
 * 列定義介面
 */
interface Column {
  key?: string;
  label?: string;
  align?: 'left' | 'center' | 'right';
  render?: (item: any) => React.ReactNode;
}

/**
 * 數據項目介面
 */
interface DataItem {
  id?: string | number;
  did?: string | number;
  dname?: string;
  name?: string;
  dquantity?: number;
  quantity?: number;
  dtotalCost?: number;
  totalCost?: number;
  [key: string]: any;
}

/**
 * 數據介面
 */
interface PreviewData {
  totalAmount?: number;
  [key: string]: any;
}

/**
 * 容器屬性介面
 */
interface ContainerProps {
  sx?: {
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * 表格行組件介面
 */
interface TableRowComponentProps {
  item: DataItem;
  index: number;
  columns: Column[];
  renderItem?: (item: DataItem, index: number) => React.ReactNode;
}

/**
 * 表格行組件
 */
const TableRowComponent: React.FC<TableRowComponentProps> = ({
  item,
  index,
  columns,
  renderItem
}) => {
  if (renderItem) {
    const result = renderItem(item, index);
    return result as React.ReactElement;
  }
  
  return (
    <TableRow key={`item-${item.id ?? item.did ?? index}`}>
      {columns.map((column, colIndex) => (
        <TableCell key={`cell-${column.key ?? colIndex}-${index}`} align={column.align ?? 'left'}>
          {column.render ? column.render(item) : item[column.key ?? '']}
        </TableCell>
      ))}
    </TableRow>
  );
};

/**
 * 表格變體組件介面
 */
interface TableVariantComponentProps {
  data: PreviewData;
  title: string;
  columns: Column[];
  itemsKey: string;
  renderItem?: (item: DataItem, index: number) => React.ReactNode;
  emptyText: string;
  maxItems: number;
  total?: number | string;
  noteContent: string | null;
  containerProps: ContainerProps;
}

/**
 * 表格變體組件
 */
const TableVariantComponent: React.FC<TableVariantComponentProps> = ({
  data,
  title,
  columns,
  itemsKey,
  renderItem,
  emptyText,
  maxItems,
  total,
  noteContent,
  containerProps
}) => {
  const items = data[itemsKey] ?? [];
  const defaultContainerProps = {
    sx: {
      width: 550,
      maxHeight: 600,
      overflow: 'auto',
      ...containerProps?.sx
    }
  };

  return (
    <Card {...defaultContainerProps}>
      <CardContent sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>

        <TableContainer component={Paper} variant="outlined" sx={{ mb: 1 }}>
          <Table size="small">
            {columns.length > 0 && (
              <TableHead>
                <TableRow>
                  {columns.map((column, index) => (
                    <TableCell key={`header-${column.key ?? index}`} align={column.align ?? 'left'}>
                      {column.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
            )}
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center">{emptyText}</TableCell>
                </TableRow>
              ) : (
                <>
                  {items.slice(0, maxItems).map((item: DataItem, index: number) => (
                    <TableRowComponent
                      key={`row-${item.id ?? item.did ?? index}`}
                      item={item}
                      index={index}
                      columns={columns}
                      renderItem={renderItem}
                    />
                  ))}
                  {items.length > maxItems && (
                    <TableRow>
                      <TableCell colSpan={columns.length} align="center">
                        <Typography variant="body2" color="text.secondary">
                          還有 {items.length - maxItems} 個項目...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
              {total !== undefined && (
                <TableRow>
                  <TableCell colSpan={columns.length - 1} align="right">
                    <Typography variant="subtitle2" fontWeight="bold">
                      總計:
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2" fontWeight="bold">
                      {typeof total === 'number' ? total.toLocaleString() : total}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {noteContent && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" gutterBottom>
              備註
            </Typography>
            <Typography variant="body2">
              {noteContent}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * 列表項目組件介面
 */
interface ListItemComponentProps {
  item: DataItem;
  index: number;
  renderItem?: (item: DataItem, index: number) => React.ReactNode;
}

/**
 * 列表項目組件
 */
const ListItemComponent: React.FC<ListItemComponentProps> = ({
  item,
  index,
  renderItem
}) => {
  if (renderItem) {
    const result = renderItem(item, index);
    return result as React.ReactElement;
  }
  
  return (
    <Box key={`list-item-${item.id ?? item.did ?? index}`} sx={{ mb: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
      <Typography variant="body2">
        {item.dname ?? item.name} ({item.did ?? item.id})
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="textSecondary">
          數量: {item.dquantity ?? item.quantity}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          金額: {(item.dtotalCost ?? item.totalCost ?? 0).toLocaleString()} 元
        </Typography>
      </Box>
    </Box>
  );
};

/**
 * 列表變體組件介面
 */
interface ListVariantComponentProps {
  data: PreviewData;
  title: string;
  itemsKey: string;
  renderItem?: (item: DataItem, index: number) => React.ReactNode;
  emptyText: string;
  maxItems: number;
  total?: number | string;
  noteContent: string | null;
  containerProps: ContainerProps;
}

/**
 * 列表變體組件
 */
const ListVariantComponent: React.FC<ListVariantComponentProps> = ({
  data,
  title,
  itemsKey,
  renderItem,
  emptyText,
  maxItems,
  total,
  noteContent,
  containerProps
}) => {
  const items = data[itemsKey] ?? [];
  const defaultContainerProps = {
    sx: {
      width: 550,
      maxHeight: 600,
      overflow: 'auto',
      ...containerProps?.sx
    }
  };

  return (
    <Paper {...defaultContainerProps}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        
        <Divider sx={{ my: 1 }} />
        
        <Typography variant="subtitle2" gutterBottom>
          項目
        </Typography>
        
        {items.length === 0 ? (
          <Typography variant="body2" color="textSecondary">
            {emptyText}
          </Typography>
        ) : (
          <>
            {items.slice(0, maxItems).map((item: DataItem, index: number) => (
              <ListItemComponent
                key={`list-item-${item.id ?? item.did ?? index}`}
                item={item}
                index={index}
                renderItem={renderItem}
              />
            ))}
            {items.length > maxItems && (
              <Typography variant="body2" color="text.secondary" align="center">
                還有 {items.length - maxItems} 個項目...
              </Typography>
            )}
          </>
        )}
        
        {total !== undefined && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
            <Typography variant="subtitle2">總計:</Typography>
            <Typography variant="subtitle2">
              {typeof total === 'number' ? total.toLocaleString() : total} 元
            </Typography>
          </Box>
        )}
        
        {noteContent && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" gutterBottom>
              備註
            </Typography>
            <Typography variant="body2">
              {noteContent}
            </Typography>
          </>
        )}
      </Box>
    </Paper>
  );
};

/**
 * 通用預覽組件
 */
interface ItemPreviewProps {
  data?: PreviewData;
  loading?: boolean;
  error?: string;
  title?: string;
  columns?: Column[];
  itemsKey?: string;
  renderItem?: (item: DataItem, index: number) => React.ReactNode;
  getTotal?: (data: PreviewData) => number | string;
  emptyText?: string;
  variant?: 'table' | 'list';
  containerProps?: ContainerProps;
  maxItems?: number;
  notes?: string;
  notesKey?: string;
}

const ItemPreview: React.FC<ItemPreviewProps> = ({ 
  data, 
  loading, 
  error, 
  title = '預覽詳情',
  columns = [],
  itemsKey = 'items',
  renderItem,
  getTotal,
  emptyText = '沒有項目',
  variant = 'table',
  containerProps = {},
  maxItems = 5,
  notes,
  notesKey = 'notes'
}) => {
  // 處理加載狀態
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }
  
  // 處理錯誤狀態
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      </Box>
    );
  }
  
  // 處理無數據狀態
  if (!data) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2">
          找不到數據
        </Typography>
      </Box>
    );
  }

  // 獲取項目數據
  const items = data[itemsKey] ?? [];
  
  // 獲取備註 - 修正條件恆真問題
  let noteContent = null;
  if (notes) {
    noteContent = notes;
  } else if (notesKey && data[notesKey]) {
    noteContent = data[notesKey];
  }
  
  // 計算總計
  let total: number | string | undefined;
  if (getTotal) {
    total = getTotal(data);
  } else if (data.totalAmount !== undefined) {
    total = data.totalAmount;
  } else if (items.length > 0) {
    total = items.reduce((sum: number, item: DataItem) => sum + Number(item.dtotalCost ?? 0), 0);
  } else {
    total = 0;
  }

  // 直接使用傳入的containerProps
  
  // 根據變體類型渲染不同的UI
  return variant === 'table' ? (
    <TableVariantComponent
      data={data}
      title={title}
      columns={columns}
      itemsKey={itemsKey}
      renderItem={renderItem}
      emptyText={emptyText}
      maxItems={maxItems}
      total={total}
      noteContent={noteContent}
      containerProps={containerProps}
    />
  ) : (
    <ListVariantComponent
      data={data}
      title={title}
      itemsKey={itemsKey}
      renderItem={renderItem}
      emptyText={emptyText}
      maxItems={maxItems}
      total={total}
      noteContent={noteContent}
      containerProps={containerProps}
    />
  );
};

export default ItemPreview;