import { inventoryService } from '../../utils/apiService';

// 獲取庫存
export const getInventory = () => async dispatch => {
  try {
    setLoading();

    const res = await inventoryService.getAll();

    dispatch({
      type: 'GET_INVENTORY',
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: 'INVENTORY_ERROR',
      payload: err.response?.data?.msg || '獲取庫存失敗'
    });
  }
};

// 獲取單個庫存項目
export const getInventoryItem = id => async dispatch => {
  try {
    setLoading();

    const res = await inventoryService.getById(id);

    dispatch({
      type: 'GET_INVENTORY_ITEM',
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: 'INVENTORY_ERROR',
      payload: err.response?.data?.msg || '獲取庫存項目失敗'
    });
  }
};

// 更新庫存
export const updateInventory = item => async dispatch => {
  try {
    setLoading();

    const res = await inventoryService.update(item._id, item);

    dispatch({
      type: 'UPDATE_INVENTORY',
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: 'INVENTORY_ERROR',
      payload: err.response?.data?.msg || '更新庫存失敗'
    });
  }
};

// 設置加載狀態
export const setLoading = () => {
  return {
    type: 'SET_LOADING'
  };
};
