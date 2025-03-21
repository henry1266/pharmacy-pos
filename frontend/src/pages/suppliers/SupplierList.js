import React, { useState } from 'react';
import { Grid, Box, IconButton, Tooltip } from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import PageContainer from '../../components/common/PageContainer';
import SearchInput from '../../components/common/SearchInput';
import ActionButton from '../../components/common/ActionButton';
import DataTable from '../../components/tables/DataTable';

// 模擬資料
const mockSuppliers = [
  { 
    id: '1', 
    name: '永信藥品', 
    contact: '張經理', 
    phone: '02-2345-6789', 
    email: 'contact@yungshin.com',
    address: '台北市信義區信義路五段7號',
    status: 'active'
  },
  { 
    id: '2', 
    name: '台灣武田', 
    contact: '李經理', 
    phone: '02-8765-4321', 
    email: 'contact@takeda.com.tw',
    address: '台北市南港區園區街3號',
    status: 'active'
  },
  { 
    id: '3', 
    name: '信東生技', 
    contact: '王經理', 
    phone: '03-456-7890', 
    email: 'contact@sintong.com',
    address: '桃園市中壢區中央西路三段150號',
    status: 'active'
  },
  { 
    id: '4', 
    name: '生達製藥', 
    contact: '陳經理', 
    phone: '07-123-4567', 
    email: 'contact@standard.com.tw',
    address: '高雄市前鎮區復興四路12號',
    status: 'active'
  },
  { 
    id: '5', 
    name: '杏輝藥品', 
    contact: '林經理', 
    phone: '04-567-8901', 
    email: 'contact@sinphar.com',
    address: '台中市西屯區工業區一路10號',
    status: 'inactive'
  }
];

const SupplierList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  // 表格列定義
  const columns = [
    { field: 'name', headerName: '供應商名稱', minWidth: 150 },
    { field: 'contact', headerName: '聯絡人', minWidth: 120 },
    { field: 'phone', headerName: '聯絡電話', minWidth: 150 },
    { field: 'email', headerName: '電子郵件', minWidth: 200 },
    { field: 'address', headerName: '地址', minWidth: 250 },
    {
      field: 'status',
      headerName: '狀態',
      minWidth: 100,
      render: (value) => value === 'active' ? '啟用' : '停用'
    },
    {
      field: 'actions',
      headerName: '操作',
      minWidth: 150,
      align: 'center',
      render: (_, row) => (
        <Box>
          <Tooltip title="查看詳情">
            <IconButton size="small" onClick={() => handleView(row.id)}>
              <ViewIcon fontSize="small" />
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
      setSelected(mockSuppliers.map(supplier => supplier.id));
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
    navigate(`/suppliers/${id}`);
  };

  // 處理編輯
  const handleEdit = (id) => {
    navigate(`/suppliers/${id}/edit`);
  };

  // 處理刪除
  const handleDelete = (id) => {
    // 實際應用中應該顯示確認對話框
    console.log(`刪除供應商 ID: ${id}`);
  };

  // 處理新增
  const handleAdd = () => {
    navigate('/suppliers/new');
  };

  // 過濾資料
  const filteredData = mockSuppliers.filter(supplier => 
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.phone.includes(searchTerm) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageContainer
      title="供應商管理"
      subtitle="管理所有供應商資訊"
      action={
        <ActionButton
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          新增供應商
        </ActionButton>
      }
    >
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <SearchInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onSearch={handleSearch}
            placeholder="搜索供應商名稱、聯絡人、電話或郵件..."
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

export default SupplierList;
