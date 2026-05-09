import axios from 'axios'

// Connexion au backend
const api = axios.create({
  baseURL: 'http://localhost:5000/api'
})

// Ajouter le token JWT automatiquement
api.interceptors.request.use(config => {
  const token = localStorage.getItem('fuelo_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Si token expiré → retour login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fuelo_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
