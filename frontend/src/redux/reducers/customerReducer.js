// 初始狀態
const initialState = {
  customers: [],
  customer: null,
  loading: false,
  error: null
};

// 會員 Reducer
export default function(state = initialState, action) {
  const { type, payload } = action;
  
  switch(type) {
    case 'GET_CUSTOMERS':
      return {
        ...state,
        customers: payload,
        loading: false
      };
    case 'GET_CUSTOMER':
      return {
        ...state,
        customer: payload,
        loading: false
      };
    case 'ADD_CUSTOMER':
      return {
        ...state,
        customers: [payload, ...state.customers],
        loading: false
      };
    case 'UPDATE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.map(customer => 
          customer._id === payload._id ? payload : customer
        ),
        loading: false
      };
    case 'DELETE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.filter(customer => customer._id !== payload),
        loading: false
      };
    case 'CUSTOMER_ERROR':
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
