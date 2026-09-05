export const environment = {
  production: false,
  // Détection automatique intelligente :
  // - En local (localhost / 127.0.0.1) -> http://localhost:8080/api
  // - En production (Railway / Cloud)  -> https://backend-production-b6f9.up.railway.app/api
  apiUrl: (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
    ? 'https://backend-production-b6f9.up.railway.app/api'
    : 'http://localhost:8080/api'
};
