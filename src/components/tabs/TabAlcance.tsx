import { useMemo } from 'react';
import ChartJSWrapper from '../charts/ChartJSWrapper';
import { useReport } from '../../data/dgoData';

const GOLD    = '#e8a020';
const GREEN   = '#1a9650';
const ORANGE  = '#e85d20';
const TEAL    = '#0d7377';

/** Estilo por nombre de fuente (menciones por red en Alcance) */
const MENTION_SOURCE_BY_NAME: Record<string, { abbr: string; bg: string; barColor?: string }> = {
  Instagram: { abbr: 'IG', bg: '#fce4ec', barColor: '#e91e8c' },
  Facebook: { abbr: 'FB', bg: '#e8f5e9' },
  'Google News': { abbr: 'MC', bg: '#fff3e0', barColor: 'var(--gold)' },
  TikTok: { abbr: 'TT', bg: '#e8eaf6', barColor: '#5c6bc0' },
  'Twitter/X': { abbr: 'X', bg: '#e7f3ff' },
  Twitter: { abbr: 'X', bg: '#e7f3ff' },
};

const mentionSourceDisplayName = (source: string) =>
  source === 'Google News' ? 'Medios de comunicación' : source;

const PLATFORM_META: Record<string, { label: string; color: string }> = {
  facebook:  { label: 'Facebook',  color: '#1877f2' },
  tiktok:    { label: 'TikTok',    color: '#010101' },
  instagram: { label: 'Instagram', color: '#e1306c' },
  twitter:   { label: 'X',         color: '#1da1f2' },
  youtube:   { label: 'YouTube',   color: '#ff0000' },
};

const fmtFollowers = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
};

