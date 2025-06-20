import React, { useEffect, useState } from 'react';
import { Droppable, DroppableProps } from 'react-beautiful-dnd';

/**
 * 嚴格模式下的Droppable組件
 * 解決React 18嚴格模式與react-beautiful-dnd的兼容性問題
 */
export interface StrictModeDroppableProps extends DroppableProps {
  children: (provided: any, snapshot: any) => React.ReactElement;
}

export const StrictModeDroppable: React.FC<StrictModeDroppableProps> = ({ children, ...props }) => {
  const [enabled, setEnabled] = useState<boolean>(false);
  
  useEffect(() => {
    // 在第一次渲染後啟用，避免嚴格模式下的雙重渲染問題
    const animation = requestAnimationFrame(() => setEnabled(true));
    
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);
  
  if (!enabled) {
    return null;
  }
  
  return <Droppable {...props}>{children}</Droppable>;
};

export default StrictModeDroppable;