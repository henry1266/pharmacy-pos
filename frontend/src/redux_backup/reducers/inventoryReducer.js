// 初始狀態
const initialState = {
  inventory: [],
  item: null,
  loading: false,
  error: null
};

// 庫存 Reducer
export default function(state = initialState, action) {
  const { type, payload } = action;
  
  switch(type) {
    case 'GET_INVENTORY':
      return {
        ...state,
        inventory: payload,
        loading: false
      };
    case 'GET_INVENTORY_ITEM':
      return {
        ...state,
        item: payload,
        loading: false
      };
    case 'UPDATE_INVENTORY':
      return {
        ...state,
        inventory: state.inventory.map(item => 
          item._id === payload._id ? payload : item
        ),
        loading: false
      };
    case 'INVENTORY_ERROR':
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
