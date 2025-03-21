import { productService } from '../../utils/apiService';

// 獲取所有產品
export const getProducts = () => async dispatch => {
  try {
    setLoading();

    const res = await productService.getAll();

    dispatch({
      type: 'GET_PRODUCTS',
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: 'PRODUCT_ERROR',
      payload: err.response?.data?.msg || '獲取產品失敗'
    });
  }
};

// 獲取單個產品
export const getProduct = id => async dispatch => {
  try {
    setLoading();

    const res = await productService.getById(id);

    dispatch({
      type: 'GET_PRODUCT',
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: 'PRODUCT_ERROR',
      payload: err.response?.data?.msg || '獲取產品失敗'
    });
  }
};

// 添加產品
export const addProduct = product => async dispatch => {
  try {
    setLoading();

    const res = await productService.create(product);

    dispatch({
      type: 'ADD_PRODUCT',
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: 'PRODUCT_ERROR',
      payload: err.response?.data?.msg || '添加產品失敗'
    });
  }
};

// 更新產品
export const updateProduct = product => async dispatch => {
  try {
    setLoading();

    const res = await productService.update(product._id, product);

    dispatch({
      type: 'UPDATE_PRODUCT',
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: 'PRODUCT_ERROR',
      payload: err.response?.data?.msg || '更新產品失敗'
    });
  }
};

// 刪除產品
export const deleteProduct = id => async dispatch => {
  try {
    setLoading();

    await productService.delete(id);

    dispatch({
      type: 'DELETE_PRODUCT',
      payload: id
    });
  } catch (err) {
    dispatch({
      type: 'PRODUCT_ERROR',
      payload: err.response?.data?.msg || '刪除產品失敗'
    });
  }
};

// 設置加載狀態
export const setLoading = () => {
  return {
    type: 'SET_LOADING'
  };
};
