import { saleService } from '../../utils/apiService';

// 獲取所有銷售記錄
export const getSales = () => async dispatch => {
  try {
    setLoading();

    const res = await saleService.getAll();

    dispatch({
      type: 'GET_SALES',
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: 'SALES_ERROR',
      payload: err.response?.data?.msg || '獲取銷售記錄失敗'
    });
  }
};

// 獲取單個銷售記錄
export const getSale = id => async dispatch => {
  try {
    setLoading();

    const res = await saleService.getById(id);

    dispatch({
      type: 'GET_SALE',
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: 'SALES_ERROR',
      payload: err.response?.data?.msg || '獲取銷售記錄失敗'
    });
  }
};

// 添加銷售記錄
export const addSale = sale => async dispatch => {
  try {
    setLoading();

    const res = await saleService.create(sale);

    dispatch({
      type: 'ADD_SALE',
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: 'SALES_ERROR',
      payload: err.response?.data?.msg || '添加銷售記錄失敗'
    });
  }
};

// 設置加載狀態
export const setLoading = () => {
  return {
    type: 'SET_LOADING'
  };
};
