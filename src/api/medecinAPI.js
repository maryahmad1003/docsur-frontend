import API from './axiosConfig';

// Patients
export const getPatients = (params) => API.get('/medecin/patients', { params });
export const creerPatient = (data) => API.post('/medecin/patients', data);
export const getPatient = (id) => API.get(`/medecin/patients/${id}`);
export const getHistorique = (id) => API.get(`/medecin/patients/${id}/historique`);
export const getConstantesVitales = (id) => API.get(`/medecin/patients/${id}/constantes-vitales`);
export const updatePatient = (id, data) => API.put(`/medecin/patients/${id}/update`, data);

// Consultations
export const getConsultations = (params) => API.get('/medecin/consultations', { params });
export const getTableauBordMedecin = () => API.get('/medecin/tableau-bord');
export const getConsultation = (id) => API.get(`/medecin/consultations/${id}`);
export const creerConsultation = (data) => API.post('/medecin/consultations', data);
export const updateConsultation = (id, data) => API.put(`/medecin/consultations/${id}`, data);
export const supprimerConsultation = (id) => API.delete(`/medecin/consultations/${id}`);

// Prescriptions
export const getPrescriptions = () => API.get('/medecin/prescriptions');
export const getPharmacies = () => API.get('/medecin/pharmacies');
export const getPrescription = (id) => API.get(`/medecin/prescriptions/${id}`);
export const creerPrescription = (data) => API.post('/medecin/prescriptions', data);
export const envoyerPharmacie = (id, data) => API.post(`/medecin/prescriptions/${id}/envoyer-pharmacie`, data);

// Téléconsultations
export const getTeleconsultations = (params) => API.get('/medecin/teleconsultations', { params });
export const creerTeleconsultation = (data) => API.post('/medecin/teleconsultations', data);
export const updateTeleconsultation = (id, data) => API.put(`/medecin/teleconsultations/${id}`, data);
export const demarrerTeleconsultation = (id) => API.post(`/medecin/teleconsultations/${id}/demarrer`);
export const terminerTeleconsultation = (id) => API.post(`/medecin/teleconsultations/${id}/terminer`);

// Demandes d'analyses
export const getDemandesAnalyses = () => API.get('/medecin/demandes-analyse');
export const creerDemandeAnalyse = (data) => API.post('/medecin/demandes-analyse', data);

// Rendez-vous du médecin
export const getRendezVousMedecin = (params) => API.get('/medecin/rendez-vous', { params });
export const confirmerRendezVous = (id) => API.put(`/medecin/rendez-vous/${id}/confirmer`);
export const refuserRendezVous = (id) => API.put(`/medecin/rendez-vous/${id}/refuser`);

// QR Code
export const scanQRCode = (code) => API.post('/medecin/qrcode/scanner', { code });
