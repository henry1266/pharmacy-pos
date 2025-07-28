import React from 'react';
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
import { DraggableProvided } from 'react-beautiful-dnd';
import type { AccountingCategory } from '@pharmacy-pos/shared/types/accounting';

// 組件 Props 介面
interface CategoryListItemProps {
  category: AccountingCategory;
  provided: DraggableProvided;
  onEdit: (category: AccountingCategory) => void;
  onDelete: (categoryId: string) => void;
  onDetail: (e: React.MouseEvent<HTMLButtonElement>, categoryId: string) => void;
}

/**
 * 會計類別列表項目元件
 * 將複雜的巢狀結構抽出為獨立元件，降低巢狀層級
 */
const CategoryListItem: React.FC<CategoryListItemProps> = ({ 
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
      style={provided.draggableProps.style || {}}
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
        secondary={category.description ?? '無描述'}
      />
    </ListItem>
  );
};

export default CategoryListItem;