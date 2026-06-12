// ================================================
// FUELO V2 — useDashboard
// Fichier : frontend/src/hooks/useDashboard.js
// ================================================

import { useQuery } from '@tanstack/react-query'
import api from '../services/api'

export function useDashboard() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey:    ['dashboard'],
    queryFn:     () => api.get('/stats/resume').then(r => r.data),
    staleTime:   30_000,   // 30s avant refetch
    refetchInterval: 60_000, // refresh auto toutes les 60s
  })

  return {
    stocks:            data?.stocks             ?? [],
    aujourdhui:        data?.aujourd_hui        ?? { nb: 0, litres: 0, montant: 0 },
    veille:            data?.veille             ?? { nb: 0, litres: 0, montant: 0 },
    cemois:            data?.ce_mois            ?? { nb: 0, litres: 0, montant: 0 },
    semaine:           data?.semaine_courante   ?? { nb: 0, litres: 0, montant: 0 },
    semainePrec:       data?.semaine_precedente ?? { nb: 0, litres: 0, montant: 0 },
    graphique7j:       data?.graphique_7j       ?? [],
    alertesNonLues:    parseInt(data?.alertes_non_lues ?? 0),
    loading:           isLoading,
    error:             error?.message ?? null,
    refetch,
  }
}

// ── Graphique dashboard — période sélectionnable (7j / 30j / 3m) ──
export function useGraphique(periode = '7j') {
  const { data, isLoading } = useQuery({
    queryKey:  ['dashboard-graphique', periode],
    queryFn:   () => api.get(`/stats/graphique?periode=${periode}`).then(r => r.data),
    staleTime: 60_000,
  })

  return {
    donnees: data?.donnees ?? [],
    loading: isLoading,
  }
}

// Calcule la tendance (% variation + sens) entre deux valeurs — utilisé par les StatCards
export function calcTrend(actuel, precedent) {
  const a = Number(actuel ?? 0)
  const p = Number(precedent ?? 0)
  if (p === 0) return a > 0 ? { pct: 100, up: true } : null
  const pct = Math.round(((a - p) / p) * 100)
  if (pct === 0) return null
  return { pct: Math.abs(pct), up: pct > 0 }
}