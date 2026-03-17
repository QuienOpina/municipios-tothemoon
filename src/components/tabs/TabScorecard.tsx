import { useMemo } from 'react';
import ChartJSWrapper from '../charts/ChartJSWrapper';
import { useReport } from '../../data/dgoData';

const TEAL = '#247a8a';
const GOLD = '#e8a020';

export default function TabScorecard() {
  const { socialMentions, sentimentKPI, interactionRate, followersActual, scorecardPeriodoAnterior, interactionTrendData, socialMentionsTrend, seguidoresTrend, periodo } = useReport()
  const diffMenciones = socialMentions - scorecardPeriodoAnterior.socialMentions;
  const diffSentimiento = sentimentKPI.positive - scorecardPeriodoAnterior.sentimentPositive;
  const diffInteraccion = interactionRate - scorecardPeriodoAnterior.interactionRate;
  const diffSeguidores = followersActual - scorecardPeriodoAnterior.followers;

  const chartMenciones = useMemo(
    () => ({
      type: 'line' as const,
      data: {
        labels: socialMentionsTrend.map((d) => d.date),
        datasets: [
          {
            label: 'Menciones',
            data: socialMentionsTrend.map((d) => d.mentions),
            borderColor: TEAL,
            backgroundColor: TEAL + '22',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' as const } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: '#f0f2f5' }, border: { dash: [4, 4] } },
        },
      },
    }),
    []
  );

  const chartInteraccion = useMemo(
    () => ({
      type: 'line' as const,
      data: {
        labels: interactionTrendData.map((d) => d.month),
        datasets: [
          {
            label: 'Tasa de Interacción (%)',
            data: interactionTrendData.map((d) => d.rate),
            borderColor: GOLD,
            backgroundColor: GOLD + '22',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' as const } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: '#f0f2f5' }, border: { dash: [4, 4] } },
        },
      },
    }),
    []
  );

  const chartAlcance = useMemo(
    () => ({
      type: 'bar' as const,
      data: {
        labels: seguidoresTrend.map((d) => d.date),
        datasets: [
          {
            label: 'Seguidores (K)',
            data: seguidoresTrend.map((d) => d.followers),
            backgroundColor: TEAL + 'cc',
            borderRadius: 5,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: {
            grid: { color: '#f0f2f5' },
            border: { dash: [4, 4] },
            ticks: {
              callback(_scale: unknown, tickValue: string | number) {
                const v = typeof tickValue === 'string' ? Number(tickValue) : tickValue;
                return `${v}K`;
              },
            },
          },
        },
      },
    }),
    []
  );

  return (
    <>
      <div className="section-label">Indicadores Clave · {periodo}</div>

      <div className="grid g4" style={{ marginBottom: 24 }}>
        <div className="kpi-card">
          <div className="kpi-label">Total Menciones</div>
          <div className="kpi-value">{socialMentions}</div>
          <span className={`kpi-delta ${diffMenciones >= 0 ? 'up' : 'down'}`}>
            {diffMenciones >= 0 ? '▲' : '▼'} {diffMenciones >= 0 ? '+' : ''}{diffMenciones} menciones
          </span>
          <span className="kpi-period">vs. periodo anterior</span>
        </div>
        <div className="kpi-card accent-red">
          <div className="kpi-label">Sentimiento Positivo</div>
          <div className="kpi-value">{Math.round(sentimentKPI.positive)}%</div>
          <span className={`kpi-delta ${diffSentimiento >= 0 ? 'up' : 'down'}`}>
            {diffSentimiento >= 0 ? '▲' : '▼'} {diffSentimiento >= 0 ? '+' : ''}{Math.round(diffSentimiento)} pts
          </span>
          <span className="kpi-period">vs. periodo anterior</span>
        </div>
        <div className="kpi-card accent-gold">
          <div className="kpi-label">Tasa de Interacción</div>
          <div className="kpi-value">{interactionRate}%</div>
          <span className={`kpi-delta ${diffInteraccion >= 0 ? 'up' : 'down'}`}>
            {diffInteraccion >= 0 ? '▲' : '▼'} {diffInteraccion >= 0 ? '+' : ''}{Math.round(diffInteraccion)} pts
          </span>
          <span className="kpi-period">vs. periodo anterior</span>
        </div>
        <div className="kpi-card accent-green">
          <div className="kpi-label">Seguidores Canales Of.</div>
          <div className="kpi-value">{followersActual}K</div>
          <span className={`kpi-delta ${diffSeguidores >= 0 ? 'up' : 'down'}`}>
            {diffSeguidores >= 0 ? '▲' : '▼'} {diffSeguidores >= 0 ? '+' : ''}{diffSeguidores}K
          </span>
          <span className="kpi-period">vs. periodo anterior</span>
        </div>
      </div>

      <div className="section-label">Tendencia del Período ({periodo})</div>

      <div className="grid g2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Menciones Totales</div>
            <div className="card-question">¿Cómo evolucionó el volumen de menciones durante el período de monitoreo?</div>
          </div>
          <div className="card-body">
            <div className="chart-wrap">
              <ChartJSWrapper config={chartMenciones} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header mid">
            <div className="card-title">Tasa de Interacción</div>
            <div className="card-question">¿Qué tan activa es la audiencia en respuesta al contenido publicado?</div>
          </div>
          <div className="card-body">
            <div className="chart-wrap">
              <ChartJSWrapper config={chartInteraccion} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18 }} className="grid g2">
        <div className="card">
          <div className="card-header lighter">
            <div className="card-title">Seguidores Canales Oficiales</div>
            <div className="card-question">¿Cómo evolucionaron los seguidores en canales oficiales durante el período?</div>
          </div>
          <div className="card-body">
            <div className="chart-wrap">
              <ChartJSWrapper config={chartAlcance} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Distribución de Sentimiento</div>
            <div className="card-question">¿Cuál es la proporción de menciones positivas, neutrales y negativas este mes?</div>
          </div>
          <div className="card-body">
            <div className="sentiment-bar">
              <div style={{ width: `${sentimentKPI.positive}%` }} className="sent-pos">
                {Math.round(sentimentKPI.positive)}%
              </div>
              <div style={{ width: `${sentimentKPI.neutral}%` }} className="sent-neu">
                {Math.round(sentimentKPI.neutral)}%
              </div>
              <div style={{ width: `${sentimentKPI.negative}%` }} className="sent-neg">
                {Math.round(sentimentKPI.negative)}%
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 14 }}>
              Distribución sobre el total de {socialMentions} menciones del período
            </div>
            <div className="sentiment-legend">
              <div className="leg-item">
                <div className="leg-dot" style={{ background: 'var(--positive)' }} />
                Positivo — {Math.round(sentimentKPI.positive)}%{' '}
                <strong style={{ marginLeft: 4, color: 'var(--negative)' }}>
                  ▼ {Math.round(diffSentimiento)} pts
                </strong>
              </div>
              <div className="leg-item">
                <div className="leg-dot" style={{ background: 'var(--neutral)' }} />
                Neutral — {sentimentKPI.neutral}%
              </div>
              <div className="leg-item">
                <div className="leg-dot" style={{ background: 'var(--negative)' }} />
                Negativo — {Math.round(sentimentKPI.negative)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
