import { useCallback, useMemo, useState } from 'react';

const TEMAS = [
  'Infraestructura y Servicios Públicos',
  'Abuso de Poder, Corrupción y Gestión Municipal',
  'Seguridad Pública',
  'Educación y Programas Sociales',
  'Salud Pública',
] as const;

const TEMAS_SHORT = [
  'Infraestructura',
  'Abuso / Corrupción',
  'Seguridad',
  'Educación',
  'Salud',
] as const;

const EMOCIONES = [
  { name: 'Satisfacción', pos: true },
  { name: 'Esperanza', pos: true },
  { name: 'Alegría', pos: true },
  { name: 'Gratitud', pos: true },
  { name: 'Orgullo', pos: true },
  { name: 'Frustración', pos: false },
  { name: 'Preocupación', pos: false },
  { name: 'Enojo', pos: false },
  { name: 'Indignación', pos: false },
  { name: 'Decepción', pos: false },
] as const;

/** DATA[tema][emoción] — Sat,Esp,Ale,Gra,Org | Fru,Pre,Eno,Ind,Dec */
const DATA: readonly (readonly number[])[] = [
  [218, 184, 163, 142, 118, 42, 55, 32, 24, 18],
  [8, 14, 10, 6, 5, 182, 148, 112, 88, 64],
  [18, 25, 15, 10, 12, 178, 148, 112, 88, 64],
  [88, 72, 91, 68, 55, 12, 22, 8, 6, 9],
  [62, 58, 48, 42, 35, 38, 68, 28, 22, 45],
];

function posColor(t: number) {
  const r = Math.round(240 - t * 220);
  const g = Math.round(250 - t * 132);
  const b = Math.round(244 - t * 186);
  return `rgb(${r},${g},${b})`;
}

function negColor(t: number) {
  const r = Math.round(252 - t * 112);
  const g = Math.round(240 - t * 220);
  const b = Math.round(240 - t * 220);
  return `rgb(${r},${g},${b})`;
}

function txtColor(t: number, isPos: boolean) {
  if (t < 0.22) return '#8fa3af';
  return isPos ? '#085041' : '#7a1616';
}

type TooltipState =
  | { visible: false }
  | {
      visible: true;
      x: number;
      y: number;
      emo: string;
      isPos: boolean;
      tema: string;
      val: number;
    };

const GRAD_STEPS = 7;

export default function EmotionsHeatmap() {
  const maxVal = useMemo(() => Math.max(...DATA.flat()), []);

  const [tip, setTip] = useState<TooltipState>({ visible: false });

  const showTip = useCallback((e: React.MouseEvent, payload: Omit<Extract<TooltipState, { visible: true }>, 'visible' | 'x' | 'y'>) => {
    setTip({
      visible: true,
      x: e.clientX + 14,
      y: e.clientY - 12,
      ...payload,
    });
  }, []);

  const moveTip = useCallback((e: React.MouseEvent) => {
    setTip((prev) =>
      prev.visible ? { ...prev, x: e.clientX + 14, y: e.clientY - 12 } : prev
    );
  }, []);

  const hideTip = useCallback(() => setTip({ visible: false }), []);

  const posGradient = useMemo(
    () =>
      Array.from({ length: GRAD_STEPS }, (_, i) => (
        <div key={`p-${i}`} className="eh-grad-seg" style={{ flex: 1, background: posColor(i / (GRAD_STEPS - 1)) }} />
      )),
    []
  );

  const negGradient = useMemo(
    () =>
      Array.from({ length: GRAD_STEPS }, (_, i) => (
        <div key={`n-${i}`} className="eh-grad-seg" style={{ flex: 1, background: negColor(i / (GRAD_STEPS - 1)) }} />
      )),
    []
  );

  return (
    <div className="emotions-heatmap">
      <div className="eh-legend">
        <div className="eh-legend-item">
          <div className="eh-dot" style={{ background: 'var(--positive)' }} />
          <span>Positivas</span>
          <div className="eh-legend-grad">{posGradient}</div>
        </div>
        <div className="eh-legend-sep" />
        <div className="eh-legend-item">
          <div className="eh-dot" style={{ background: 'var(--negative)' }} />
          <span>Negativas</span>
          <div className="eh-legend-grad">{negGradient}</div>
        </div>
        <div className="eh-legend-sep" />
        <span className="eh-legend-hint">Hover = detalle</span>
      </div>

      <div className="eh-table-wrap">
        <table className="eh-table">
          <colgroup>
            <col style={{ width: 108 }} />
            {EMOCIONES.map((_, i) => (
              <col key={i} />
            ))}
          </colgroup>
          <thead>
            <tr className="eh-group-row">
              <th className="eh-row-head-blank" />
              <th className="eh-pos-label" colSpan={5}>
                ▲ Positivas
              </th>
              <th className="eh-neg-label" colSpan={5}>
                ▼ Negativas
              </th>
            </tr>
            <tr className="eh-emo-row">
              <th className="eh-row-head">Categoría</th>
              {EMOCIONES.map((emo, i) => {
                const dotColor = emo.pos ? 'var(--positive)' : 'var(--negative)';
                const borderLeft = i === 5 ? { borderLeft: '2px solid var(--bg)' } : undefined;
                return (
                  <th key={emo.name} style={borderLeft}>
                    <span className="eh-emo-dot" style={{ background: dotColor }} />
                    <span className="eh-emo-name-wrap">{emo.name}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {DATA.map((row, ti) => (
              <tr key={TEMAS[ti]}>
                <th className="eh-cat-cell">
                  <span className="eh-row-num">{ti + 1}</span>
                  {TEMAS_SHORT[ti]}
                </th>
                {row.map((val, ei) => {
                  const t = val / maxVal;
                  const isPos = EMOCIONES[ei].pos;
                  const bg = isPos ? posColor(t) : negColor(t);
                  const tc = txtColor(t, isPos);
                  const borderLeft = ei === 5 ? '2px solid var(--bg)' : undefined;
                  return (
                    <td
                      key={ei}
                      className="eh-cell"
                      style={{
                        background: bg,
                        color: tc,
                        borderLeft,
                      }}
                      onMouseEnter={(e) =>
                        showTip(e, {
                          emo: EMOCIONES[ei].name,
                          isPos,
                          tema: TEMAS[ti],
                          val,
                        })
                      }
                      onMouseMove={moveTip}
                      onMouseLeave={hideTip}
                    >
                      {val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tip.visible && (
        <div
          className="eh-tooltip"
          style={{ left: tip.x, top: tip.y, opacity: 1 }}
          role="tooltip"
        >
          <strong>{tip.emo}</strong>
          <span style={{ color: tip.isPos ? '#5DCAA5' : '#F09595' }}>
            {' '}
            {tip.isPos ? '▲ positiva' : '▼ negativa'}
          </span>
          <br />
          <span style={{ opacity: 0.75 }}>{tip.tema}</span>
          <br />
          <strong>{tip.val}</strong> menciones
        </div>
      )}
    </div>
  );
}
