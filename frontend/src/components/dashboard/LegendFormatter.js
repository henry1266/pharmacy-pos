import React from 'react';
import PropTypes from 'prop-types';

/**
 * Component for formatting legend items with custom styling
 */
const LegendFormatter = ({ value, color }) => {
  return <span style={{ color }}>{value}</span>;
};

LegendFormatter.propTypes = {
  value: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired
};

export default LegendFormatter;