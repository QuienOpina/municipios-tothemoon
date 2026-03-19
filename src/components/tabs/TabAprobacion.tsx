import { useMemo } from 'react';
import ChartJSWrapper from '../charts/ChartJSWrapper';
import { useReport } from '../../data/dgoData';

const GREEN = '#1a9650';
const RED = '#d62728';

// Plataformas en el orden esperado por el frontend
const PLATFORM_ORDER = ['Instagram', 'Twitter/X', 'TikTok', 'Google News', 'Facebook'];
// Para la gráfica "Sentimiento por Red Social": todas menos Google News (X se muestra aunque no tenga datos)
const PLATFORM_ORDER_CHART = PLATFORM_ORDER.filter((p) => p !== 'Google News');
// Etiqueta a mostrar en la gráfica (X en vez de Twitter/X)
const PLATFORM_LABEL: Record<string, string> = { 'Twitter/X': 'X' };

// Fallback hardcodeado — se usa solo si sentimentByPlatform viene vacío del JSON
const FALLBACK_SENTIMENT_BY_PLATFORM: Record<string, { positive: number; neutral: number; negative: number }> = {
  Instagram:    { positive: 83, neutral: 12, negative: 5  },
  'Twitter/X':  { positive: 62, neutral: 20, negative: 18 },
  TikTok:       { positive: 45, neutral: 30, negative: 25 },
  'Google News':{ positive: 17, neutral: 47, negative: 36 },
  Facebook:     { positive: 10, neutral: 6,  negative: 84 },
};

export default function TabAprobacion() {
  const { citizenApproval, scorecardPeriodoAnterior, approvalTrend, serviceApprovals, sentimentKPI, periodo, sentimentByPlatform } = useReport()
  const diffAprobacion = citizenApproval - scorecardPeriodoAnterior.citizenApproval;

  // Determinar qué plataformas y datos usar (JSON dinámico con fallback)
  const hasSentimentByPlatform = Object.keys(sentimentByPlatform).length > 0;
  const byPlatform = hasSentimentByPlatform ? sentimentByPlatform : FALLBACK_SENTIMENT_BY_PLATFORM;

  // Claves para datos (API puede enviar "Twitter/X"); etiquetas para el eje (mostramos "X")
  const platformDataKeys = PLATFORM_ORDER_CHART;
  const platformLabels = platformDataKeys.map((p) => PLATFORM_LABEL[p] ?? p);

  // Normalizar datos que vengan en escala 0–10 a 0–100 para el gráfico
  const platformScale = useMemo(() => {
    const all = platformDataKeys.flatMap((p) => {
      const e = byPlatform[p];
      return e ? [e.positive, e.negative] : [];
    });
    const max = all.length ? Math.max(...all) : 0;
    return max > 0 && max <= 10 ? 10 : 1;
  }, [platformDataKeys, byPlatform]);

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
            min: 0,
            max: 100,
            grid: { color: '#f0f2f5' },
            border: { dash: [4, 4] },
            ticks: {
              stepSize: 10,
              callback(tickValue: string | number) {
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

  // Gráfica de sentimiento por red social — sin neutral (solo positivo y negativo)
  const chartSentimientoRedes = useMemo(
    () => ({
      type: 'bar' as const,
      data: {
        labels: platformLabels,
        datasets: [
          { label: 'Positivo', data: platformDataKeys.map((p) => (byPlatform[p]?.positive ?? 0) * platformScale), backgroundColor: GREEN + 'cc', borderRadius: 4 },
          { label: 'Negativo', data: platformDataKeys.map((p) => (byPlatform[p]?.negative ?? 0) * platformScale), backgroundColor: RED + 'cc', borderRadius: 4 },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: { grid: { display: false }, stacked: false },
          y: {
            min: 0,
            max: 100,
            grid: { color: '#f0f2f5' },
            border: { dash: [4, 4] },
            ticks: {
              stepSize: 10,
              callback(tickValue: string | number) {
                const v = typeof tickValue === 'string' ? Number(tickValue) : tickValue;
                return `${v}%`;
              },
            },
          },
        },
      },
    }),
    [platformLabels, platformDataKeys, byPlatform, platformScale]
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

      <div className="grid g2" style={{ marginTop: 24 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Sentimiento por Red Social</div>
            <div className="card-question">¿En qué plataformas se concentra el mayor sentimiento positivo o negativo?</div>
          </div>
          <div className="card-body">
            <div className="chart-wrap chart-wrap-tall">
              <ChartJSWrapper config={chartSentimientoRedes} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
