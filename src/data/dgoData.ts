/**
 * Fuente de datos del dashboard.
 *
 * - Todas las interfaces se exportan igual que antes.
 * - Los datos dinámicos se obtienen a través de `useReport()`, un hook
 *   que lee del ReportContext y se actualiza cuando el usuario cambia de municipio.
 * - El `report.json` estático sigue siendo el dato inicial (primer render).
 */
import { useMemo } from 'react';
import { useReportContext } from '../context/ReportContext';

// ─── Interfaces ────────────────────────────────────────────────────────────

export interface SentimentData {
  positive: number;
  neutral: number;
  negative: number;
}

export interface TrendPoint {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
}

export interface SourceMention {
  source: string;
  mentions: number;
}

export interface TopPerson {
  name: string;
  mentions: number;
}

export interface TopEntity {
  name: string;
  mentions: number;
}

export interface TopPost {
  platform: string;
  excerpt: string;
  impact: number;
}

export interface TopPostImpacto {
  titulo: string;
  url: string;
  platform: string;
  username?: string;
  views: number;
  likes: number;
  alcance?: number;
}

export interface InteractionTrend {
  month: string;
  rate: number;
}

export interface ApprovalTrend {
  month: string;
  approval: number;
}

export interface ServiceApproval {
  service: string;
  approval: number;
}

export interface Actor {
  name: string;
  value: number;
  type: 'allied' | 'hostile';
}

export interface AgentSummary {
  bullets: string[];
  narrativa: string;
}

export interface SentimentByPlatformEntry {
  positive: number;
  neutral: number;
  negative: number;
}

export interface QuejaPost {
  text: string;
  url: string;
  platform: string;
  username: string;
  nivel: string;
  emotions: string[];
}

export interface QuejaUbicacion {
  location: string;
  location_original: string;
  lat?: number;
  lng?: number;
  count: number;
  posts: QuejaPost[];
}

export interface QuejaCategoria {
  categoria: string;
  count: number;
}

export interface ReconocimientoTema {
  alcance: number;
  titulo: string;
  metricas: { likes: number; views: number };
  descripcion: string;
}

export interface ResumenOportunidades {
  nivel_oportunidad_general: string;
  total_posts_con_oportunidad: number;
  posts_analizados: number;
  recomendacion: string;
}

// ─── Hook principal ────────────────────────────────────────────────────────

/**
 * `useReport()` — devuelve todos los datos del reporte activo.
 * Se recalcula solo cuando cambia el municipio seleccionado.
 */
