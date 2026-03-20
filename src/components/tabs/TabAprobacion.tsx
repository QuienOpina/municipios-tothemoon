import { useMemo, useState } from 'react';
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

// Comentarios hardcodeados para los tooltips de sentimiento
const SENTIMENT_COMMENTS = {
  positive: [
    "Usuarios valoran programas municipales que entregan calzado escolar y mensajes ambientales, percibiendo apoyo directo a niñas, niños y educación.",
    "El aumento salarial, seguro de vida mejorado y capacitación policial generan percepción de dignificación laboral y fortalecimiento de la seguridad.",
    "Comentarios resaltan a Betzabé Martínez como presidenta trabajadora, cercana a la gente, con carisma hacia infancia y presencia constante.",
    "Se reconoce el impulso municipal a mujeres mediante conferencias motivacionales, actividades recreativas y símbolos colectivos de lucha y unión.",
    "La coordinación con gobierno federal y programas como La Escuela es Nuestra se perciben como respaldo importante al desarrollo local.",
    "La participación conjunta de ciudadanía, diputaciones y ayuntamiento en obras como luminarias refuerza percepción de comunidad organizada y responsable.",
  ],
  negative: [
    "Frecuentes quejas por baches, drenajes colapsados y alcantarillas deficientes alimentan percepción de abandono urbano y mala gestión básica.",
    "Habitantes reportan desabasto prolongado de agua potable en colonias específicas, exigiendo priorizar soluciones hidráulicas sobre obras cosméticas.",
    "Noticias de balaceras, amenazas en escuelas, objetos explosivos y actividad de punteros refuerzan sensación de inseguridad persistente en Gómez Palacio.",
    "Comentarios acusan corrupción municipal y policial, mencionando cuotas a transportistas, extorsiones, abusos en moteles y desconfianza hacia servidores públicos.",
    "Algunos consideran que la presidenta prioriza publicidad, fotografías y lealtad partidista, mientras persisten problemas de infraestructura, servicios y rezago urbano.",
    "Denuncias sobre maltrato en control canino y presunta negligencia médica local generan críticas a supervisión municipal en salud y bienestar.",
  ],
  neutral: [
    "Varios usuarios comparten notas policiacas, accidentes y hallazgos extraños en Gómez Palacio solo como información, sin emitir juicios explícitos.",
    "Hay comentarios que formulan peticiones específicas sobre carreteras, turnos escolares o servicios, manteniendo tono respetuoso y expectativa moderada de respuesta.",
    "Algunos comparan Gómez Palacio con municipios vecinos en infraestructura y prestaciones laborales, describiendo diferencias sin culpar directamente a autoridades actuales.",
    "Relatos sobre atención en instituciones de salud locales mezclan experiencias favorables y críticas, generando evaluación matizada del contexto médico municipal.",
  ],
};

// Fallback hardcodeado — se usa solo si sentimentByPlatform viene vacío del JSON
const FALLBACK_SENTIMENT_BY_PLATFORM: Record<string, { positive: number; neutral: number; negative: number }> = {
  Instagram:    { positive: 83, neutral: 12, negative: 5  },
  'Twitter/X':  { positive: 62, neutral: 20, negative: 18 },
  TikTok:       { positive: 45, neutral: 30, negative: 25 },
  'Google News':{ positive: 17, neutral: 47, negative: 36 },
  Facebook:     { positive: 10, neutral: 6,  negative: 84 },
};

