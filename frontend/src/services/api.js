import axios from 'axios'

// Use window.location.origin for production (dynamic), localhost for development
const baseURL = process.env.NODE_ENV === 'production' 
  ? window.location.origin 
  : 'http://localhost:3001'

const api = axios.create({
  baseURL: baseURL,
  headers: { 'Content-Type': 'application/json' }
})

export const chiliApi = {
  getAll: () => api.get('/api/chilis'),
  create: (chili) => api.post('/api/chilis', chili),
  getScores: (chiliId) => api.get(`/api/scores/${chiliId}`),
  getAllScores: () => api.get('/api/scores'),
  getFinalScores: () => api.get('/api/scores/final'),
  submitScore: (score) => api.post('/api/scores', score),
  submitBonusScores: (data) => api.post('/api/bonus-scores', data),
  delete: () => api.delete('/api/chilis'),
  deleteByNumber: (number) => api.delete(`/api/chilis/${number}`),
  // Bonus round methods
  getBonusRoundStatus: () => api.get('/api/competition/bonus/status'),
  startBonusRound: () => api.post('/api/competition/bonus/start'),
  endBonusRound: () => api.post('/api/competition/bonus/end')
}