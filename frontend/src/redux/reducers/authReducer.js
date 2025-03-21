// 初始狀態
const initialState = {
  token: localStorage.getItem('token'),
  isAuthenticated: null,
  loading: true,
  user: null,
  error: null
};

// 認證 Reducer
export default function(state = initialState, action) {
  const { type, payload } = action;
  
  switch(type) {
    case 'USER_LOADED':
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: payload
      };
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      localStorage.setItem('token', payload.token);
      return {
        ...state,
        ...payload,
        isAuthenticated: true,
        loading: false
      };
    case 'AUTH_ERROR':
    case 'LOGIN_FAIL':
    case 'REGISTER_FAIL':
    case 'LOGOUT':
      localStorage.removeItem('token');
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null,
        error: payload
      };
    case 'CLEAR_ERRORS':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
}
