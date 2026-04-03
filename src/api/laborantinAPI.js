import API from './axiosConfig';

export const getDemandes = () => API.get('/laborantin/demandes');
export const getDemande = (id) => API.get(`/laborantin/demandes/${id}`);
export const getResultats = () => API.get('/laborantin/resultats');
export const envoyerResultat = (data) => API.post('/laborantin/resultats', data);
export const modifierResultat = (id, data) => API.put(`/laborantin/resultats/${id}`, data);
export const envoyerResultatNotif = (id) => API.post(`/laborantin/resultats/${id}/envoyer`);