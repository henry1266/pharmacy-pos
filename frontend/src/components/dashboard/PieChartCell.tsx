import React, { FC } from 'react';
import { Cell } from 'recharts';

/**
 * 圓餅圖資料項目介面
 */
interface ChartEntry {
  category: string;
  totalSales: number;
}

/**
 * PieChartCell 元件的 Props 介面
 */
interface PieChartCellProps {
  entry: ChartEntry;
  index: number;
  colors: string[];
}

/**
 * 完全獨立的 PieChartCell 元件
 */
const PieChartCell: FC<PieChartCellProps> = ({ entry, index, colors }) => (
  <Cell key={`cell-${entry.category}`} fill={colors[index % colors.length]} />
);


export default PieChartCell;