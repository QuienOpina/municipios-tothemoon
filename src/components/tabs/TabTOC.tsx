import { useReport } from '../../data/dgoData'

type TabId = 'toc' | 'scorecard' | 'sentimiento' | 'alcance' | 'aprobacion' | 'reconocimientos' | 'mapa'

export default function TabTOC({
  onSwitchTab: _onSwitchTab,
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
    </>
  )
}
