import React, { useEffect, useState, useRef, useCallback } from 'react';
import { DataGrid, GridColumnMenu, useGridApiContext, GridColDef, GridRowParams, GridInitialState } from '@mui/x-data-grid';
import { Paper, Box, Typography, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

// 自定義菜單項按鈕屬性介面
interface ColumnMenuUserItemButtonProps {
  onClick: () => void;
}

// 新組件：自定義菜單項按鈕
const ColumnMenuUserItemButton: React.FC<ColumnMenuUserItemButtonProps> = ({ onClick }) => (
  <Button
    onClick={onClick}
    sx={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left', pl: 2 }}
  >
    設置列寬
  </Button>
);

// 自定義列菜單屬性介面
interface CustomColumnMenuProps {
  hideMenu: () => void;
  colDef: GridColDef;
}

const CustomColumnMenu: React.FC<CustomColumnMenuProps> = (props) => {
  const { hideMenu, colDef } = props;
  const [open, setOpen] = useState<boolean>(false);
  const [width, setWidth] = useState<number>(colDef?.width ?? 100);
  const apiRef = useGridApiContext();

  const handleClose = () => {
    setOpen(false);
  };

  const handleSave = () => {
    // 使用可選鏈運算符替代條件判斷
    apiRef?.current?.setColumnWidth(colDef?.field, width);
    console.log(`Setting column ${colDef?.field} width to ${width}px`);
    setOpen(false);
    hideMenu();
  };

  return (
    <>
      <GridColumnMenu
        {...props}
        open={true}
        currentColumn={colDef}
      />
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>設置列寬</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="列寬 (像素)"
            type="number"
            fullWidth
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            inputProps={{ min: 50 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>取消</Button>
          <Button onClick={handleSave}>確定</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// 數據表格行介面
interface DataRow {
  id: string | number;
  [key: string]: any;
}

// 數據表格屬性介面
interface DataTableProps {
  columns: GridColDef[];
  rows: DataRow[];
  title?: string;
  loading?: boolean;
  checkboxSelection?: boolean;
  onRowClick?: (params: GridRowParams) => void;
  height?: number | string;
  disablePagination?: boolean;
  [key: string]: any; // 允許其他 DataGrid 屬性
}

/**
 * 自定義數據表格組件
 */
const DataTable: React.FC<DataTableProps> = ({
  columns,
  rows,
  title,
  loading = false,
  checkboxSelection = false,
  onRowClick,
  height = 600,
  disablePagination = false,
  ...rest
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const gridRef = useRef<HTMLDivElement | null>(null);

  // 處理鍵盤事件
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!rows || rows.length === 0) return;
    
    // 只處理上下鍵
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      
      let newIndex: number;
      
      if (event.key === 'ArrowUp') {
        // 上鍵：選擇上一行，如果已經是第一行則不變
        newIndex = Math.max(0, selectedIndex - 1);
      } else {
        // 下鍵：選擇下一行，如果已經是最後一行則不變
        newIndex = Math.min(rows.length - 1, selectedIndex + 1);
      }
      
      // 如果索引變化了，觸發行點擊事件
      if (newIndex !== selectedIndex) {
        setSelectedIndex(newIndex);
        const selectedRow = rows[newIndex];
        if (onRowClick && selectedRow) {
          onRowClick({ row: selectedRow, id: selectedRow.id } as GridRowParams);
        }
      }
    }
  }, [rows, selectedIndex, onRowClick]);

  // 處理行點擊，更新選中索引
  const handleRowClickInternal = (params: GridRowParams) => {
    const index = rows.findIndex(row => row.id === params.row.id);
    setSelectedIndex(index);
    if (onRowClick) {
      onRowClick(params);
    }
  };

  // 添加和移除鍵盤事件監聽
  useEffect(() => {
    const gridElement = gridRef.current;
    if (gridElement) {
      gridElement.addEventListener('keydown', handleKeyDown as EventListener);
      
      return () => {
        gridElement.removeEventListener('keydown', handleKeyDown as EventListener);
      };
    }
    
    // 如果沒有 gridElement，返回空的清理函數
    return () => {};
  }, [handleKeyDown]);

  // 確保所有列都有最小寬度（移除 resizable 因為使用的是 MIT 版本）
  const columnsWithResizing = columns.map(column => ({
    ...column,
    minWidth: 50, // 設置最小寬度
  }));

  // 動態計算高度
  const dynamicHeight = typeof height === 'number' ? height :
                       height === 'auto' ? Math.min(rows.length * 52 + 100, 800) :
                       600;

  // 初始狀態 - 優先使用傳入的 initialState，否則使用預設值
  const defaultInitialState: GridInitialState = disablePagination ? {} : {
    pagination: {
      pageSize: 50,
    },
  };
  
  const finalInitialState = rest.initialState || defaultInitialState;

  return (
    <Paper elevation={2} sx={{ width: '100%', overflow: 'hidden' }}>
      {title && (
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
      )}
      <Box sx={{ width: '100%', height: dynamicHeight }} ref={gridRef} tabIndex={0}>
        <DataGrid
          rows={rows}
          columns={columnsWithResizing}
          loading={loading}
          hideFooterPagination={disablePagination}
          rowsPerPageOptions={disablePagination ? [] : [25, 50, 100]}
          checkboxSelection={checkboxSelection}
          disableSelectionOnClick
          onRowClick={handleRowClickInternal}
          initialState={finalInitialState}
          sx={{
            height: '100%',
            width: '100%',
            '& .MuiDataGrid-main': { overflow: 'hidden' },
            '& .MuiDataGrid-virtualScroller': {
              overflow: 'auto',
              marginTop: '0 !important'
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'action.hover',
              borderBottom: '1px solid',
              borderColor: 'divider',
              position: 'sticky',
              top: 0,
              zIndex: 1,
            },
            // 隱藏分頁工具列（當禁用分頁時）
            '& .MuiDataGrid-footerContainer': {
              display: disablePagination ? 'none' : 'flex'
            }
          }}
          {...rest}
        />
      </Box>
    </Paper>
  );
};

export default DataTable;