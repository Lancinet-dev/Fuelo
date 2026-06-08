// ================================================
// FUELO — useAssistant (chat avec l'IA Fuelo)
// ================================================

import { useMutation } from '@tanstack/react-query'
import api from '../services/api'

export function useAssistantChat() {
  return useMutation({
    mutationFn: (messages) =>
      api.post('/assistant', { messages }).then(r => r.data.reponse),
  })
}
