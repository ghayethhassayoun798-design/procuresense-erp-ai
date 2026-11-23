"use client";

type Point = { day: string; total_cents: number };
type Props = { sales: Point[]; purchases: Point[] };
const money = (value: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value / 100);
export default function BiTrendChart({ sales, purchases }: Props) {
  const months = new Map<string, { sales: number; purchases: number }>();
  for (const [key, rows] of [["sales", sales], ["purchases", purchases]] as const) {
    for (const row of rows) {
      const month = String(row.day).slice(0, 7);
      const value = months.get(month) || { sales: 0, purchases: 0 };
      value[key] += Number(row.total_cents) || 0;
      months.set(month, value);
    }
  }
  const points = [...months.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-12);
  const max = Math.max(1, ...points.flatMap(([, v]) => [v.sales, v.purchases]));
  const width = 760, height = 240, chartTop = 24, chartBottom = 184, chartHeight = chartBottom - chartTop;
  const groupWidth = points.length ? (width - 48) / points.length : 0;
  return <section className="chart-panel" aria-label="Graphique des ventes et achats par mois">
    <div className="chart-title"><div><h3>Tendance mensuelle</h3><p>Montants des commandes confirmées et achats enregistrés</p></div><div className="legend"><span><i className="legend-sales"/>Ventes</span><span><i className="legend-purchases"/>Achats</span></div></div>
    {points.length ? <div className="chart-scroll"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Barres mensuelles comparant ventes et achats" className="bi-chart">
      {[0, 1, 2, 3].map(i => { const y = chartTop + chartHeight * i / 3; return <g key={i}><line x1="42" x2={width - 8} y1={y} y2={y} stroke="#edf1ee"/><text x="36" y={y + 4} textAnchor="end" className="axis-label">{money(max * (3 - i) / 3)}</text></g>; })}
      {points.map(([month, value], i) => { const x = 48 + i * groupWidth + groupWidth * .16, barWidth = Math.max(5, Math.min(24, groupWidth * .3)); const salesHeight = value.sales / max * chartHeight, purchaseHeight = value.purchases / max * chartHeight; return <g key={month}><rect x={x} y={chartBottom - salesHeight} width={barWidth} height={salesHeight} rx="3" fill="#16865b"><title>{month} · ventes {money(value.sales)}</title></rect><rect x={x + barWidth + 4} y={chartBottom - purchaseHeight} width={barWidth} height={purchaseHeight} rx="3" fill="#91b9a4"><title>{month} · achats {money(value.purchases)}</title></rect><text x={x + barWidth} y="207" textAnchor="middle" className="month-label">{new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" }).format(new Date(`${month}-01T12:00:00`))}</text></g>; })}
    </svg></div> : <p className="empty-chart">Aucune transaction sur la période choisie.</p>}
  </section>;
}
