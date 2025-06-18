import React, { FC } from 'react';
import PropTypes from 'prop-types';
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

PieChartCell.propTypes = {
  entry: PropTypes.shape({
    category: PropTypes.string.isRequired,
    totalSales: PropTypes.number.isRequired
  }).isRequired,
  index: PropTypes.number.isRequired,
  colors: PropTypes.arrayOf(PropTypes.string).isRequired
} as any; // 使用 any 類型來避免 TypeScript 錯誤

export default PieChartCell;