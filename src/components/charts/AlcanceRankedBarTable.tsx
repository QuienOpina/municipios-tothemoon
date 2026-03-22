/** Tabla de barras horizontales para Alcance y Cobertura (tema claro, un color por gráfica) */

export type AlcanceRankRow = { label: string; value: number };

type Props = {
  rows: AlcanceRankRow[];
  entityHeader: string;
  /** Color de relleno de la barra (mismo para todas las filas de esta gráfica) */
  barColor: string;
  /** Color de la pastilla del valor (típicamente un tono más oscuro del mismo matiz) */
  badgeColor: string;
  barColumnHeader?: string;
  valueHeader?: string;
};

export default function AlcanceRankedBarTable({
  rows,
  entityHeader,
  barColor,
  badgeColor,
  barColumnHeader = 'Distribución relativa',
  valueHeader = 'Menciones',
}: Props) {
  const max = rows.reduce((m, r) => Math.max(m, r.value), 0) || 1;

  return (
    <div className="alcance-hbar-table-wrap">
      <table className="alcance-hbar-table">
        <thead>
          <tr>
            <th className="alcance-hbar-th alcance-hbar-th-num">#</th>
            <th className="alcance-hbar-th">{entityHeader}</th>
            <th className="alcance-hbar-th alcance-hbar-th-bar">{barColumnHeader}</th>
            <th className="alcance-hbar-th alcance-hbar-th-val">{valueHeader}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const pct = max ? (row.value / max) * 100 : 0;
            return (
              <tr key={`${row.label}-${i}`}>
                <td className="alcance-hbar-td alcance-hbar-td-num">{i + 1}</td>
                <td className="alcance-hbar-td alcance-hbar-td-label">{row.label}</td>
                <td className="alcance-hbar-td alcance-hbar-td-bar">
                  <div className="alcance-hbar-track">
                    <div
                      className="alcance-hbar-fill"
                      style={{ width: `${pct}%`, background: barColor }}
                    />
                  </div>
                </td>
                <td className="alcance-hbar-td alcance-hbar-td-badge-cell">
                  <span className="alcance-hbar-badge" style={{ background: badgeColor }}>
                    {row.value.toLocaleString()}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
