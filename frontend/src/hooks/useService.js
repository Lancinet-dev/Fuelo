// ================================================
// FUELO — useService : anti-fraude pompistes
// ================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import toast from 'react-hot-toast'

// La photo du compteur (upload Cloudinary) exige une connexion → on bloque clairement hors ligne
const OFFLINE_MSG = 'Action impossible hors ligne — la photo du compteur nécessite une connexion internet'
const assertOnline = () => { if (typeof navigator !== 'undefined' && !navigator.onLine) throw new Error(OFFLINE_MSG) }

export function useService() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey:       ['service-actif'],
    queryFn:        () => api.get('/services/actif').then(r => r.data),
    staleTime:      30_000,
    refetchInterval: 60_000,
  })

  const { mutateAsync: demarrer, isPending: demarrerLoading } = useMutation({
    mutationFn: (formData) => {
      assertOnline()
      // Content-Type à `undefined` : laisse le navigateur poser
      // `multipart/form-data; boundary=...` lui-même — un override manuel
      // (ou l'`application/json` par défaut de l'instance axios) casse le
      // parsing multer côté backend (boundary manquant / FormData sérialisée en JSON)
      return api.post('/services', formData, { headers: { 'Content-Type': undefined } })
        .then(r => r.data)
    },
    onSuccess: () => {
      toast.success('Service démarré')
      queryClient.invalidateQueries({ queryKey: ['service-actif'] })
    },
    onError: (err) => toast.error(err.response?.data?.error ?? err.message ?? 'Erreur au démarrage'),
  })

  const { mutateAsync: terminer, isPending: terminerLoading } = useMutation({
    mutationFn: ({ id, formData }) => {
      assertOnline()
      return api.post(`/services/${id}/terminer`, formData, { headers: { 'Content-Type': undefined } })
        .then(r => r.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-actif'] })
      queryClient.invalidateQueries({ queryKey: ['alertes'] })
    },
    onError: (err) => toast.error(err.response?.data?.error ?? err.message ?? 'Erreur à la clôture'),
  })

  return {
    serviceActif:    data?.service ?? null,
    loading:         isLoading,
    demarrer,
    demarrerLoading,
    terminer,
    terminerLoading,
  }
}
