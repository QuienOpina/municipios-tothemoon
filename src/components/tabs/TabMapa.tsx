/// <reference types="@types/google.maps" />
import { useEffect, useRef } from 'react';
import { useReport, type QuejaUbicacion } from '../../data/dgoData';

// Color por nivel de queja
const NIVEL_COLOR: Record<string, string> = {
  alto:        '#c62828',
  medio:       '#ef6c00',
  bajo:        '#f9a825',
  desconocido: '#78909c',
};

function nivelColor(item: QuejaUbicacion): string {
  const niveles = item.posts.map((p) => p.nivel?.toLowerCase() ?? 'desconocido');
  if (niveles.includes('alto'))   return NIVEL_COLOR['alto'];
  if (niveles.includes('medio'))  return NIVEL_COLOR['medio'];
  if (niveles.includes('bajo'))   return NIVEL_COLOR['bajo'];
  return NIVEL_COLOR['desconocido'];
}

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

function buildPopupHtml(item: QuejaUbicacion): string {
  const color = nivelColor(item);
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
    ? `<p style="margin:0 0 6px;font-size:10px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${item.categoria}</p>`
    : '';

  return (
    `<div style="max-width:340px;font-family:Outfit,sans-serif;padding:4px 0;">` +
    `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">` +
    `<span style="background:${color};color:#fff;padding:3px 10px;border-radius:12px;` +
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

      const infoWindow = new window.google.maps.InfoWindow();
      const bounds     = new window.google.maps.LatLngBounds();

      items.forEach((item) => {
        const pos   = { lat: item.lat as number, lng: item.lng as number };
        const color = nivelColor(item);
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
          infoWindow.setContent(buildPopupHtml(item));
          infoWindow.open(map, marker);
        });
      });

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
  }, [quejasPorUbicacion]);

  // Calcular max para escalar las barras de categorías
  const maxCat = quejasPorCategoria.length > 0
    ? quejasPorCategoria[0].count
    : 1;

  // Paleta de colores para las barras (rota por índice)
  const BAR_COLORS = [
    '#c62828', '#ef6c00', '#1565c0', '#2e7d32',
    '#6a1b9a', '#00838f', '#558b2f', '#4527a0',
  ];

  return (
    <div id="map-container">
      <div ref={mapRef} id="map" style={{ width: '100%', height: '100%' }} />

      <div className="map-legend" id="mapLegend">
        {quejasPorCategoria.length > 0 ? (
          <>
            <h3 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 700, color: '#1a2c3d' }}>
              Categorías de quejas
            </h3>
            {[...quejasPorCategoria].sort((a, b) => b.count - a.count).map((cat, i) => {
              const pct = Math.round((cat.count / maxCat) * 100);
              const color = BAR_COLORS[i % BAR_COLORS.length];
              return (
                <div key={cat.categoria} style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px', gap: '12px' }}>
                    <span style={{ fontSize: '11px', color: '#1a2c3d', fontWeight: 600, flex: 1 }}>
                      {cat.categoria}
                    </span>
                    <span style={{ fontSize: '11px', color: '#6b7d8c', fontWeight: 700, flexShrink: 0 }}>
                      {cat.count}
                    </span>
                  </div>
                  <div style={{ background: '#e8edf2', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
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

            {/* Nivel de marcador */}
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #e8edf2' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: '#1a2c3d' }}>
                Nivel de queja
              </h3>
              {Object.entries(NIVEL_COLOR).map(([nivel, hex]) => (
                <div key={nivel} className="map-legend-item">
                  <span className="map-legend-dot" style={{ background: hex }} />
                  <span style={{ textTransform: 'capitalize', fontSize: '11px' }}>{nivel}</span>
                </div>
              ))}
            </div>

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
                    <span style={{ fontSize: '10px', color: '#6b7d8c', flex: 1, lineHeight: 1.3 }}>
                      {c.categoria}
                    </span>
                    <span style={{ fontSize: '10px', color: '#9aaab4', fontWeight: 700, flexShrink: 0 }}>
                      {c.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <h3 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, color: '#1a2c3d' }}>
              Nivel de queja
            </h3>
            {Object.entries(NIVEL_COLOR).map(([nivel, hex]) => (
              <div key={nivel} className="map-legend-item">
                <span className="map-legend-dot" style={{ background: hex }} />
                <span style={{ textTransform: 'capitalize' }}>{nivel}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
