import { customerService } from '../../utils/apiService';

// 獲取所有會員
export const getCustomers = () => async dispatch => {
  try {
    setLoading();

    const res = await customerService.getAll();

    dispatch({
      type: 'GET_CUSTOMERS',
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: 'CUSTOMER_ERROR',
      payload: err.response?.data?.msg || '獲取會員失敗'
    });
  }
};

// 獲取單個會員
export const getCustomer = id => async dispatch => {
  try {
    setLoading();

    const res = await customerService.getById(id);

    dispatch({
      type: 'GET_CUSTOMER',
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: 'CUSTOMER_ERROR',
      payload: err.response?.data?.msg || '獲取會員失敗'
    });
  }
};

// 添加會員
export const addCustomer = customer => async dispatch => {
  try {
    setLoading();

    const res = await customerService.create(customer);

    dispatch({
      type: 'ADD_CUSTOMER',
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: 'CUSTOMER_ERROR',
      payload: err.response?.data?.msg || '添加會員失敗'
    });
  }
};

// 更新會員
export const updateCustomer = customer => async dispatch => {
  try {
    setLoading();

    const res = await customerService.update(customer._id, customer);

    dispatch({
      type: 'UPDATE_CUSTOMER',
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: 'CUSTOMER_ERROR',
      payload: err.response?.data?.msg || '更新會員失敗'
    });
  }
};

// 刪除會員
export const deleteCustomer = id => async dispatch => {
  try {
    setLoading();

    await customerService.delete(id);

    dispatch({
      type: 'DELETE_CUSTOMER',
      payload: id
    });
  } catch (err) {
    dispatch({
      type: 'CUSTOMER_ERROR',
      payload: err.response?.data?.msg || '刪除會員失敗'
    });
  }
};

// 設置加載狀態
export const setLoading = () => {
  return {
    type: 'SET_LOADING'
  };
};
