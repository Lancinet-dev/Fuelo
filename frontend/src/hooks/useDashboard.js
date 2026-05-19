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
    stocks:          data?.stocks          ?? [],
    aujourdhui:      data?.aujourd_hui     ?? { nb: 0, litres: 0, montant: 0 },
    cemois:          data?.ce_mois         ?? { nb: 0, litres: 0, montant: 0 },
    graphique7j:     data?.graphique_7j    ?? [],
    alertesNonLues:  parseInt(data?.alertes_non_lues ?? 0),
    loading:         isLoading,
    error:           error?.message ?? null,
    refetch,
  }
}