import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../redux/store';

// 使用正確類型的 useDispatch hook
export const useAppDispatch = () => useDispatch<AppDispatch>();

// 使用正確類型的 useSelector hook
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;