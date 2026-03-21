/// <reference types="@types/google.maps" />
import { useEffect, useRef, useState, useMemo } from 'react';
import { useReport, type QuejaUbicacion, type QuejaPost, type QuejaSinCoordsItem } from '../../data/dgoData';

// Paleta de colores por categoría (rota por índice)
const CAT_COLORS = [
  '#c62828', '#1565c0', '#2e7d32', '#ef6c00',
  '#6a1b9a', '#00838f', '#558b2f', '#4527a0',
  '#ad1457', '#00695c', '#e65100', '#283593',
];

const FALLBACK_COLOR = '#78909c';

// Escala el radio del marcador según la cantidad de quejas (mín 9, máx 20)
function markerScale(count: number): number {
  return Math.min(9 + count * 1.5, 20);
}

const PLATFORM_EMOJI: Record<string, string> = {
  TikTok:       '🎵',
  Facebook:     '📘',
  Instagram:    '📸',
  'Twitter/X':  '🐦',
  X:            '🐦',
  YouTube:      '▶️',
  'Google News': '📰',
};

function buildPopupHtml(item: QuejaUbicacion, catColor: string): string {
  const nivelLabel = item.posts[0]?.nivel ?? 'desconocido';

  const postsHtml = item.posts
    .slice(0, 5)
    .map((post) => {
      const emoji = PLATFORM_EMOJI[post.platform] ?? '💬';
      const emotions = post.emotions.length
        ? `<p style="margin:4px 0 0;font-size:11px;color:#888;">${post.emotions.join(' · ')}</p>`
        : '';
      const link = post.url
        ? `<a href="${post.url}" target="_blank" rel="noopener noreferrer"
            style="display:inline-block;margin-top:6px;font-size:11px;color:#1565c0;
                   text-decoration:none;font-weight:600;">
             Ver post →
           </a>`
        : '';
      return (
        `<div style="border-top:1px solid #eee;padding:8px 0 4px;">` +
        `<p style="margin:0 0 4px;font-size:11px;color:#6b7d8c;">${emoji} ${post.platform} · <strong>@${post.username}</strong></p>` +
        `<p style="margin:0;font-size:12px;line-height:1.4;color:#1a2c3d;">${post.text || '(sin texto)'}</p>` +
        emotions +
        link +
        `</div>`
      );
    })
    .join('');

  const moreLabel =
    item.posts.length > 5
      ? `<p style="margin:6px 0 0;font-size:11px;color:#888;">+${item.posts.length - 5} quejas más en esta ubicación</p>`
      : '';

  const categoriaLabel = item.categoria
    ? `<p style="margin:0 0 6px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${catColor};">${item.categoria}</p>`
    : '';

  return (
    `<div style="max-width:340px;font-family:Outfit,sans-serif;padding:4px 0;">` +
    `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">` +
    `<span style="background:${catColor};color:#fff;padding:3px 10px;border-radius:12px;` +
    `font-size:11px;font-weight:700;text-transform:uppercase;">${nivelLabel}</span>` +
    `<span style="font-size:11px;color:#6b7d8c;">${item.count} queja${item.count !== 1 ? 's' : ''}</span>` +
    `</div>` +
    categoriaLabel +
    `<p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#1a2c3d;">${item.location_original}</p>` +
    postsHtml +
    moreLabel +
    `</div>`
  );
}

declare global {
  interface Window {
    google?: typeof google;
    initMap?: () => void;
  }
}

