import { useReport } from '../../data/dgoData';

function formatViews(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n);
}

export default function TabReconocimientosTransparencia() {
  const { reconocimientosTemas } = useReport()
  return (
    <>
      <div className="section-label">Reconocimientos y Transparencia · 3–5 Mar 2026</div>

      {/* ─── Reconocimientos ─── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-title">Reconocimientos</div>
          <div className="card-question">Temas y acciones municipales con mayor reconocimiento ciudadano (vistas y likes).</div>
        </div>
        <div className="card-body" style={{ padding: '14px 20px' }}>
          <div style={{ display: 'grid', gap: 12 }}>
            {reconocimientosTemas.slice(0, 4).map((t, i) => (
              <div
                key={i}
                style={{
                  padding: 14,
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{t.titulo}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.45 }}>{t.descripcion}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
                    <span style={{ fontSize: 12 }}><strong>{formatViews(t.metricas.views)}</strong> vistas</span>
                    <span style={{ fontSize: 12 }}><strong>{formatViews(t.metricas.likes)}</strong> likes</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
