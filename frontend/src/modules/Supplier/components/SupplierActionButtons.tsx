import React from 'react';
import {
  Box,
  Button,
  TextField,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  UploadFile as UploadFileIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

interface SupplierActionButtonsProps {
  isTestMode: boolean;
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  onOpenImportDialog: () => void;
  onAddSupplier: () => void;
}

const SupplierActionButtons: React.FC<SupplierActionButtonsProps> = ({
  isTestMode,
  searchTerm,
  onSearchChange,
  onClearSearch,
  onOpenImportDialog,
  onAddSupplier
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { xs: 'stretch', sm: 'center' } }}>
      <TextField
        placeholder="搜尋供應商..."
        value={searchTerm}
        onChange={onSearchChange}
        size="small"
        sx={{ minWidth: { xs: '100%', sm: '300px' } }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: searchTerm && (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={onClearSearch}
                edge="end"
              >
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<UploadFileIcon />}
          onClick={onOpenImportDialog}
        >
          匯入CSV {isTestMode && "(模擬)"}
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={onAddSupplier}
        >
          添加供應商 {isTestMode && "(模擬)"}
        </Button>
      </Box>
    </Box>
  );
};

export default SupplierActionButtons;