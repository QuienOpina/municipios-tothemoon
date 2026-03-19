import { useState } from 'react';
import TabTOC from './components/tabs/TabTOC';
import TabScorecard from './components/tabs/TabScorecard';
import TabAlcance from './components/tabs/TabAlcance';
import TabAprobacion from './components/tabs/TabAprobacion';
import TabReconocimientosTransparencia from './components/tabs/TabReconocimientosTransparencia';
import TabMapa from './components/tabs/TabMapa';
import { useReport } from './data/dgoData';
import { useReportContext } from './context/ReportContext';



const TABS = [
  { id: 'toc',             label: 'Tabla de Contenidos',          Component: TabTOC },
  { id: 'scorecard',       label: 'Scorecard',                    Component: TabScorecard, hidden: true },
  { id: 'aprobacion',      label: 'Aprobación Ciudadana',         Component: TabAprobacion },
  { id: 'alcance',         label: 'Alcance y Cobertura',             Component: TabAlcance },
  { id: 'reconocimientos', label: 'Reconocimientos y Transparencia', Component: TabReconocimientosTransparencia },
  { id: 'mapa',            label: 'Mapa de Quejas',                  Component: TabMapa },
] as const;

const VISIBLE_TABS = TABS.filter((t) => !('hidden' in t && t.hidden));

type TabId = (typeof TABS)[number]['id'];

function App() {
  const [activeTab, setActiveTab]   = useState<TabId>('toc');
  const [menuOpen, setMenuOpen]     = useState(false);

  const { municipio, periodo } = useReport();
  const { municipalities, activeMunicipio, setActiveMunicipio, loading } = useReportContext();

  const switchTab = (id: TabId) => {
    setActiveTab(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectMunicipio = (slug: string) => {
    setActiveMunicipio(slug);
    setMenuOpen(false);
    setActiveTab('toc');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Forzar remount de tabs cuando cambia el municipio activo
  const tabKey = activeMunicipio ?? 'default';

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ── Overlay del menú ── */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            zIndex: 200, backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* ── Panel lateral (drawer) ── */}
      <aside
        style={{
          position: 'fixed', top: 0, left: 0, height: '100%',
          width: 280,
          background: 'var(--header-bg, #0f2535)',
          borderRight: '1px solid rgba(255,255,255,0.1)',
          transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
          zIndex: 201,
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Cabecera del drawer */}
        <div style={{
          padding: '18px 20px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold, #e8a020)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            Municipios
          </span>
          <button
            onClick={() => setMenuOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: 20, lineHeight: 1, padding: 4 }}
            aria-label="Cerrar menú"
          >
            ×
          </button>
        </div>

        {/* Lista de municipios */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          {municipalities.length === 0 ? (
            <p style={{ padding: '16px 20px', fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
              No hay municipios disponibles.<br />
              Ejecuta el transformer para generar datos.
            </p>
          ) : (
            municipalities.map((m) => {
              const isActive = m.slug === (activeMunicipio ?? '');
              return (
                <button
                  key={m.slug}
                  onClick={() => handleSelectMunicipio(m.slug)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '11px 20px', border: 'none', cursor: 'pointer',
                    background: isActive ? 'rgba(232,160,32,0.15)' : 'none',
                    borderLeft: isActive ? '3px solid var(--gold, #e8a020)' : '3px solid transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--gold, #e8a020)' : '#fff' }}>
                    {m.nombre}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                    {m.periodo}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer del drawer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
          QuienOpina Dashboards
        </div>
      </aside>

      {/* ── Header ── */}
      <header className="header">
        <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>

          {/* Botón hamburguesa */}
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú de municipios"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', gap: 5,
              padding: '4px 6px', borderRadius: 6,
            }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{ display: 'block', width: 20, height: 2, background: 'rgba(255,255,255,0.8)', borderRadius: 2 }}
              />
            ))}
          </button>

          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.2)' }} />
          <span className="header-logo" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '2px', color: 'var(--gold)', textTransform: 'uppercase' }}>
            QuienOpina
          </span>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.2)' }} />
          <span className="header-title" style={{ fontSize: '15px', fontWeight: 600, color: '#fff', letterSpacing: '0.3px' }}>
            {loading ? 'Cargando…' : `Tablero Inteligente · ${municipio}`}
          </span>
        </div>
        <span className="header-period" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '20px' }}>
          {periodo}
        </span>
      </header>

      {/* ── Tabs bar ── */}
      <div className="tabs-bar">
        {VISIBLE_TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`tab-btn ${activeTab === id ? 'active' : ''}`}
            onClick={() => switchTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Contenido ── */}
      <main>
        {VISIBLE_TABS.map(({ id, Component }) => {
          const isActive = activeTab === id || (activeTab === 'scorecard' && id === 'toc');
          return (
            <div
              key={id}
              id={id}
              className={`tab-content ${isActive ? 'active' : ''}`}
              style={{ display: isActive ? 'block' : 'none' }}
            >
              <Component key={tabKey} onSwitchTab={switchTab} />
            </div>
          );
        })}
      </main>
    </div>
  );
}

export default App;
