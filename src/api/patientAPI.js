import API from './axiosConfig';

export const getMonDossier = () => API.get('/patient/dossier');
export const getMonHistorique = () => API.get('/patient/historique');
export const getMesPrescriptions = () => API.get('/patient/prescriptions');
export const getMesResultats = () => API.get('/patient/resultats');
export const getCarnetVaccination = () => API.get('/patient/vaccination');
export const getVaccins = () => API.get('/patient/vaccination/vaccins');
export const getMonQRCode = () => API.get('/patient/qrcode');
export const getMesTeleconsultations = (params) => API.get('/patient/teleconsultations', { params });

// Constantes vitales (IoT)
export const getMesConstantesVitales = (params) => API.get('/patient/constantes-vitales', { params });
export const getLatestConstantes = (types) => API.get('/patient/constantes-vitales/latest', { params: { types } });
export const getHistoriqueConstantes = (params) => API.get('/patient/constantes-vitales/historique', { params });

// Rendez-vous
export const getMesRendezVous = () => API.get('/patient/rendez-vous');
export const prendreRendezVous = (data) => API.post('/patient/rendez-vous', data);
export const annulerRendezVous = (id) => API.put(`/patient/rendez-vous/${id}/annuler`);
export const modifierRendezVous = (id, data) => API.put(`/patient/rendez-vous/${id}/modifier`, data);