export function useReport() {
  const { rawData } = useReportContext();

  return useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = rawData as any;
    const t = raw.tabs ?? {};

    // ── Metadata ───────────────────────────────────────────────────────
    const municipio: string = raw.meta?.municipio ?? 'Municipio';
    const periodo: string   = raw.meta?.periodo   ?? '';

    // ── TOC ────────────────────────────────────────────────────────────
    const socialMentions: number      = t.toc?.socialMentions  ?? 0;
    const sentimentKPI: SentimentData = t.toc?.sentimentKPI    ?? { positive: 0, neutral: 0, negative: 0 };
    const interactionRate: number     = t.toc?.interactionRate  ?? 0;
    const citizenApproval: number     = t.toc?.citizenApproval  ?? 0;
    const agentSummary: AgentSummary  = t.toc?.agentSummary     ?? { bullets: [], narrativa: '' };

    // ── Scorecard ──────────────────────────────────────────────────────
    const followersActual: number = t.scorecard?.followersActual ?? 0;
    const newsCount: number       = t.scorecard?.newsCount ?? (t.alcance?.newsCount ?? 0);

    const interactionTrendData: InteractionTrend[] = t.scorecard?.interactionTrendData ?? [];
    const seguidoresTrend: { date: string; followers: number }[] = t.scorecard?.seguidoresTrend ?? [];
    const socialMentionsTrend: { date: string; mentions: number }[] = t.scorecard?.socialMentionsTrend ?? [];

    const _dia = t.scorecard?.scorecardDiaAnterior as Record<string, number> | undefined;
    const scorecardPeriodoAnterior = {
      sentimentPositive: _dia?.sentimentPositive ?? sentimentKPI.positive,
      socialMentions:    _dia?.socialMentions    ?? socialMentions,
      interactionRate:   _dia?.interactionRate   ?? interactionRate,
      citizenApproval:   _dia?.citizenApproval   ?? citizenApproval,
      newsCount,
      followers:         _dia?.followers         ?? followersActual,
    };

    // ── Sentimiento ────────────────────────────────────────────────────
    const sentimentTrend: TrendPoint[] = t.sentimiento?.sentimentTrend ?? [];
    const sentimentByPlatform: Record<string, SentimentByPlatformEntry> =
      t.sentimiento?.sentimentByPlatform ?? {};
    const topKeywords: { word: string; count: number }[] = t.sentimiento?.topKeywords ?? [];

    // ── Aprobación ─────────────────────────────────────────────────────
    const approvalTrend: ApprovalTrend[]      = t.aprobacion?.approvalTrend    ?? [];
    const serviceApprovals: ServiceApproval[] = t.aprobacion?.serviceApprovals ?? [];
    const alliedActors: number                = t.aprobacion?.alliedActors     ?? 0;
    const hostileActors: number               = t.aprobacion?.hostileActors    ?? 0;
    const actorsBalance: Actor[]              = (t.aprobacion?.actorsBalance   ?? []) as Actor[];

    // ── Alcance ────────────────────────────────────────────────────────
    const mentionsBySource: SourceMention[]          = t.alcance?.mentionsBySource          ?? [];
    const topPublicacionesImpacto: TopPostImpacto[]  = (t.alcance?.topPublicacionesImpacto  ?? []) as TopPostImpacto[];
    const topPersonasMencionadas: TopPerson[]        = t.alcance?.topPersonasMencionadas    ?? [];
    const topDependenciasMencionadas: TopEntity[]    = t.alcance?.topDependenciasMencionadas ?? [];
    const top5MediosRecurrentes: { nombre: string; menciones: number }[] = t.alcance?.top5MediosRecurrentes ?? [];
    const botsVsReal: { bots: number; real: number } = t.alcance?.botsVsReal ?? { bots: 15, real: 85 };
    const topPeople: TopPerson[]                     = (t.alcance?.topPeople ?? []) as TopPerson[];

    // ── Mapa ───────────────────────────────────────────────────────────
    const quejasPorUbicacion: QuejaUbicacion[] =
      (t.mapa?.quejasPorUbicacion ?? []) as QuejaUbicacion[];
    const quejasPorCategoria: QuejaCategoria[] =
      (t.mapa?.quejasPorCategoria ?? []) as QuejaCategoria[];

    // ── Reconocimientos ────────────────────────────────────────────────
    const reconocimientosTemas: ReconocimientoTema[] =
      (t.reconocimientos?.reconocimientosTemas ?? []) as ReconocimientoTema[];

    const resumenOportunidades: ResumenOportunidades = t.reconocimientos?.resumenOportunidades ?? {
      nivel_oportunidad_general: 'N/A',
      total_posts_con_oportunidad: 0,
      posts_analizados: 0,
      recomendacion: '',
    };

    return {
      municipio, periodo,
      socialMentions, sentimentKPI, interactionRate, citizenApproval, agentSummary,
      followersActual, newsCount, interactionTrendData, seguidoresTrend, socialMentionsTrend,
      scorecardPeriodoAnterior,
      sentimentTrend, sentimentByPlatform, topKeywords,
      approvalTrend, serviceApprovals, alliedActors, hostileActors, actorsBalance,
      mentionsBySource, topPublicacionesImpacto, topPersonasMencionadas,
      topDependenciasMencionadas, top5MediosRecurrentes, botsVsReal, topPeople,
      quejasPorUbicacion, quejasPorCategoria,
      reconocimientosTemas, resumenOportunidades,
    };
  }, [rawData]);
}
