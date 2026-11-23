"use client";

type Point = { day: string; total_cents: number };
type Props = { sales: Point[]; purchases: Point[] };

// ProcureSense stores monetary values as millimes (1 DT = 1,000 millimes).
const formatAmount = (millimes: number) =>
  `${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(millimes / 1000)} DT`;

const formatTick = (millimes: number) =>
  `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 3 }).format(millimes / 1000)} DT`;

const formatMonth = (month: string) => {
  const [year, number] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", { month: "short", year: "numeric" })
    .format(new Date(year, number - 1, 1));
};

export default function BiTrendChart({ sales, purchases }: Props) {
  const months = new Map<string, { sales: number; purchases: number }>();

  for (const [key, rows] of [["sales", sales], ["purchases", purchases]] as const) {
    for (const row of rows) {
      const month = String(row.day).slice(0, 7);
      if (!/^\d{4}-\d{2}$/.test(month)) continue;
      const value = months.get(month) || { sales: 0, purchases: 0 };
      value[key] += Math.max(0, Number(row.total_cents) || 0);
      months.set(month, value);
    }
  }

  const points = [...months.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-12);
  const max = Math.max(0, ...points.flatMap(([, value]) => [value.sales, value.purchases]));
  const scaleMax = max || 1000;

  const width = 900;
  const height = 310;
  const plotLeft = 108;
  const plotRight = 884;
  const plotTop = 44;
  const plotBottom = 248;
  const plotHeight = plotBottom - plotTop;
  const plotWidth = plotRight - plotLeft;
  const tickCount = 4;
  const groupWidth = points.length ? plotWidth / points.length : 0;

  return (
    <section className="chart-panel" aria-label="Ventes et achats par mois">
      <div className="chart-title">
        <div>
          <h3>Ventes et achats par mois</h3>
          <p>Ventes confirmées et commandes d’achat non annulées · montants en DT</p>
        </div>
        <div className="legend" aria-label="Légende du graphique">
          <span><i className="legend-sales" />Ventes</span>
          <span><i className="legend-purchases" />Achats</span>
        </div>
      </div>

      {points.length ? (
        <div className="chart-scroll">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label="Comparaison mensuelle des ventes confirmées et des achats non annulés, en dinars tunisiens"
            className="bi-chart"
          >
            <text x={plotLeft} y="24" className="axis-caption">Montant (DT)</text>
            {Array.from({ length: tickCount + 1 }, (_, index) => {
              const fraction = index / tickCount;
              const y = plotBottom - fraction * plotHeight;
              return (
                <g key={index}>
                  <line
                    x1={plotLeft}
                    x2={plotRight}
                    y1={y}
                    y2={y}
                    className={index === 0 ? "chart-baseline" : "chart-gridline"}
                  />
                  <text x={plotLeft - 12} y={y + 4} textAnchor="end" className="axis-label">
                    {formatTick(scaleMax * fraction)}
                  </text>
                </g>
              );
            })}

            {points.map(([month, value], index) => {
              const groupX = plotLeft + index * groupWidth;
              const barGap = 7;
              const barWidth = Math.max(10, Math.min(28, (groupWidth - 26) / 2));
              const pairWidth = barWidth * 2 + barGap;
              const x = groupX + (groupWidth - pairWidth) / 2;
              const salesHeight = (value.sales / scaleMax) * plotHeight;
              const purchasesHeight = (value.purchases / scaleMax) * plotHeight;
              const label = formatMonth(month);

              return (
                <g key={month} className="chart-month">
                  {value.sales > 0 && (
                    <rect
                      x={x}
                      y={plotBottom - salesHeight}
                      width={barWidth}
                      height={salesHeight}
                      rx="4"
                      className="chart-bar-sales"
                    >
                      <title>{`${label} · ventes confirmées : ${formatAmount(value.sales)}`}</title>
                    </rect>
                  )}
                  {value.purchases > 0 && (
                    <rect
                      x={x + barWidth + barGap}
                      y={plotBottom - purchasesHeight}
                      width={barWidth}
                      height={purchasesHeight}
                      rx="4"
                      className="chart-bar-purchases"
                    >
                      <title>{`${label} · achats non annulés : ${formatAmount(value.purchases)}`}</title>
                    </rect>
                  )}
                  <text x={groupX + groupWidth / 2} y="277" textAnchor="middle" className="month-label">
                    {label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      ) : (
        <p className="empty-chart">Aucune commande sur la période sélectionnée.</p>
      )}
    </section>
  );
}

