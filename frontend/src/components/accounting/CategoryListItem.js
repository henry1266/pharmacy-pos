import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  ListItem,
  ListItemText,
  IconButton,
  Button
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DragHandleIcon from '@mui/icons-material/DragHandle';

/**
 * 會計類別列表項目元件
 * 將複雜的巢狀結構抽出為獨立元件，降低巢狀層級
 */
const CategoryListItem = ({ 
  category, 
  provided, 
  onEdit, 
  onDelete, 
  onDetail 
}) => {
  return (
    <ListItem
      ref={provided.innerRef}
      {...provided.draggableProps}
      secondaryAction={
        <Box>
          <IconButton
            edge="end"
            onClick={() => onEdit(category)}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            edge="end"
            onClick={() => onDelete(category._id)}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      }
      sx={{ 
        border: '1px solid #eee',
        borderRadius: 1,
        mb: 1,
        bgcolor: 'background.paper'
      }}
    >
      <IconButton
        {...provided.dragHandleProps}
        sx={{ mr: 1 }}
      >
        <DragHandleIcon />
      </IconButton>
      <ListItemText
        primary={
          <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
            {category.name}
            <Button
              size="small"
              variant="outlined"
              sx={{ ml: 2 }}
              onClick={(e) => onDetail(e, category._id)}
            >
              詳細
            </Button>
          </Box>
        }
        secondary={category.description || '無描述'}
      />
    </ListItem>
  );
};

// PropTypes 驗證
CategoryListItem.propTypes = {
  // 類別資料物件
  category: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string
  }).isRequired,
  
  // react-beautiful-dnd 提供的拖曳屬性
  provided: PropTypes.shape({
    innerRef: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.shape({ current: PropTypes.instanceOf(Element) })
    ]).isRequired,
    draggableProps: PropTypes.object.isRequired,
    dragHandleProps: PropTypes.object.isRequired
  }).isRequired,
  
  // 回調函數
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onDetail: PropTypes.func.isRequired
};

export default CategoryListItem;
