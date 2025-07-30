import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Chip,
  InputAdornment,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
  TrendingUp as TrendingUpIcon,
  Close as CloseIcon,
  ContentCopy as ContentCopyIcon,
  Update as UpdateIcon,
  FindReplace as FindReplaceIcon
} from '@mui/icons-material';
import axios from 'axios';

// 超連結資料介面
interface LinkReference {
  _id: string;
  keyword: string;
  displayText: string;
  url: string;
  usageCount: number;
  isActive: boolean;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 元件 Props 介面
interface LinkReferenceManagerProps {
  open: boolean;
  onClose: () => void;
  onSelectLink?: (link: LinkReference) => void;
  onInsertLink?: (markdownLink: string) => void;
}

const LinkReferenceManager: React.FC<LinkReferenceManagerProps> = ({
  open,
  onClose,
  onSelectLink,
  onInsertLink
}) => {
  // 狀態管理
  const [links, setLinks] = useState<LinkReference[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingLink, setEditingLink] = useState<LinkReference | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showUsageDialog, setShowUsageDialog] = useState<boolean>(false);
  const [usageData, setUsageData] = useState<any>(null);

  // 新增/編輯表單狀態
  const [formData, setFormData] = useState({
    displayText: '',
    url: ''
  });

  // 載入超連結列表
  const loadLinks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/link-references', {
        params: {
          search: searchQuery,
          limit: 50
        }
      });

      if (response.data.success) {
        setLinks(response.data.data.links);
      }
    } catch (error) {
      console.error('載入超連結失敗:', error);
      setError('載入超連結失敗');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  // 初始化載入
  useEffect(() => {
    if (open) {
      loadLinks();
    }
  }, [open, loadLinks]);

  // 搜尋變更時重新載入
  useEffect(() => {
    const timer = setTimeout(() => {
      if (open) {
        loadLinks();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, open, loadLinks]);

  // 處理表單提交（統一使用全域更新）
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      if (!formData.displayText || !formData.url) {
        setError('請填寫所有必填欄位');
        return;
      }

      if (editingLink) {
        // 編輯模式：使用全域更新
        const response = await axios.post(`/api/link-global/global-update/${editingLink._id}`, {
          oldDisplayText: editingLink.displayText,
          newDisplayText: formData.displayText,
          oldUrl: editingLink.url,
          newUrl: formData.url
        });

        if (response.data.success) {
          setSuccess(`全域更新成功！已更新 ${response.data.data.updatedNotesCount} 個產品筆記中的連結`);
          setEditingLink(null);
          setFormData({
            displayText: '',
            url: ''
          });
          loadLinks();
        }
      } else {
        // 新增模式：直接新增
        const submitData = {
          keyword: formData.displayText, // 使用 displayText 作為 keyword
          displayText: formData.displayText,
          url: formData.url
        };
        
        const response = await axios.post('/api/link-references', submitData);

        if (response.data.success) {
          setSuccess('超連結新增成功');
          setFormData({
            displayText: '',
            url: ''
          });
          loadLinks();
        }
      }
    } catch (error: any) {
      console.error('儲存超連結失敗:', error);
      setError(error.response?.data?.message || '儲存失敗');
    } finally {
      setLoading(false);
    }
  };


  // 查看連結使用情況
  const handleViewUsage = async (link: LinkReference) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/link-global/search-usage/${link._id}`);
      
      if (response.data.success) {
        setUsageData(response.data.data);
        setShowUsageDialog(true);
      }
    } catch (error: any) {
      console.error('查詢使用情況失敗:', error);
      setError('查詢使用情況失敗');
    } finally {
      setLoading(false);
    }
  };

  // 處理刪除
  const handleDelete = async (id: string) => {
    if (!window.confirm('確定要刪除這個超連結嗎？')) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.delete(`/api/link-references/${id}`);
      
      if (response.data.success) {
        setSuccess('超連結刪除成功');
        loadLinks();
      }
    } catch (error) {
      console.error('刪除超連結失敗:', error);
      setError('刪除失敗');
    } finally {
      setLoading(false);
    }
  };

  // 處理編輯
  const handleEdit = (link: LinkReference) => {
    setEditingLink(link);
    setFormData({
      displayText: link.displayText,
      url: link.url
    });
  };

  // 處理選擇連結
  const handleSelectLink = async (link: LinkReference) => {
    try {
      // 增加使用次數
      await axios.post(`/api/link-references/${link._id}/usage`);
      
      // 生成可追蹤的連結引用格式，而不是直接的 Markdown 連結
      const linkReference = `{{linkRef:${link.displayText}}}`;
      
      if (onInsertLink) {
        onInsertLink(linkReference);
      }
      
      if (onSelectLink) {
        onSelectLink(link);
      }
      
      onClose();
    } catch (error) {
      console.error('選擇連結失敗:', error);
    }
  };

  // 複製連結到剪貼簿
  const handleCopyLink = (link: LinkReference) => {
    const linkReference = `{{linkRef:${link.displayText}}}`;
    navigator.clipboard.writeText(linkReference);
    setSuccess('連結引用已複製到剪貼簿');
  };

  // 取消編輯
  const handleCancel = () => {
    setEditingLink(null);
    setFormData({
      displayText: '',
      url: ''
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LinkIcon />
        超連結管理
        <Box sx={{ flexGrow: 1 }} />
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* 錯誤和成功訊息 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* 新增/編輯表單 - 放在最上方 */}
        <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {editingLink ? '編輯超連結' : '新增超連結'}
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'flex-start' }}>
            <TextField
              label="顯示文字 *"
              value={formData.displayText}
              onChange={(e) => setFormData({ ...formData, displayText: e.target.value })}
              placeholder="例如：蝦青素"
              size="small"
              sx={{ flex: 1 }}
            />
            
            <TextField
              label="URL *"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://..."
              size="small"
              sx={{ flex: 1 }}
            />
            
            <Box sx={{ display: 'flex', gap: 1, alignSelf: 'flex-start' }}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                size="small"
              >
                {editingLink ? '更新' : '新增'}
              </Button>
              {editingLink && (
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  size="small"
                >
                  取消
                </Button>
              )}
            </Box>
          </Box>
        </Box>

        {/* 搜尋區域 */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="搜尋超連結..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
        </Box>

        {/* 超連結列表 */}
        <Box sx={{ height: 400, overflow: 'auto' }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          )}

          {!loading && links.length === 0 && (
            <Box sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>
              <Typography>沒有找到超連結</Typography>
              <Typography variant="body2">
                {searchQuery ? '請嘗試其他搜尋關鍵字' : '在上方新增第一個超連結'}
              </Typography>
            </Box>
          )}

          <List>
            {links.map((link) => (
              <ListItem
                key={link._id}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
                onClick={() => handleSelectLink(link)}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {link.displayText}
                      </Typography>
                      {link.usageCount > 0 && (
                        <Chip
                          icon={<TrendingUpIcon />}
                          label={link.usageCount}
                          size="small"
                          color="primary"
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                      {link.url}
                    </Typography>
                  }
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="查看使用情況">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewUsage(link);
                        }}
                      >
                        <FindReplaceIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="複製連結">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyLink(link);
                        }}
                      >
                        <ContentCopyIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="編輯">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(link);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="刪除">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(link._id);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      </DialogContent>

      <DialogActions>
        <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
          點擊超連結項目可直接插入到編輯器中
        </Typography>
        <Button onClick={onClose}>關閉</Button>
      </DialogActions>

      {/* 使用情況查看對話框 */}
      <Dialog
        open={showUsageDialog}
        onClose={() => setShowUsageDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          連結使用情況
        </DialogTitle>
        <DialogContent>
          {usageData ? (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                連結：{usageData.linkInfo?.displayText}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                URL：{usageData.linkInfo?.url}
              </Typography>
              
              {usageData.usage && usageData.usage.length > 0 ? (
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    此連結被 {usageData.usage.length} 個產品筆記使用：
                  </Typography>
                  <List>
                    {usageData.usage.map((item: any, index: number) => (
                      <ListItem key={index} divider>
                        <ListItemText
                          primary={item.productName || `產品 ${item.productId}`}
                          secondary={`產品ID: ${item.productId} | 使用次數: ${item.count}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              ) : (
                <Typography color="text.secondary">
                  此連結目前沒有被任何產品筆記使用。
                </Typography>
              )}
            </Box>
          ) : (
            <Typography>載入中...</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUsageDialog(false)}>
            關閉
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default LinkReferenceManager;