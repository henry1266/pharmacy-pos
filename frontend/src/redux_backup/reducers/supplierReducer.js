// 初始狀態
const initialState = {
  suppliers: [],
  supplier: null,
  loading: false,
  error: null
};

// 供應商 Reducer
export default function(state = initialState, action) {
  const { type, payload } = action;
  
  switch(type) {
    case 'GET_SUPPLIERS':
      return {
        ...state,
        suppliers: payload,
        loading: false
      };
    case 'GET_SUPPLIER':
      return {
        ...state,
        supplier: payload,
        loading: false
      };
    case 'ADD_SUPPLIER':
      return {
        ...state,
        suppliers: [payload, ...state.suppliers],
        loading: false
      };
    case 'UPDATE_SUPPLIER':
      return {
        ...state,
        suppliers: state.suppliers.map(supplier => 
          supplier._id === payload._id ? payload : supplier
        ),
        loading: false
      };
    case 'DELETE_SUPPLIER':
      return {
        ...state,
        suppliers: state.suppliers.filter(supplier => supplier._id !== payload),
        loading: false
      };
    case 'SUPPLIER_ERROR':
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
