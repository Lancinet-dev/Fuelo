// ================================================
// FUELO — Upload / suppression du logo de la station
// Mutation partagée pour POST/DELETE /station/logo,
// utilisée par Parametres (LogoSection) et l'onboarding (StepLogo)
// ================================================

import { useMutation, useQueryClient } from '@tanstack/react-query'
import api   from '../services/api'
import toast from 'react-hot-toast'

export function useLogoUpload() {
  const queryClient = useQueryClient()

  const { mutateAsync: uploadLogo, isPending: uploading } = useMutation({
    mutationFn: (file) => {
      const fd = new FormData()
      fd.append('logo', file)
      return api.post('/station/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
    },
    onSuccess: () => {
      toast.success('Logo mis à jour')
      queryClient.invalidateQueries({ queryKey: ['parametres'] })
    },
    onError: (err) => toast.error(err?.response?.data?.error ?? 'Erreur upload du logo'),
  })

  const { mutateAsync: deleteLogo, isPending: deleting } = useMutation({
    mutationFn: () => api.delete('/station/logo'),
    onSuccess: () => {
      toast.success('Logo supprimé')
      queryClient.invalidateQueries({ queryKey: ['parametres'] })
    },
    onError: (err) => toast.error(err?.response?.data?.error ?? 'Erreur'),
  })

  return { uploadLogo, uploading, deleteLogo, deleting }
}