export default function TabMapa() {
  const { quejasPorUbicacion, quejasPorCategoria, quejasSinCoordenadas } = useReport();
  const mapRef         = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  // markers agrupados por categoría para poder filtrar sin recrear
  const markersRef     = useRef<Record<string, google.maps.Marker[]>>({});
  const boundsAllRef   = useRef<google.maps.LatLngBounds | null>(null);

  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  // Mapa estable categoria → color (mismo orden que la leyenda)
  const catColorMap = useMemo(() => {
    const sorted = [...quejasPorCategoria].sort((a, b) => b.count - a.count);
    return Object.fromEntries(
      sorted.map((cat, i) => [cat.categoria, CAT_COLORS[i % CAT_COLORS.length]])
    );
  }, [quejasPorCategoria]);

  // Crear el mapa y los markers (solo cuando cambia quejasPorUbicacion)
  useEffect(() => {
    const items = quejasPorUbicacion.filter((q) => q.lat != null && q.lng != null);
    if (items.length === 0) return;

    const initMap = () => {
      if (!mapRef.current || !window.google) return;

      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 13,
        center: { lat: 25.57, lng: -103.49 },
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });
      mapInstanceRef.current = map;
      markersRef.current = {};

      const infoWindow = new window.google.maps.InfoWindow();
      const bounds     = new window.google.maps.LatLngBounds();

      items.forEach((item) => {
        const pos    = { lat: item.lat as number, lng: item.lng as number };
        const cat    = item.categoria ?? '__sin_categoria__';
        const color  = catColorMap[item.categoria ?? ''] ?? FALLBACK_COLOR;
        bounds.extend(pos);

        const marker = new window.google.maps.Marker({
          position: pos,
          map,
          title: `${item.location_original} (${item.count} quejas)`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: markerScale(item.count),
            fillColor: color,
            fillOpacity: 0.92,
            strokeColor: '#fff',
            strokeWeight: 1.5,
          },
        });

        marker.addListener('click', () => {
          infoWindow.setContent(buildPopupHtml(item, color));
          infoWindow.open(map, marker);
        });

        if (!markersRef.current[cat]) markersRef.current[cat] = [];
        markersRef.current[cat].push(marker);
      });

      boundsAllRef.current = bounds;
      map.fitBounds(bounds, 48);
    };

    if (window.google?.maps) {
      initMap();
    } else {
      window.initMap = () => {
        initMap();
        window.initMap = undefined;
      };
    }

    return () => { mapInstanceRef.current = null; };
  // catColorMap se incluye para que los colores sean correctos si los datos llegan después
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quejasPorUbicacion, catColorMap]);

  // Filtrar markers según la categoría seleccionada
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.google) return;

    if (!selectedCat) {
      // Sin filtro: mostrar todos y restaurar zoom global
      Object.values(markersRef.current).flat().forEach((m) => m.setVisible(true));
      if (boundsAllRef.current) map.fitBounds(boundsAllRef.current, 48);
    } else {
      // Mostrar solo los de la categoría seleccionada y ajustar zoom
      const filteredBounds = new window.google.maps.LatLngBounds();
      let hasVisible = false;

      Object.entries(markersRef.current).forEach(([cat, markers]) => {
        const visible = cat === selectedCat;
        markers.forEach((m) => {
          m.setVisible(visible);
          if (visible) {
            const pos = m.getPosition();
            if (pos) { filteredBounds.extend(pos); hasVisible = true; }
          }
        });
      });

      if (hasVisible) map.fitBounds(filteredBounds, 64);
    }
  }, [selectedCat]);

  // geocodificadas[cat] = total_items[cat] - sin_geolocalizar[cat]
  // Esto es lo que el mapa REALMENTE muestra por categoría.
  const geocodificadasPorCat = useMemo(() => {
    const sinMap: Record<string, number> = {};
    for (const s of quejasSinCoordenadas) sinMap[s.categoria] = s.count;
    const result: Record<string, number> = {};
    for (const cat of quejasPorCategoria) {
      result[cat.categoria] = Math.max(0, cat.count - (sinMap[cat.categoria] ?? 0));
    }
    return result;
  }, [quejasPorCategoria, quejasSinCoordenadas]);

  const sortedCats = useMemo(
    () => [...quejasPorCategoria].sort((a, b) => b.count - a.count),
    [quejasPorCategoria]
  );
  const maxCat = Math.max(
    1,
    ...Object.values(geocodificadasPorCat),
  );

  // Datos para el panel de detalle (aparece al seleccionar una categoría)
  const panelData = useMemo(() => {
    if (!selectedCat) return null;
    const color = catColorMap[selectedCat] ?? FALLBACK_COLOR;
    const geocodCount = geocodificadasPorCat[selectedCat] ?? 0;
    const sinEntry = quejasSinCoordenadas.find(s => s.categoria === selectedCat);
    const sinCount = sinEntry?.count ?? 0;
    const sinItems: QuejaSinCoordsItem[] = sinEntry?.items ?? [];
    const geocodLocations = quejasPorUbicacion.filter(
      q => q.categoria === selectedCat && q.lat != null && q.lng != null
    );
    return { color, geocodCount, sinCount, sinItems, geocodLocations };
  }, [selectedCat, catColorMap, geocodificadasPorCat, quejasSinCoordenadas, quejasPorUbicacion]);

  return (
    <div id="map-container">
      <div ref={mapRef} id="map" style={{ width: '100%', height: '100%' }} />

      <div className="map-legend" id="mapLegend">
        {sortedCats.length > 0 ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#1a2c3d' }}>
                Categorías de quejas
              </h3>
              {selectedCat && (
                <button
                  onClick={() => setSelectedCat(null)}
                  style={{
                    border: 'none', cursor: 'pointer',
                    fontSize: '10px', color: '#1565c0', fontWeight: 700,
                    padding: '2px 6px', borderRadius: 8,
                    background: '#e3f0ff',
                  } as React.CSSProperties}
                >
                  × Ver todos
                </button>
              )}
            </div>

            {sortedCats.map((cat) => {
              const color       = catColorMap[cat.categoria] ?? FALLBACK_COLOR;
              const geocodCount = geocodificadasPorCat[cat.categoria] ?? 0;
              const pct         = Math.round((geocodCount / maxCat) * 100);
              const active      = selectedCat === cat.categoria;
              const dimmed      = selectedCat !== null && !active;

              return (
                <div
                  key={cat.categoria}
                  onClick={() => setSelectedCat((prev) => prev === cat.categoria ? null : cat.categoria)}
                  style={{
                    marginBottom: '8px',
                    cursor: 'pointer',
                    opacity: dimmed ? 0.35 : 1,
                    transition: 'opacity 0.2s ease',
                    borderRadius: 6,
                    padding: active ? '4px 6px' : '0',
                    background: active ? `${color}18` : 'transparent',
                    outline: active ? `1.5px solid ${color}` : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                      <span style={{
                        display: 'inline-block', width: 8, height: 8,
                        borderRadius: '50%', background: color, flexShrink: 0,
                      }} />
                      <span style={{ fontSize: '11px', color: '#1a2c3d', fontWeight: active ? 700 : 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cat.categoria}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#6b7d8c', fontWeight: 700, flexShrink: 0 }}>
                      {geocodCount}
                    </span>
                  </div>
                  <div style={{ background: '#e8edf2', borderRadius: '4px', height: '5px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: color,
                      borderRadius: '4px',
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>
              );
            })}

            {/* Quejas sin geolocalizar */}
            {quejasSinCoordenadas.length > 0 && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #e8edf2' }}>
                <h3 style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 700, color: '#6b7d8c' }}>
                  Sin geolocalizar
                </h3>
                {quejasSinCoordenadas.map((c) => (
                  <div
                    key={c.categoria}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', gap: '8px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, minWidth: 0 }}>
                      <span style={{
                        display: 'inline-block', width: 7, height: 7,
                        borderRadius: '50%',
                        background: catColorMap[c.categoria] ?? FALLBACK_COLOR,
                        flexShrink: 0, opacity: 0.5,
                      }} />
                      <span style={{ fontSize: '10px', color: '#6b7d8c', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.categoria}
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', color: '#9aaab4', fontWeight: 700, flexShrink: 0 }}>
                      {c.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <h3 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, color: '#6b7d8c' }}>
            Sin datos de quejas
          </h3>
        )}
      </div>

      {/* Panel de detalle: aparece al seleccionar una categoría */}
      {panelData && selectedCat && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 320,
            maxHeight: 'calc(100% - 24px)',
            overflowY: 'auto',
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
            zIndex: 10,
            fontFamily: 'Outfit, sans-serif',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Encabezado */}
          <div style={{
            padding: '12px 14px 10px',
            borderBottom: '1px solid #e8edf2',
            position: 'sticky',
            top: 0,
            background: '#fff',
            borderRadius: '12px 12px 0 0',
            zIndex: 1,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{
                  display: 'inline-block', width: 10, height: 10,
                  borderRadius: '50%', background: panelData.color, flexShrink: 0,
                }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1a2c3d' }}>
                  {selectedCat}
                </span>
              </div>
              <button
                onClick={() => setSelectedCat(null)}
                style={{
                  border: 'none', background: '#f1f3f5', cursor: 'pointer',
                  borderRadius: 20, width: 22, height: 22, fontSize: 13,
                  color: '#6b7d8c', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, flexShrink: 0,
                } as React.CSSProperties}
                title="Cerrar panel"
              >
                ×
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{
                fontSize: '11px', padding: '2px 8px', borderRadius: 10,
                background: `${panelData.color}20`, color: panelData.color, fontWeight: 700,
              }}>
                📍 {panelData.geocodCount} en mapa
              </span>
              <span style={{
                fontSize: '11px', padding: '2px 8px', borderRadius: 10,
                background: '#f1f3f5', color: '#6b7d8c', fontWeight: 700,
              }}>
                📭 {panelData.sinCount} sin ubicar
              </span>
            </div>
          </div>

          <div style={{ padding: '10px 14px 14px', flex: 1 }}>

            {/* Sección: Geocodificadas (en el mapa) */}
            {panelData.geocodLocations.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: panelData.color, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  📍 En el mapa ({panelData.geocodCount})
                </p>
                {panelData.geocodLocations.map((loc, li) => (
                  <LocationCard key={li} loc={loc} color={panelData.color} />
                ))}
              </div>
            )}

            {/* Separador */}
            {panelData.geocodLocations.length > 0 && panelData.sinItems.length > 0 && (
              <div style={{ borderTop: '1px solid #e8edf2', marginBottom: 14 }} />
            )}

            {/* Sección: Sin geolocalizar */}
            {panelData.sinItems.length > 0 && (
              <div>
                <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: '#6b7d8c', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  📭 Sin geolocalizar ({panelData.sinCount})
                </p>
                {panelData.sinItems.map((item, ii) => (
                  <SinCoordsCard key={ii} item={item} color={panelData.color} />
                ))}
              </div>
            )}

            {panelData.geocodLocations.length === 0 && panelData.sinItems.length === 0 && (
              <p style={{ margin: 0, fontSize: '12px', color: '#9aaab4', textAlign: 'center', paddingTop: 12 }}>
                Sin datos disponibles
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Subcomponentes del panel ────────────────────────────────────────────────

function PostRow({ post }: { post: QuejaPost }) {
  const emoji = PLATFORM_EMOJI[post.platform] ?? '💬';
  return (
    <div style={{ marginBottom: 6, paddingBottom: 6, borderBottom: '1px solid #f1f3f5' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
        <span style={{ fontSize: '11px' }}>{emoji}</span>
        <span style={{ fontSize: '10px', color: '#6b7d8c' }}>{post.platform}</span>
        {post.username && (
          <span style={{ fontSize: '10px', color: '#9aaab4' }}>· @{post.username}</span>
        )}
        {post.nivel && post.nivel !== 'desconocido' && (
          <span style={{
            marginLeft: 'auto', fontSize: '9px', padding: '1px 5px', borderRadius: 6,
            background: post.nivel === 'alto' ? '#fde8e8' : post.nivel === 'medio' ? '#fff3e0' : '#e8f5e9',
            color: post.nivel === 'alto' ? '#c62828' : post.nivel === 'medio' ? '#e65100' : '#2e7d32',
            fontWeight: 700, textTransform: 'uppercase' as const,
          }}>
            {post.nivel}
          </span>
        )}
      </div>
      {post.text && (
        <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#1a2c3d', lineHeight: 1.4 }}>
          {post.text.length > 160 ? post.text.slice(0, 157) + '…' : post.text}
        </p>
      )}
      {post.emotions.length > 0 && (
        <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#9aaab4' }}>
          {post.emotions.slice(0, 3).join(' · ')}
        </p>
      )}
      {post.url && (
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '10px', color: '#1565c0', fontWeight: 700, textDecoration: 'none' }}
        >
          Ver post →
        </a>
      )}
    </div>
  );
}

function LocationCard({ loc, color }: { loc: QuejaUbicacion; color: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      marginBottom: 6, borderRadius: 7, border: `1px solid ${color}30`,
      background: `${color}08`, overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
        } as React.CSSProperties}
      >
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#1a2c3d', textAlign: 'left', flex: 1 }}>
          📌 {loc.location_original}
        </span>
        <span style={{ fontSize: '10px', color: color, fontWeight: 700, flexShrink: 0 }}>
          {loc.count} queja{loc.count !== 1 ? 's' : ''} {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 10px 8px' }}>
          {loc.posts.slice(0, 3).map((p, pi) => <PostRow key={pi} post={p} />)}
          {loc.posts.length > 3 && (
            <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#9aaab4' }}>
              +{loc.posts.length - 3} posts más
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function SinCoordsCard({ item, color }: { item: QuejaSinCoordsItem; color: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      marginBottom: 6, borderRadius: 7, border: `1px solid ${color}35`,
      background: `${color}0a`, overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '6px 10px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6,
        } as React.CSSProperties}
      >
        <span style={{ fontSize: '11px', color: '#1a2c3d', textAlign: 'left', flex: 1, lineHeight: 1.4 }}>
          {item.texto
            ? (item.texto.length > 100 ? item.texto.slice(0, 97) + '…' : item.texto)
            : '(sin descripción)'}
        </span>
        <span style={{ fontSize: '10px', color: '#9aaab4', flexShrink: 0, marginTop: 2 }}>
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open && item.posts.length > 0 && (
        <div style={{ padding: '0 10px 8px' }}>
          {item.posts.slice(0, 3).map((p, pi) => <PostRow key={pi} post={p} />)}
          {item.posts.length > 3 && (
            <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#9aaab4' }}>
              +{item.posts.length - 3} posts más
            </p>
          )}
        </div>
      )}
      {open && item.posts.length === 0 && (
        <p style={{ margin: '0 10px 8px', fontSize: '10px', color: '#9aaab4' }}>
          Sin posts asociados
        </p>
      )}
    </div>
  );
}
