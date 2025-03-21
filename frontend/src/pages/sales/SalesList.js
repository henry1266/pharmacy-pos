import React, { useState } from 'react';
import { Grid, Box, IconButton, Tooltip } from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import PageContainer from '../../components/common/PageContainer';
import SearchInput from '../../components/common/SearchInput';
import ActionButton from '../../components/common/ActionButton';
import DataTable from '../../components/tables/DataTable';

// 模擬資料
const mockSales = [
  { 
    id: '1', 
    invoiceNumber: 'INV-20230501-001', 
    date: '2023-05-01 14:30:25', 
    customer: '王小明',
    customerId: '1', 
    items: 5,
    totalAmount: 1250,
    paymentMethod: '現金',
    status: 'completed',
    staffName: '張藥師'
  },
  { 
    id: '2', 
    invoiceNumber: 'INV-20230502-001', 
    date: '2023-05-02 10:15:40', 
    customer: '李小華',
    customerId: '2', 
    items: 3,
    totalAmount: 450,
    paymentMethod: '信用卡',
    status: 'completed',
    staffName: '張藥師'
  },
  { 
    id: '3', 
    invoiceNumber: 'INV-20230503-001', 
    date: '2023-05-03 16:45:12', 
    customer: '張美玲',
    customerId: '3', 
    items: 2,
    totalAmount: 320,
    paymentMethod: '現金',
    status: 'completed',
    staffName: '李藥師'
  },
  { 
    id: '4', 
    invoiceNumber: 'INV-20230504-001', 
    date: '2023-05-04 09:20:35', 
    customer: '陳大偉',
    customerId: '4', 
    items: 7,
    totalAmount: 1850,
    paymentMethod: 'Line Pay',
    status: 'completed',
    staffName: '李藥師'
  },
  { 
    id: '5', 
    invoiceNumber: 'INV-20230505-001', 
    date: '2023-05-05 13:10:50', 
    customer: '林小芳',
    customerId: '5', 
    items: 4,
    totalAmount: 680,
    paymentMethod: '信用卡',
    status: 'completed',
    staffName: '張藥師'
  }
];

const SalesList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  // 表格列定義
  const columns = [
    { field: 'invoiceNumber', headerName: '發票號碼', minWidth: 150 },
    { field: 'date', headerName: '日期時間', minWidth: 180 },
    { field: 'customer', headerName: '客戶', minWidth: 120 },
    { 
      field: 'items', 
      headerName: '項目數', 
      minWidth: 100,
      align: 'right'
    },
    { 
      field: 'totalAmount', 
      headerName: '總金額', 
      minWidth: 120,
      align: 'right',
      render: (value) => `$${value.toLocaleString()}`
    },
    { field: 'paymentMethod', headerName: '付款方式', minWidth: 120 },
    { field: 'staffName', headerName: '經手人', minWidth: 120 },
    {
      field: 'status',
      headerName: '狀態',
      minWidth: 100,
      render: (value) => value === 'completed' ? '已完成' : '處理中'
    },
    {
      field: 'actions',
      headerName: '操作',
      minWidth: 180,
      align: 'center',
      render: (_, row) => (
        <Box>
          <Tooltip title="查看詳情">
            <IconButton size="small" onClick={() => handleView(row.id)}>
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="列印發票">
            <IconButton size="small" onClick={() => handlePrint(row.id)}>
              <PrintIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="編輯">
            <IconButton size="small" onClick={() => handleEdit(row.id)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="刪除">
            <IconButton size="small" onClick={() => handleDelete(row.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  // 處理搜索
  const handleSearch = (value) => {
    setSearchTerm(value);
    setPage(0);
  };

  // 處理頁碼變化
  const handlePageChange = (_, newPage) => {
    setPage(newPage);
  };

  // 處理每頁行數變化
  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 處理全選
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelected(mockSales.map(sale => sale.id));
    } else {
      setSelected([]);
    }
  };

  // 處理選擇行
  const handleSelectRow = (id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = [...selected, id];
    } else {
      newSelected = selected.filter(item => item !== id);
    }

    setSelected(newSelected);
  };

  // 處理查看詳情
  const handleView = (id) => {
    navigate(`/sales/${id}`);
  };

  // 處理編輯
  const handleEdit = (id) => {
    navigate(`/sales/${id}/edit`);
  };

  // 處理刪除
  const handleDelete = (id) => {
    // 實際應用中應該顯示確認對話框
    console.log(`刪除銷售記錄 ID: ${id}`);
  };

  // 處理列印
  const handlePrint = (id) => {
    console.log(`列印銷售發票 ID: ${id}`);
    // 實際應用中應該調用列印功能
  };

  // 處理新增
  const handleAdd = () => {
    navigate('/sales/pos');
  };

  // 過濾資料
  const filteredData = mockSales.filter(sale => 
    sale.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.staffName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageContainer
      title="銷售記錄"
      subtitle="管理所有銷售交易記錄"
      action={
        <ActionButton
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          新增銷售
        </ActionButton>
      }
    >
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <SearchInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onSearch={handleSearch}
            placeholder="搜索發票號碼、客戶或經手人..."
          />
        </Grid>
      </Grid>

      <DataTable
        columns={columns}
        data={filteredData}
        loading={loading}
        selectable={true}
        selected={selected}
        onSelectAll={handleSelectAll}
        onSelectRow={handleSelectRow}
        pagination={true}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={filteredData.length}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </PageContainer>
  );
};

export default SalesList;
