import React, { FC } from 'react';

/**
 * LegendFormatter 元件的 Props 介面
 */
interface LegendFormatterProps {
  value: string;
  color: string;
}

/**
 * Component for formatting legend items with custom styling
 */
const LegendFormatter: FC<LegendFormatterProps> = ({ value, color }) => {
  return <span style={{ color }}>{value}</span>;
};


export default LegendFormatter;