export default function TabAlcance() {
  const { mentionsBySource, top5MediosRecurrentes, topPersonasMencionadas, topDependenciasMencionadas, topPublicacionesImpacto, botsVsReal, followersTotal, followersPorRed, deltaFollowers, seguidoresTrendPorRed, gananciaPorRed, periodo, topTemas, topEventos } = useReport()
  const totalMentions = mentionsBySource.reduce((s, m) => s + m.mentions, 0);

  const chartPersonas = useMemo(
    () => ({
      type: 'bar' as const,
      data: {
        labels: topPersonasMencionadas.map((p) => p.name),
        datasets: [
          {
            label: 'Menciones',
            data: topPersonasMencionadas.map((p) => p.mentions),
            backgroundColor: GREEN + 'cc',
            borderRadius: 4,
          },
        ],
      },
      options: {
        indexAxis: 'y' as const,
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: '#f0f2f5' }, border: { dash: [4, 4] } },
          y: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: false } },
        },
      },
    }),
    [topPersonasMencionadas]
  );

  const chartDependencias = useMemo(
    () => ({
      type: 'bar' as const,
      data: {
        labels: topDependenciasMencionadas.map((d) => d.name),
        datasets: [
          {
            label: 'Menciones',
            data: topDependenciasMencionadas.map((d) => d.mentions),
            backgroundColor: ORANGE + 'cc',
            borderRadius: 4,
          },
        ],
      },
      options: {
        indexAxis: 'y' as const,
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: '#f0f2f5' }, border: { dash: [4, 4] } },
          y: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: false } },
        },
      },
    }),
    [topDependenciasMencionadas]
  );

  const chartTemas = useMemo(
    () => ({
      type: 'bar' as const,
      data: {
        labels: topTemas.map((t) => t.tema),
        datasets: [
          {
            label: 'Menciones',
            data: topTemas.map((t) => t.mentions),
            backgroundColor: TEAL + 'cc',
            borderRadius: 4,
          },
        ],
      },
      options: {
        indexAxis: 'y' as const,
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: '#f0f2f5' }, border: { dash: [4, 4] } },
          y: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: false } },
        },
      },
    }),
    [topTemas]
  );

  const chartEventos = useMemo(
    () => ({
      type: 'bar' as const,
      data: {
        labels: topEventos.map((e) => e.evento),
        datasets: [
          {
            label: 'Menciones',
            data: topEventos.map((e) => e.mentions),
            backgroundColor: GOLD + 'cc',
            borderRadius: 4,
          },
        ],
      },
      options: {
        indexAxis: 'y' as const,
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: '#f0f2f5' }, border: { dash: [4, 4] } },
          y: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: false } },
        },
      },
    }),
    [topEventos]
  );

  const REDES_TREND = [
    { key: 'facebook',  color: '#1877f2', label: 'Facebook'  },
    { key: 'tiktok',    color: '#333333', label: 'TikTok'    },
    { key: 'instagram', color: '#e1306c', label: 'Instagram' },
    { key: 'twitter',   color: '#1da1f2', label: 'X' },
  ] as const;

  const chartSeguidores = useMemo(() => {
    const labels = seguidoresTrendPorRed.map((d) => d.date);
    // Delta acumulado desde el día 1 (para que todas las líneas empiecen en 0
    // y se vea claramente cuánto subió cada red durante el período)
    const datasets = REDES_TREND.filter((r) =>
      seguidoresTrendPorRed.some((d) => (d as Record<string, unknown>)[r.key] != null)
    ).map((r) => {
      const base = (seguidoresTrendPorRed[0] as Record<string, unknown>)[r.key] as number ?? 0;
      return {
        label: r.label,
        data: seguidoresTrendPorRed.map((d) =>
          ((d as Record<string, unknown>)[r.key] as number ?? base) - base
        ),
        borderColor: r.color,
        backgroundColor: r.color + '18',
        fill: false,
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
      };
    });
    return {
      type: 'line' as const,
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index' as const, intersect: false },
        plugins: {
          legend: {
            display: true,
            position: 'bottom' as const,
            labels: { boxWidth: 10, padding: 14, font: { size: 11 } },
          },
          tooltip: {
            callbacks: {
              label(ctx: { dataset: { label?: string }; parsed: { y: number | null } }) {
                const v = ctx.parsed.y ?? 0;
                return `${ctx.dataset.label}: +${v.toLocaleString()} seguidores`;
              },
            },
          },
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            beginAtZero: true,
            grid: { color: '#f0f2f5' },
            border: { dash: [4, 4] },
            ticks: {
              callback(v: string | number) {
                const n = typeof v === 'string' ? Number(v) : v;
                return `+${n}`;
              },
            },
          },
        },
      },
    };
  }, [seguidoresTrendPorRed]);

  const maxMedios = top5MediosRecurrentes[0]?.menciones ?? 1;
  const formatViews = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n));

  return (
    <>
      <div className="section-label">Alcance y Cobertura · {periodo}</div>

      <div className="mentions-grid" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Menciones por Red Social</div>
            <div className="card-question">¿En qué plataformas se habla más del municipio?</div>
          </div>
          <div className="card-body">
            <div style={{ marginBottom: 12 }}>
              {mentionsBySource.map((m) => {
                const pct = totalMentions ? Math.round((m.mentions / totalMentions) * 100) : 0;
                const style = MENTION_SOURCE_BY_NAME[m.source] ?? { abbr: '·', bg: '#eee' };
                return (
                  <div key={m.source} className="mention-row">
                    <div className="mention-icon" style={{ background: style.bg, fontSize: 10, fontWeight: 700, color: '#445' }}>
                      {style.abbr}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="mention-name">{mentionSourceDisplayName(m.source)}</span>
                        <span className="mention-val">
                          {m.mentions} <span className="mention-pct">{pct}%</span>
                        </span>
                      </div>
                      <div className="mention-bar">
                        <div
                          className="mention-bar-fill"
                          style={{ width: `${pct}%`, background: style.barColor ?? 'var(--teal-mid)' }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header mid">
            <div className="card-title">Menciones en Medios y Noticias</div>
            <div className="card-question">¿Qué medios de comunicación y noticias están cubriendo al municipio?</div>
          </div>
          <div className="card-body">
            <div>
              {top5MediosRecurrentes.map((m) => (
                <div key={m.nombre} className="mention-row">
                  <div className="mention-icon" style={{ background: '#fff3e0', fontSize: 10, fontWeight: 700, color: '#445' }}>
                    NW
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="mention-name">{m.nombre}</span>
                      <span className="mention-val">
                        {m.menciones} <span className="mention-pct">notas</span>
                      </span>
                    </div>
                    <div className="mention-bar">
                      <div
                        className="mention-bar-fill"
                        style={{ width: `${(m.menciones / maxMedios) * 100}%`, background: 'var(--gold)' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mentions-grid" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Top 10 personas</div>
            <div className="card-question">¿Qué figuras públicas y actores aparecen más en la conversación?</div>
          </div>
          <div className="card-body">
            <div className="chart-wrap chart-wrap-tall">
              <ChartJSWrapper config={chartPersonas} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header mid">
            <div className="card-title">Top 10 organizaciones</div>
            <div className="card-question">¿Qué áreas y dependencias municipales concentran más menciones?</div>
          </div>
          <div className="card-body">
            <div className="chart-wrap chart-wrap-tall">
              <ChartJSWrapper config={chartDependencias} />
            </div>
          </div>
        </div>
      </div>

      {/* Top Temas + Top Eventos */}
      <div className="mentions-grid" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Top 10 temas del período</div>
            <div className="card-question">¿Sobre qué temas está hablando la ciudadanía?</div>
          </div>
          <div className="card-body">
            <div className="chart-wrap chart-wrap-tall">
              <ChartJSWrapper config={chartTemas} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header mid">
            <div className="card-title">Top 10 eventos del período</div>
            <div className="card-question">¿Qué eventos concentraron más conversación?</div>
          </div>
          <div className="card-body">
            <div className="chart-wrap chart-wrap-tall">
              <ChartJSWrapper config={chartEventos} />
            </div>
          </div>
        </div>
      </div>

      {/* % Bots vs Reales + Incremento en Seguidores */}
      <div className="mentions-grid" style={{ marginBottom: 24 }}>
        <div
          className="card"
          style={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}
        >
          <div className="card-header">
            <div className="card-title">% Bots vs Reales</div>
            <div className="card-question">¿Qué proporción de la interacción proviene de cuentas reales frente a posibles bots o coordinación?</div>
          </div>
          <div
            className="card-body"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'stretch',
              gap: 0,
              minHeight: 0,
            }}
          >
            <div className="bots-vs-real-visual" role="img" aria-label={`Interacción ${botsVsReal.real}% reales y ${botsVsReal.bots}% bots o coordinados`}>
              <div className="bots-vs-real-split">
                <div
                  className="bots-vs-real-split-seg"
                  style={{
                    flex: `0 0 ${botsVsReal.real}%`,
                    background: GREEN,
                    minWidth: botsVsReal.real > 0 ? 6 : 0,
                  }}
                >
                  {botsVsReal.real >= 14 ? `${botsVsReal.real}%` : ''}
                </div>
                <div
                  className="bots-vs-real-split-seg"
                  style={{
                    flex: `0 0 ${botsVsReal.bots}%`,
                    background: '#7a7a7a',
                    minWidth: botsVsReal.bots > 0 ? 6 : 0,
                  }}
                >
                  {botsVsReal.bots >= 14 ? `${botsVsReal.bots}%` : ''}
                </div>
              </div>
              <div className="bots-vs-real-axis" aria-hidden>
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 28,
                  flexWrap: 'wrap',
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, flexShrink: 0, background: GREEN }} />
                  <span>{botsVsReal.real}% Reales</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, flexShrink: 0, background: '#7a7a7a' }} />
                  <span>{botsVsReal.bots}% Bots / coordinados</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header mid">
            <div className="card-title">Crecimiento de Seguidores</div>
            <div className="card-question">¿Cuántos seguidores ganó cada red oficial durante el período?</div>
          </div>
          <div className="card-body">
            {/* Chips por red: total actual + ganancia del período */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
              {followersPorRed.map((r) => {
                const p = r.platform.toLowerCase();
                const meta =
                  PLATFORM_META[p] ??
                  { label: p === 'twitter' ? 'X' : r.platform, color: '#999' };
                const ganancia = gananciaPorRed[p] ?? null;
                return (
                  <div
                    key={r.platform}
                    style={{
                      flex: '1 1 120px',
                      background: meta.color + '14',
                      border: `1px solid ${meta.color}44`,
                      borderRadius: 10,
                      padding: '10px 14px',
                      minWidth: 0,
                    }}
                  >
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4, fontWeight: 600 }}>
                      {meta.label}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--teal-dark)', lineHeight: 1 }}>
                      {fmtFollowers(r.followers)}
                    </div>
                    {ganancia !== null && ganancia > 0 && (
                      <div style={{ fontSize: 11, color: '#1a9650', fontWeight: 600, marginTop: 3 }}>
                        +{ganancia.toLocaleString()} este período
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Total + delta global */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Total:</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--teal-dark)' }}>
                {fmtFollowers(followersTotal)}
              </span>
              {deltaFollowers !== null && (
                <span className={`kpi-delta ${deltaFollowers >= 0 ? 'up' : 'down'}`}>
                  {deltaFollowers >= 0 ? '▲' : '▼'} {Math.abs(deltaFollowers)}% vs. período anterior
                </span>
              )}
            </div>

            {/* Gráfico multi-línea: ganancia acumulada por red día a día */}
            {seguidoresTrendPorRed.length > 1 && (
              <div style={{ position: 'relative', height: 180 }}>
                <ChartJSWrapper config={chartSeguidores} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Publicaciones con mayor impacto */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-title">Top Publicaciones con mayor impacto</div>
          <div className="card-question">¿Qué publicaciones generaron más vistas y engagement en el período?</div>
        </div>
        <div className="card-body" style={{ padding: '14px 20px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="actors-table">
              <thead>
                <tr>
                  <th style={{ width: 28 }}>#</th>
                  <th>Publicación</th>
                  <th style={{ width: 80 }}>Plataforma</th>
                  <th style={{ width: 80, textAlign: 'right' }}>Vistas</th>
                  <th style={{ width: 70, textAlign: 'right' }}>Likes</th>
                  <th style={{ width: 44 }}></th>
                </tr>
              </thead>
              <tbody>
                {topPublicacionesImpacto.map((p, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--muted)', fontWeight: 700, fontSize: 12 }}>{i + 1}</td>
                    <td>
                      <span className="actor-name" style={{ fontSize: 13 }}>{p.titulo}</span>
                    </td>
                    <td style={{ fontSize: 12 }}>{p.platform}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatViews(p.views)}</td>
                    <td style={{ textAlign: 'right' }}>{formatViews(p.likes)}</td>
                    <td>
                      <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--teal-mid)' }}>Ver</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
