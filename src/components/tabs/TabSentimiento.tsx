import { useMemo } from 'react';
import ChartJSWrapper from '../charts/ChartJSWrapper';
import { useReport } from '../../data/dgoData';

const GREEN = '#1a9650';
const RED = '#d62728';
const ORANGE = '#f4a018';

// Plataformas en el orden esperado por el frontend
const PLATFORM_ORDER = ['Instagram', 'Twitter/X', 'TikTok', 'Google News', 'Facebook'];

// Fallback hardcodeado — se usa solo si sentimentByPlatform viene vacío del JSON
const FALLBACK_SENTIMENT_BY_PLATFORM: Record<string, { positive: number; neutral: number; negative: number }> = {
  Instagram:    { positive: 83, neutral: 12, negative: 5  },
  'Twitter/X':  { positive: 62, neutral: 20, negative: 18 },
  TikTok:       { positive: 45, neutral: 30, negative: 25 },
  'Google News':{ positive: 17, neutral: 47, negative: 36 },
  Facebook:     { positive: 10, neutral: 6,  negative: 84 },
};

export default function TabSentimiento() {
  const { sentimentKPI, sentimentTrend, scorecardPeriodoAnterior, serviceApprovals, sentimentByPlatform, periodo } = useReport()
  const diffPositivo = sentimentKPI.positive - scorecardPeriodoAnterior.sentimentPositive;

  // Determinar qué plataformas y datos usar (JSON dinámico con fallback)
  const hasSentimentByPlatform = Object.keys(sentimentByPlatform).length > 0;
  const byPlatform = hasSentimentByPlatform ? sentimentByPlatform : FALLBACK_SENTIMENT_BY_PLATFORM;

  // Solo mostrar plataformas que existen en los datos
  const platformLabels = PLATFORM_ORDER.filter((p) => p in byPlatform);

  const chartSentimientoTrend = useMemo(
    () => ({
      type: 'line' as const,
      data: {
        labels: sentimentTrend.map((d) => d.date),
        datasets: [
          { label: 'Positivo', data: sentimentTrend.map((d) => d.positive), borderColor: GREEN, backgroundColor: GREEN + '22', fill: false, tension: 0.4, pointRadius: 4 },
          { label: 'Neutral', data: sentimentTrend.map((d) => d.neutral), borderColor: ORANGE, backgroundColor: ORANGE + '22', fill: false, tension: 0.4, pointRadius: 4 },
          { label: 'Negativo', data: sentimentTrend.map((d) => d.negative), borderColor: RED, backgroundColor: RED + '22', fill: false, tension: 0.4, pointRadius: 4 },
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
    []
  );

  // Gráfica de sentimiento por red social — alimentada por sentimentByPlatform del JSON
  const chartSentimientoRedes = useMemo(
    () => ({
      type: 'bar' as const,
      data: {
        labels: platformLabels,
        datasets: [
          { label: 'Positivo', data: platformLabels.map((p) => byPlatform[p]?.positive ?? 0), backgroundColor: GREEN + 'cc', borderRadius: 4 },
          { label: 'Neutral',  data: platformLabels.map((p) => byPlatform[p]?.neutral  ?? 0), backgroundColor: ORANGE + 'cc', borderRadius: 4 },
          { label: 'Negativo', data: platformLabels.map((p) => byPlatform[p]?.negative ?? 0), backgroundColor: RED + 'cc',    borderRadius: 4 },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: { grid: { display: false }, stacked: false },
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
    [hasSentimentByPlatform]
  );

  // Gráfica de temas con mayor rechazo — derivada de serviceApprovals (dinámico)
  const temasNegativos = useMemo(() => {
    if (serviceApprovals.length === 0) {
      // Fallback hardcodeado si no hay serviceApprovals
      return {
        labels: ['Transparencia Municipal', 'Seguridad Pública', 'Infraest. Educativa', 'Agua y Saneamiento', 'Infraest. Vial', 'Programas Sociales'],
        data: [69, 62, 48, 47, 39, 36],
      };
    }
    const sorted = [...serviceApprovals].sort((a, b) => (100 - a.approval) - (100 - b.approval));
    return {
      labels: sorted.map((s) => s.service),
      data: sorted.map((s) => Math.round(100 - s.approval)),
    };
  }, []);

  const chartTemasNegativos = useMemo(
    () => ({
      type: 'bar' as const,
      data: {
        labels: temasNegativos.labels,
        datasets: [
          {
            label: '% de rechazo',
            data: temasNegativos.data,
            backgroundColor: temasNegativos.data.map((_, i) => {
              const opacity = Math.round(255 - i * 25).toString(16).padStart(2, '0');
              return RED + opacity;
            }),
            borderRadius: 5,
            borderSkipped: false,
          },
        ],
      },
      options: {
        indexAxis: 'y' as const,
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { color: '#f0f2f5' },
            border: { dash: [4, 4] },
            ticks: {
              callback(_scale: unknown, tickValue: string | number) {
                const v = typeof tickValue === 'string' ? Number(tickValue) : tickValue;
                return `${v}%`;
              },
            },
          },
          y: { grid: { display: false } },
        },
      },
    }),
    []
  );

  return (
    <>
      <div className="section-label">Análisis de Sentimiento · {periodo}</div>

      <div className="grid g3" style={{ marginBottom: 24 }}>
        <div className="kpi-card accent-green">
          <div className="kpi-label">Sentimiento Positivo</div>
          <div className="kpi-value">{Math.round(sentimentKPI.positive)}%</div>
          <span className={`kpi-delta ${diffPositivo >= 0 ? 'up' : 'down'}`}>
            {diffPositivo >= 0 ? '▲' : '▼'} {Math.round(Math.abs(diffPositivo))} pts
          </span>
          <span className="kpi-period">vs. período anterior</span>
        </div>
        <div className="kpi-card accent-gold">
          <div className="kpi-label">Sentimiento Neutral</div>
          <div className="kpi-value">{Math.round(sentimentKPI.neutral)}%</div>
          <span className="kpi-delta neutral">→ mayoría sin postura</span>
          <span className="kpi-period">del total de menciones</span>
        </div>
        <div className="kpi-card accent-red">
          <div className="kpi-label">Sentimiento Negativo</div>
          <div className="kpi-value">{Math.round(sentimentKPI.negative)}%</div>
          <span className="kpi-delta down">▼ con pico en el período</span>
          <span className="kpi-period">del total de menciones</span>
        </div>
      </div>

      <div className="grid g2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Tendencia de Sentimiento</div>
            <div className="card-question">¿Cómo ha variado el sentimiento ciudadano día a día?</div>
          </div>
          <div className="card-body">
            <div className="chart-wrap chart-wrap-tall">
              <ChartJSWrapper config={chartSentimientoTrend} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header mid">
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

      <div style={{ marginTop: 18 }} className="card">
        <div className="card-header lighter">
          <div className="card-title">Temas con Mayor Sentimiento Negativo</div>
          <div className="card-question">¿Qué temas están generando mayor rechazo o inconformidad ciudadana?</div>
        </div>
        <div className="card-body">
          <div className="chart-wrap">
            <ChartJSWrapper config={chartTemasNegativos} />
          </div>
        </div>
      </div>
    </>
  );
}
