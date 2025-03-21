// 初始狀態
const initialState = {
  sales: [],
  sale: null,
  loading: false,
  error: null
};

// 銷售 Reducer
export default function(state = initialState, action) {
  const { type, payload } = action;
  
  switch(type) {
    case 'GET_SALES':
      return {
        ...state,
        sales: payload,
        loading: false
      };
    case 'GET_SALE':
      return {
        ...state,
        sale: payload,
        loading: false
      };
    case 'ADD_SALE':
      return {
        ...state,
        sales: [payload, ...state.sales],
        loading: false
      };
    case 'SALES_ERROR':
      return {
        ...state,
        error: payload,
        loading: false
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: true
      };
    default:
      return state;
  }
}
