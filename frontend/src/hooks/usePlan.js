// ================================================
// FUELO — usePlan : plan d'abonnement (tous rôles)
// ================================================

import { useQuery } from '@tanstack/react-query'
import { useAuth }  from '../context/AuthContext'
import api          from '../services/api'

export const PLAN_COLORS = {
  starter:    { bg: '#374151', text: '#9CA3AF', border: '#4B5563', label: 'Starter',    emoji: '🔘' },
  pro:        { bg: '#1E3A8A', text: '#93C5FD', border: '#2563EB', label: 'Pro',         emoji: '💎' },
  enterprise: { bg: '#78350F', text: '#FCD34D', border: '#F59E0B', label: 'Enterprise',  emoji: '👑' },
}

// Plan nécessaire par feature (pour le message d'upgrade)
export const FEATURE_PLAN_REQUIS = {
  exports:      'pro',
  assistant:    'pro',
  performances: 'pro',
  logistique:   'pro',
  trajets:      'pro',
  citernes:     'pro',
  services:     'pro',
}

export function usePlan() {
  const { user } = useAuth()

  // Accessible à tous les rôles via /abonnements/mon-plan
  const { data, isLoading } = useQuery({
    queryKey:  ['mon-plan', user?.id],
    queryFn:   () => api.get('/abonnements/mon-plan').then(r => r.data),
    enabled:   !!user,
    staleTime: 5 * 60_000,
  })

  const plan    = data?.plan ?? 'starter'
  const planDef = data?.planDef ?? {
    label:        'Starter',
    max_stations: 1,
    max_employes: 5,
    features:     ['ventes', 'stock', 'alertes'],
    assistant_limit: 0,
    upgrade_vers: 'pro',
  }

  // Données complètes abonnement (owner uniquement — appelé séparément par AbonnementsPage)
  const { data: subData } = useQuery({
    queryKey:  ['abonnement'],
    queryFn:   () => api.get('/abonnements').then(r => r.data),
    enabled:   user?.role === 'owner',
    staleTime: 5 * 60_000,
  })

  const statut = subData?.abonnement?.statut ?? null

  const canAccess = (feature) => {
    if (isLoading) return true // fail-open pendant le chargement
    return planDef.features?.includes(feature) ?? false
  }

  return {
    plan,
    planDef,
    statut,
    colors:    PLAN_COLORS[plan] ?? PLAN_COLORS.starter,
    loading:   isLoading,
    isOwner:   user?.role === 'owner',
    canAccess,
    // Limites numériques (null = illimité)
    maxStations: planDef.max_stations,
    maxEmployes: planDef.max_employes,
    assistantLimit: planDef.assistant_limit,
  }
}
