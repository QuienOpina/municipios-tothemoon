import { useMemo } from 'react';
import ChartJSWrapper from '../charts/ChartJSWrapper';
import { useReport } from '../../data/dgoData';

const GOLD = '#e8a020';
const GREEN = '#1a9650';
const ORANGE = '#e85d20';

const MENTION_SOURCES_STYLE: { icon: string; bg: string; barColor?: string }[] = [
  { icon: '📸', bg: '#fce4ec', barColor: '#e91e8c' },
  { icon: '📰', bg: '#fff3e0', barColor: 'var(--gold)' },
  { icon: '🎵', bg: '#e8eaf6', barColor: '#5c6bc0' },
  { icon: '📘', bg: '#e8f5e9' },
  { icon: '🐦', bg: '#e7f3ff' },
];

export default function TabAlcance() {
  const { mentionsBySource, top5MediosRecurrentes, topPersonasMencionadas, topDependenciasMencionadas, topPublicacionesImpacto, botsVsReal, followersActual, scorecardPeriodoAnterior, seguidoresTrend } = useReport()
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
    []
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
    []
  );

  const chartBotsVsReal = useMemo(
    () => ({
      type: 'doughnut' as const,
      data: {
        labels: ['Reales', 'Bots / coordinados'],
        datasets: [
          {
            data: [botsVsReal.real, botsVsReal.bots],
            backgroundColor: [GREEN + 'dd', '#888888dd'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        cutout: '65%',
        plugins: {
          legend: { position: 'bottom' as const },
        },
      },
    }),
    []
  );

  const chartSeguidores = useMemo(
    () => ({
      type: 'line' as const,
      data: {
        labels: seguidoresTrend.map((d) => d.date),
        datasets: [
          {
            label: 'Seguidores (K)',
            data: seguidoresTrend.map((d) => d.followers),
            borderColor: GOLD,
            backgroundColor: GOLD + '22',
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7,
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
              callback(_: unknown, v: string | number) {
                const n = typeof v === 'string' ? Number(v) : v;
                return `${n}K`;
              },
            },
          },
        },
      },
    }),
    []
  );

  const maxMedios = top5MediosRecurrentes[0]?.menciones ?? 1;
  const incrementoSeguidores = followersActual - scorecardPeriodoAnterior.followers;
  const formatViews = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n));

  return (
    <>
      <div className="section-label">Alcance y Cobertura · 3–5 Mar 2026</div>

      <div className="mentions-grid" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Menciones por Red Social</div>
            <div className="card-question">¿En qué plataformas se habla más del municipio?</div>
          </div>
          <div className="card-body">
            <div style={{ marginBottom: 12 }}>
              {mentionsBySource.map((m, i) => {
                const pct = totalMentions ? Math.round((m.mentions / totalMentions) * 100) : 0;
                const style = MENTION_SOURCES_STYLE[i] ?? { icon: '📌', bg: '#eee' };
                return (
                  <div key={m.source} className="mention-row">
                    <div className="mention-icon" style={{ background: style.bg }}>
                      {style.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="mention-name">{m.source}</span>
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
                  <div className="mention-icon" style={{ background: '#fff3e0' }}>
                    📰
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
            <div className="card-title">Top Personas del Municipio más mencionadas</div>
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
            <div className="card-title">Top Dependencias del Municipio más mencionadas</div>
            <div className="card-question">¿Qué áreas y dependencias municipales concentran más menciones?</div>
          </div>
          <div className="card-body">
            <div className="chart-wrap chart-wrap-tall">
              <ChartJSWrapper config={chartDependencias} />
            </div>
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

      {/* % Bots vs Reales + Incremento en Seguidores */}
      <div className="mentions-grid" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">% Bots vs Reales</div>
            <div className="card-question">¿Qué proporción de la interacción proviene de cuentas reales frente a posibles bots o coordinación?</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ width: 160, height: 160, flexShrink: 0 }}>
                <ChartJSWrapper config={chartBotsVsReal} />
              </div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 2, background: GREEN }} />
                  <span><strong>{botsVsReal.real}%</strong> Reales</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 2, background: '#888' }} />
                  <span><strong>{botsVsReal.bots}%</strong> Bots / coordinados</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header mid">
            <div className="card-title">Incremento en Seguidores</div>
            <div className="card-question">¿Cómo evolucionaron los seguidores de canales oficiales del municipio?</div>
          </div>
          <div className="card-body">
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--teal-dark)' }}>{followersActual}K</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Seguidores actuales (canales oficiales)</div>
              <span className={`kpi-delta ${incrementoSeguidores >= 0 ? 'up' : 'down'}`} style={{ display: 'inline-block', marginTop: 4 }}>
                {incrementoSeguidores >= 0 ? '▲' : '▼'} {incrementoSeguidores >= 0 ? '+' : ''}{Math.round(incrementoSeguidores)}K vs. periodo anterior
              </span>
            </div>
            <div className="chart-wrap" style={{ height: 120 }}>
              <ChartJSWrapper config={chartSeguidores} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
