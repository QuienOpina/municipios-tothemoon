import { useMemo } from 'react';
import ChartJSWrapper from '../charts/ChartJSWrapper';
import { useReport } from '../../data/dgoData';

const GREEN = '#1a9650';
const RED = '#d62728';
const ORANGE = '#f4a018';

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

export default function TabSentimiento() {
  const { sentimentKPI, sentimentTrend, scorecardPeriodoAnterior, sentimentByPlatform, quejasPorCategoria, periodo } = useReport()
  const diffPositivo = sentimentKPI.positive - scorecardPeriodoAnterior.sentimentPositive;

  // Determinar qué plataformas y datos usar (JSON dinámico con fallback)
  const hasSentimentByPlatform = Object.keys(sentimentByPlatform).length > 0;
  const byPlatform = hasSentimentByPlatform ? sentimentByPlatform : FALLBACK_SENTIMENT_BY_PLATFORM;

  // Claves para datos (API puede enviar "Twitter/X"); etiquetas para el eje (mostramos "X")
  const platformDataKeys = PLATFORM_ORDER_CHART;
  const platformLabels = platformDataKeys.map((p) => PLATFORM_LABEL[p] ?? p);

  // Normalizar datos que vengan en escala 0–10 a 0–100 para el gráfico
  const trendScale = useMemo(() => {
    const all = sentimentTrend.flatMap((d) => [d.positive, d.neutral, d.negative]);
    const max = all.length ? Math.max(...all) : 0;
    return max > 0 && max <= 10 ? 10 : 1;
  }, [sentimentTrend]);

  const platformScale = useMemo(() => {
    const all = platformDataKeys.flatMap((p) => {
      const e = byPlatform[p];
      return e ? [e.positive, e.neutral, e.negative] : [];
    });
    const max = all.length ? Math.max(...all) : 0;
    return max > 0 && max <= 10 ? 10 : 1;
  }, [platformDataKeys, byPlatform]);

  const chartSentimientoTrend = useMemo(
    () => ({
      type: 'line' as const,
      data: {
        labels: sentimentTrend.map((d) => d.date),
        datasets: [
          { label: 'Positivo', data: sentimentTrend.map((d) => d.positive * trendScale), borderColor: GREEN, backgroundColor: GREEN + '22', fill: false, tension: 0.4, pointRadius: 4 },
          { label: 'Neutral', data: sentimentTrend.map((d) => d.neutral * trendScale), borderColor: ORANGE, backgroundColor: ORANGE + '22', fill: false, tension: 0.4, pointRadius: 4 },
          { label: 'Negativo', data: sentimentTrend.map((d) => d.negative * trendScale), borderColor: RED, backgroundColor: RED + '22', fill: false, tension: 0.4, pointRadius: 4 },
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
    [sentimentTrend, trendScale]
  );

  // Gráfica de sentimiento por red social — alimentada por sentimentByPlatform del JSON
  const chartSentimientoRedes = useMemo(
    () => ({
      type: 'bar' as const,
      data: {
        labels: platformLabels,
        datasets: [
          { label: 'Positivo', data: platformDataKeys.map((p) => (byPlatform[p]?.positive ?? 0) * platformScale), backgroundColor: GREEN + 'cc', borderRadius: 4 },
          { label: 'Neutral',  data: platformDataKeys.map((p) => (byPlatform[p]?.neutral  ?? 0) * platformScale), backgroundColor: ORANGE + 'cc', borderRadius: 4 },
          { label: 'Negativo', data: platformDataKeys.map((p) => (byPlatform[p]?.negative ?? 0) * platformScale), backgroundColor: RED + 'cc',    borderRadius: 4 },
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

  // Gráfica de temas con mayor rechazo — usa conteos absolutos de quejasPorCategoria
  // Silencio = satisfacción: solo se grafican categorías con quejas reales (count > 0)
  const temasNegativos = useMemo(() => {
    const sorted = [...quejasPorCategoria]
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count); // descendente → el mayor queda arriba en la barra horizontal
    return {
      labels: sorted.map((c) => c.categoria),
      data: sorted.map((c) => c.count),
    };
  }, [quejasPorCategoria]);

  const chartTemasNegativos = useMemo(
    () => ({
      type: 'bar' as const,
      data: {
        labels: temasNegativos.labels,
        datasets: [
          {
            label: 'Quejas',
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
                return Number.isInteger(v) ? v : '';
              },
            },
          },
          y: { grid: { display: false } },
        },
      },
    }),
    [temasNegativos]
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
