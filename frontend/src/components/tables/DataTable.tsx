import React, { useEffect, useState, useRef } from 'react';
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

  const handleOpen = () => {
    setOpen(true);
  };

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
        slots={{
          // 添加自定義菜單項
          columnMenuUserItem: ColumnMenuUserItemButton,
        }}
        slotProps={{
          columnMenuUserItem: {
            onClick: handleOpen,
            displayOrder: 0, // 顯示在最上方
          },
        }}
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
  pageSize?: number;
  checkboxSelection?: boolean;
  onRowClick?: (params: GridRowParams) => void;
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
  pageSize = 50,
  checkboxSelection = false,
  onRowClick,
  ...rest
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const gridRef = useRef<HTMLDivElement | null>(null);

  // 處理鍵盤事件
  const handleKeyDown = (event: KeyboardEvent) => {
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
        if (onRowClick && rows[newIndex]) {
          onRowClick({ row: rows[newIndex], id: rows[newIndex].id } as GridRowParams);
        }
      }
    }
  };

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
      gridElement.addEventListener('keydown', handleKeyDown);
      
      return () => {
        gridElement.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [rows, selectedIndex]);

  // 確保所有列都可調整大小
  const columnsWithResizing = columns.map(column => ({
    ...column,
    resizable: true, // 啟用列寬調整
    minWidth: 50, // 設置最小寬度
  }));

  // 初始狀態
  const initialState: GridInitialState = {
    pagination: {
      paginationModel: { pageSize: 50, page: 0 }, // 設置初始頁面大小為50
    },
  };

  return (
    <Paper elevation={2} sx={{ width: '100%', overflow: 'hidden' }}>
      {title && (
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
      )}
      <Box sx={{ width: '100%', height: 600 }} ref={gridRef} tabIndex={0}>
        <DataGrid
          rows={rows}
          columns={columnsWithResizing}
          loading={loading}
          pageSizeOptions={[5, 10, 25, 50]}
          checkboxSelection={checkboxSelection}
          disableRowSelectionOnClick
          onRowClick={handleRowClickInternal}
          slots={{
            columnMenu: CustomColumnMenu as React.ComponentType<any>, // 使用自定義列菜單
          }}
          initialState={{
            ...initialState,
            pagination: {
              paginationModel: { pageSize, page: 0 },
            },
          }}
          sx={{
            height: '100%',
            width: '100%',
            '& .MuiDataGrid-main': { overflow: 'hidden' },
            '& .MuiDataGrid-virtualScroller': { overflow: 'auto' },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'background.paper',
              borderBottom: '1px solid',
              borderColor: 'divider',
              position: 'sticky',
              top: 0,
              zIndex: 1,
            }
          }}
          {...rest}
        />
      </Box>
    </Paper>
  );
};

export default DataTable;