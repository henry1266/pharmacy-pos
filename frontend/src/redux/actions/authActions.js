import { authService } from '../../utils/apiService';

// 載入用戶
export const loadUser = () => async dispatch => {
  try {
    const res = await authService.getCurrentUser();

    dispatch({
      type: 'USER_LOADED',
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: 'AUTH_ERROR'
    });
  }
};

// 登入用戶
export const login = (email, password) => async dispatch => {
  try {
    const res = await authService.login({ email, password });

    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: res.data
    });

    dispatch(loadUser());
  } catch (err) {
    dispatch({
      type: 'LOGIN_FAIL',
      payload: err.response?.data?.msg || '登入失敗'
    });
  }
};

// 註冊用戶
export const register = formData => async dispatch => {
  try {
    const res = await authService.register(formData);

    dispatch({
      type: 'REGISTER_SUCCESS',
      payload: res.data
    });

    dispatch(loadUser());
  } catch (err) {
    dispatch({
      type: 'REGISTER_FAIL',
      payload: err.response?.data?.msg || '註冊失敗'
    });
  }
};

// 登出
export const logout = () => dispatch => {
  dispatch({ type: 'LOGOUT' });
};
