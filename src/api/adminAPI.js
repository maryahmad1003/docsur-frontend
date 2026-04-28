import API from './axiosConfig';

// Utilisateurs
export const getUtilisateurs = (params) => API.get('/admin/utilisateurs', { params });
export const getUtilisateur = (id) => API.get(`/admin/utilisateurs/${id}`);
export const creerUtilisateur = (data) => API.post('/admin/utilisateurs', data);
export const modifierUtilisateur = (id, data) => API.put(`/admin/utilisateurs/${id}`, data);
export const supprimerUtilisateur = (id) => API.delete(`/admin/utilisateurs/${id}`);

// Centres de santé
export const getCentresSante = () => API.get('/admin/centres-sante');
export const creerCentreSante = (data) => API.post('/admin/centres-sante', data);
export const modifierCentreSante = (id, data) => API.put(`/admin/centres-sante/${id}`, data);
export const supprimerCentreSante = (id) => API.delete(`/admin/centres-sante/${id}`);

// Campagnes
export const getCampagnes = () => API.get('/admin/campagnes');
export const creerCampagne = (data) => API.post('/admin/campagnes', data);
export const modifierCampagne = (id, data) => API.put(`/admin/campagnes/${id}`, data);
export const supprimerCampagne = (id) => API.delete(`/admin/campagnes/${id}`);

// Statistiques
export const getStatistiques = () => API.get('/admin/statistiques');
export const getStatsCentre = (id) => API.get(`/admin/statistiques/centre/${id}`);
export const getRolesPermissions = () => API.get('/admin/roles-permissions');
export const getSecurite = () => API.get('/admin/securite');

// Exports
export const exportPatientsCSV = () => API.get('/admin/export/patients', { responseType: 'blob' });
export const exportConsultationsCSV = () => API.get('/admin/export/consultations', { responseType: 'blob' });
export const exportStatsPDF = () => API.get('/admin/export/stats-pdf', { responseType: 'blob' });
