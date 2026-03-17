import { useReport } from '../../data/dgoData'

type TabId = 'toc' | 'scorecard' | 'sentimiento' | 'alcance' | 'aprobacion' | 'reconocimientos' | 'mapa'

const TOC_INDEX: { id: Exclude<TabId, 'toc' | 'scorecard'>; num: number; title: string; desc: string; bullets: string[] }[] = [
  { id: 'sentimiento', num: 1, title: 'Sentimiento', desc: 'Análisis de la percepción ciudadana: distribución positiva, neutral y negativa de las menciones del municipio.', bullets: ['Distribución de sentimiento', 'Tendencia mensual', 'Sentimiento por red social', 'Temas con mayor rechazo'] },
  { id: 'aprobacion', num: 2, title: 'Aprobación Ciudadana', desc: 'Niveles de aprobación y rechazo por área municipal según la percepción en redes y medios.', bullets: ['Áreas municipales (mayor a menor aprobación)', 'Comparativo a favor / en contra', 'Tendencia de aprobación'] },
  { id: 'alcance', num: 3, title: 'Alcance y Cobertura', desc: 'Volumen de menciones distribuido por red social y medio de comunicación, incluyendo noticias y cobertura periodística.', bullets: ['Menciones por red social', 'Menciones en medios y noticias', 'Evolución del alcance'] },
  { id: 'reconocimientos', num: 4, title: 'Reconocimientos y Transparencia', desc: 'Temas de reconocimiento ciudadano y oportunidades de comunicación.', bullets: ['Temas de reconocimiento', 'Oportunidades', 'Transparencia'] },
  { id: 'mapa', num: 5, title: 'Mapa de Quejas', desc: 'Quejas ciudadanas geolocalizadas y distribución por categoría.', bullets: ['Quejas por ubicación', 'Categorías de quejas', 'Nivel de queja'] },
]

export default function TabTOC({
  onSwitchTab,
}: {
  onSwitchTab: (id: TabId) => void
}) {
  const { socialMentions, sentimentKPI, interactionRate, citizenApproval, agentSummary, municipio, periodo } = useReport()
  return (
    <>
      <div className="toc-hero">
        <div className="toc-hero-title">
          <h2>
            Tablero Inteligente · <span className="gold-accent">{municipio}</span>
          </h2>
          <p>Reporte de desempeño digital y percepción ciudadana · {periodo}</p>
        </div>
        <div className="toc-hero-kpis">
          <div className="toc-hero-kpi">
            <div className="val gold-accent">{socialMentions}</div>
            <div className="lbl">Menciones totales</div>
          </div>
          <div className="toc-hero-kpi">
            <div className="val">{Math.round(sentimentKPI.positive)}%</div>
            <div className="lbl">Sentimiento positivo</div>
          </div>
          <div className="toc-hero-kpi">
            <div className="val gold-accent">{interactionRate}%</div>
            <div className="lbl">Tasa de interacción</div>
          </div>
          <div className="toc-hero-kpi">
            <div className="val">{Math.round(citizenApproval)}%</div>
            <div className="lbl">Aprobación ciudadana</div>
          </div>
        </div>
      </div>

      <div
        className="toc-brief"
        style={{
          marginTop: 20,
          marginBottom: 28,
          padding: '24px 28px',
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: 12,
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 14,
            color: 'var(--teal-dark)',
          }}
        >
          Resumen del período ({periodo})
        </div>

        {agentSummary.narrativa && (
          <p style={{ margin: '0 0 16px', fontSize: 15, lineHeight: 1.6, color: 'var(--text)' }}>
            {agentSummary.narrativa}
          </p>
        )}

        {agentSummary.bullets.length > 0 && (
          <ul style={{ margin: 0, paddingLeft: 22, fontSize: 14, lineHeight: 1.65, color: 'var(--muted)' }}>
            {agentSummary.bullets.map((bullet, i) => (
              <li key={i}>{bullet}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="toc-grid" style={{ marginTop: 28, marginBottom: 32 }}>
        {TOC_INDEX.map((item) => (
          <button
            key={item.id}
            type="button"
            className="toc-card"
            onClick={() => onSwitchTab(item.id)}
            style={{ textAlign: 'left', border: 'none', font: 'inherit' }}
          >
            <div className={`toc-header ${item.num % 2 === 0 ? 'mid' : ''}`}>
              <span className="toc-number">{item.num}</span>
              <span className="toc-card-title">{item.title}</span>
            </div>
            <div className="toc-body">
              <p className="toc-desc">{item.desc}</p>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.6, color: 'var(--muted)' }}>
                {item.bullets.map((b, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: 'var(--teal-mid)' }}>→</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </button>
        ))}
      </div>
    </>
  )
}
