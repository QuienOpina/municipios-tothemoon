import { useMemo } from 'react';
import ChartJSWrapper from '../charts/ChartJSWrapper';
import { useReport } from '../../data/dgoData';

const GREEN = '#1a9650';
const RED = '#d62728';

export default function TabAprobacion() {
  const { citizenApproval, scorecardPeriodoAnterior, approvalTrend, serviceApprovals, sentimentKPI, periodo } = useReport()
  const diffAprobacion = citizenApproval - scorecardPeriodoAnterior.citizenApproval;

  // Derivar tabla de áreas desde serviceApprovals — solo áreas con quejas reales (neg > 0)
  const ACTORS_SHORT = serviceApprovals
    .map((s) => ({
      name: s.service,
      pos: Math.round(s.approval),
      neg: Math.round(100 - s.approval),
    }))
    .filter((a) => a.neg > 0)
    .sort((a, b) => b.pos - a.pos);

  const chartAprobacionTrend = useMemo(
    () => ({
      type: 'line' as const,
      data: {
        labels: approvalTrend.map((d) => d.month),
        datasets: [
          {
            label: 'Aprobación',
            data: approvalTrend.map((d) => d.approval),
            borderColor: GREEN,
            backgroundColor: GREEN + '22',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
          },
          {
            label: 'Rechazo',
            data: approvalTrend.map((d) => 100 - d.approval),
            borderColor: RED,
            backgroundColor: RED + '11',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' as const } },
        scales: {
          x: { grid: { display: false } },
          y: {
            grid: { color: '#f0f2f5' },
            border: { dash: [4, 4] },
            ticks: {
              callback(_scale: unknown, tickValue: string | number) {
                const v = typeof tickValue === 'string' ? Number(tickValue) : tickValue;
                return `${v}%`;
              },
            },
          },
        },
      },
    }),
    [approvalTrend]
  );

  return (
    <>
      <div className="section-label">Aprobación Ciudadana · {periodo}</div>

      <div className="grid g3" style={{ marginBottom: 24 }}>
        <div className="kpi-card accent-green">
          <div className="kpi-label">Aprobación (entre quienes opinan)</div>
          <div className="kpi-value">{Math.round(citizenApproval)}%</div>
          <span className={`kpi-delta ${diffAprobacion >= 0 ? 'up' : 'down'}`}>
            {diffAprobacion >= 0 ? '▲' : '▼'} {Math.round(Math.abs(diffAprobacion))} pts
          </span>
          <span className="kpi-period">vs. período anterior</span>
        </div>
        <div className="kpi-card accent-red">
          <div className="kpi-label">Rechazo (entre quienes opinan)</div>
          <div className="kpi-value">{Math.round(100 - citizenApproval)}%</div>
          <span className="kpi-delta down">▼ pico último día</span>
          <span className="kpi-period">del período</span>
        </div>
        <div className="kpi-card accent-gold">
          <div className="kpi-label">Sin Opinión (neutral)</div>
          <div className="kpi-value">{Math.round(sentimentKPI.neutral)}%</div>
          <span className="kpi-delta neutral">→ mayoría del total</span>
          <span className="kpi-period">del total de menciones</span>
        </div>
      </div>

      <div className="grid g2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Áreas Municipales · Aprobación Ciudadana</div>
            <div className="card-question">¿Qué áreas y servicios del municipio tienen mayor aprobación ciudadana?</div>
          </div>
          <div className="card-body" style={{ padding: '14px 20px' }}>
            <table className="actors-table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>#</th>
                  <th>Área / Dependencia</th>
                  <th className="bar-cell">Distribución (a favor / en contra)</th>
                  <th>A favor</th>
                  <th>En contra</th>
                </tr>
              </thead>
              <tbody>
                {ACTORS_SHORT.map((a, i) => (
                  <tr key={a.name}>
                    <td style={{ color: 'var(--muted)', fontWeight: 700, fontSize: 12 }}>{i + 1}</td>
                    <td>
                      <span className="actor-name">{a.name}</span>
                    </td>
                    <td className="bar-cell">
                      <div className="bar-track bar-track-stacked">
                        <div className="bar-fill pos" style={{ width: `${a.pos}%` }} />
                        <div className="bar-fill neg" style={{ width: `${a.neg}%` }} />
                      </div>
                    </td>
                    <td>
                      <span className="pct-badge pos">{a.pos}%</span>
                    </td>
                    <td>
                      <span className="pct-badge neg">{a.neg}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header mid">
            <div className="card-title">Tendencia de Aprobación General</div>
            <div className="card-question">¿Cómo ha evolucionado la aprobación ciudadana en los últimos meses?</div>
          </div>
          <div className="card-body">
            <div className="chart-wrap chart-wrap-tall">
              <ChartJSWrapper config={chartAprobacionTrend} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
