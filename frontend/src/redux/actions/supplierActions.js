import { supplierService } from '../../utils/apiService';

// 獲取所有供應商
export const getSuppliers = () => async dispatch => {
  try {
    setLoading();

    const res = await supplierService.getAll();

    dispatch({
      type: 'GET_SUPPLIERS',
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: 'SUPPLIER_ERROR',
      payload: err.response?.data?.msg || '獲取供應商失敗'
    });
  }
};

// 獲取單個供應商
export const getSupplier = id => async dispatch => {
  try {
    setLoading();

    const res = await supplierService.getById(id);

    dispatch({
      type: 'GET_SUPPLIER',
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: 'SUPPLIER_ERROR',
      payload: err.response?.data?.msg || '獲取供應商失敗'
    });
  }
};

// 添加供應商
export const addSupplier = supplier => async dispatch => {
  try {
    setLoading();

    const res = await supplierService.create(supplier);

    dispatch({
      type: 'ADD_SUPPLIER',
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: 'SUPPLIER_ERROR',
      payload: err.response?.data?.msg || '添加供應商失敗'
    });
  }
};

// 更新供應商
export const updateSupplier = supplier => async dispatch => {
  try {
    setLoading();

    const res = await supplierService.update(supplier._id, supplier);

    dispatch({
      type: 'UPDATE_SUPPLIER',
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: 'SUPPLIER_ERROR',
      payload: err.response?.data?.msg || '更新供應商失敗'
    });
  }
};

// 刪除供應商
export const deleteSupplier = id => async dispatch => {
  try {
    setLoading();

    await supplierService.delete(id);

    dispatch({
      type: 'DELETE_SUPPLIER',
      payload: id
    });
  } catch (err) {
    dispatch({
      type: 'SUPPLIER_ERROR',
      payload: err.response?.data?.msg || '刪除供應商失敗'
    });
  }
};

// 設置加載狀態
export const setLoading = () => {
  return {
    type: 'SET_LOADING'
  };
};
