import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import defaultRaw from '../data/report.json';

// ─── Tipos públicos ────────────────────────────────────────────────────────

export type RawReport = typeof defaultRaw;

export interface MunicipioEntry {
  slug: string;
  nombre: string;
  periodo: string;
  report_id: string;
}

interface ReportContextType {
  rawData: RawReport;
  municipalities: MunicipioEntry[];
  activeMunicipio: string | null;
  loading: boolean;
  setActiveMunicipio: (slug: string) => void;
}

// ─── Context ───────────────────────────────────────────────────────────────

const ReportContext = createContext<ReportContextType | null>(null);

// ─── Provider ──────────────────────────────────────────────────────────────

export function ReportProvider({ children }: { children: ReactNode }) {
  const [rawData, setRawData] = useState<RawReport>(defaultRaw);
  const [municipalities, setMunicipalities] = useState<MunicipioEntry[]>([]);
  const [activeMunicipio, setActiveMunicipioState] = useState<string | null>(
    () => localStorage.getItem('qo_active_municipio'),
  );
  const [loading, setLoading] = useState(false);

  // Cargar index.json al montar
  useEffect(() => {
    fetch('/data/municipios/index.json')
      .then((r) => r.json())
      .then((data) => setMunicipalities(data.municipios ?? []))
      .catch(() => {});
  }, []);

  // Cargar report.json del municipio activo cuando cambia la selección
  useEffect(() => {
    if (!activeMunicipio) return;
    setLoading(true);
    fetch(`/data/municipios/${activeMunicipio}/report.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setRawData(data as RawReport);
        setLoading(false);
      })
      .catch(() => {
        console.warn(`[ReportContext] No se pudo cargar: ${activeMunicipio}`);
        setLoading(false);
      });
  }, [activeMunicipio]);

  const setActiveMunicipio = (slug: string) => {
    localStorage.setItem('qo_active_municipio', slug);
    setActiveMunicipioState(slug);
  };

  const value = useMemo(
    () => ({ rawData, municipalities, activeMunicipio, loading, setActiveMunicipio }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rawData, municipalities, activeMunicipio, loading],
  );

  return <ReportContext.Provider value={value}>{children}</ReportContext.Provider>;
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useReportContext(): ReportContextType {
  const ctx = useContext(ReportContext);
  if (!ctx) throw new Error('useReportContext debe usarse dentro de <ReportProvider>');
  return ctx;
}
