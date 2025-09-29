const data = require('./coverage/coverage-summary.json');
const entries = Object.entries(data).filter(([key]) => key !== 'total');
const sorted = entries.sort((a, b) => {
  const uncoveredA = a[1].statements.total * (1 - a[1].statements.pct / 100);
  const uncoveredB = b[1].statements.total * (1 - b[1].statements.pct / 100);
  return uncoveredB - uncoveredA;
});
for (const [path, stats] of sorted.slice(0, 30)) {
  console.log(`${stats.statements.total} stmts, ${stats.statements.pct.toFixed(1)}% stmts, ${stats.branches.pct.toFixed(1)}% branches, ${stats.functions.pct.toFixed(1)}% functions -> ${path}`);
}