export default function TabAprobacion() {
  const { scorecardPeriodoAnterior, approvalTrend, serviceApprovals, sentimentKPI, periodo, sentimentByPlatform } = useReport()
  const [hoveredCard, setHoveredCard] = useState<'positive' | 'negative' | 'neutral' | null>(null);
  
  // Valores actuales del sentimiento (suman 100%)
  const positivoActual = Math.round(sentimentKPI.positive);
  const negativoActual = Math.round(sentimentKPI.negative);
  const neutralActual = Math.round(sentimentKPI.neutral);
  
  // Comparaciones con período anterior
  // Si no hay datos del período anterior (undefined), la diferencia será el valor actual completo
  const prevPositivo = scorecardPeriodoAnterior.sentimentPositive;
  const prevNegativo = scorecardPeriodoAnterior.sentimentNegative;
  const prevNeutral = scorecardPeriodoAnterior.sentimentNeutral;
  
  const diffPositivo = prevPositivo !== undefined ? positivoActual - prevPositivo : positivoActual;
  const diffNegativo = prevNegativo !== undefined ? negativoActual - prevNegativo : negativoActual;
  const diffNeutral = prevNeutral !== undefined ? neutralActual - prevNeutral : neutralActual;

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

  // Derivar tabla de áreas desde serviceApprovals — solo áreas con quejas reales (count > 0)
  // Ordenadas de mayor a menor count (las más mencionadas primero)
  const maxCount = serviceApprovals.reduce((m, s) => Math.max(m, s.count ?? 0), 1);
  const ACTORS_SHORT = serviceApprovals
    .map((s) => ({
      name:  s.service,
      neg:   Math.round(100 - s.approval),
      count: s.count ?? 0,
    }))
    .filter((a) => a.count > 0)
    .sort((a, b) => b.count - a.count);

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
        <div 
          style={{ position: 'relative', overflow: 'visible' }}
          onMouseEnter={() => setHoveredCard('positive')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div 
            className="kpi-card accent-green"
            style={{ cursor: 'pointer' }}
          >
            <div className="kpi-label">Positivo</div>
            <div className="kpi-value">{positivoActual}%</div>
            <span className={`kpi-delta ${diffPositivo >= 0 ? 'up' : 'down'}`}>
              {diffPositivo >= 0 ? '▲' : '▼'} {Math.round(Math.abs(diffPositivo))} pts
            </span>
            <span className="kpi-period">vs. período anterior</span>
          </div>
          {hoveredCard === 'positive' && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '8px',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  color: 'var(--positive)',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '12px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                Comentarios Positivos:
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {SENTIMENT_COMMENTS.positive.map((comment, idx) => (
                  <li key={idx} style={{ marginBottom: '10px', fontSize: '13px', lineHeight: '1.6', color: 'var(--text)' }}>
                    {comment}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div 
          style={{ position: 'relative', overflow: 'visible' }}
          onMouseEnter={() => setHoveredCard('negative')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div 
            className="kpi-card accent-red"
            style={{ cursor: 'pointer' }}
          >
            <div className="kpi-label">Negativo</div>
            <div className="kpi-value">{negativoActual}%</div>
            <span className={`kpi-delta ${diffNegativo >= 0 ? 'up' : 'down'}`}>
              {diffNegativo >= 0 ? '▲' : '▼'} {Math.round(Math.abs(diffNegativo))} pts
            </span>
            <span className="kpi-period">vs. período anterior</span>
          </div>
          {hoveredCard === 'negative' && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '8px',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  color: 'var(--negative)',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '12px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                Comentarios Negativos:
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {SENTIMENT_COMMENTS.negative.map((comment, idx) => (
                  <li key={idx} style={{ marginBottom: '10px', fontSize: '13px', lineHeight: '1.6', color: 'var(--text)' }}>
                    {comment}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div 
          style={{ position: 'relative', overflow: 'visible' }}
          onMouseEnter={() => setHoveredCard('neutral')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div 
            className="kpi-card accent-gold"
            style={{ cursor: 'pointer' }}
          >
            <div className="kpi-label">Neutral</div>
            <div className="kpi-value">{neutralActual}%</div>
            <span className={`kpi-delta ${diffNeutral >= 0 ? 'up' : 'down'}`}>
              {diffNeutral >= 0 ? '▲' : '▼'} {Math.round(Math.abs(diffNeutral))} pts
            </span>
            <span className="kpi-period">vs. período anterior</span>
          </div>
          {hoveredCard === 'neutral' && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '8px',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  color: 'var(--gold)',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '12px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                Comentarios Neutrales:
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {SENTIMENT_COMMENTS.neutral.map((comment, idx) => (
                  <li key={idx} style={{ marginBottom: '10px', fontSize: '13px', lineHeight: '1.6', color: 'var(--text)' }}>
                    {comment}
                  </li>
                ))}
              </ul>
            </div>
          )}
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
                  <th className="bar-cell">Quejas ciudadanas</th>
                  <th>Quejas</th>
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
                      <div className="bar-track">
                        <div
                          className="bar-fill neg"
                          style={{ width: `${Math.round((a.count / maxCount) * 100)}%` }}
                        />
                      </div>
                    </td>
                    <td>
                      <span className="pct-badge neg">{a.count}</span>
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
