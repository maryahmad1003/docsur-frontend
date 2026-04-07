import API from './axiosConfig';

export const getConstantesVitales = (params) => API.get('/patient/constantes-vitales', { params });

export const getLatestConstantes = (types) => API.get('/patient/constantes-vitales/latest', { params: { types } });

export const getHistoriqueConstantes = (params) => API.get('/patient/constantes-vitales/historique', { params });

export const syncConstantesIoT = (data) => API.post('/iot/constantes/sync', data);

export const addConstanteVitale = (data) => API.post('/iot/constantes', data);

export const getConstantesList = (params) => API.get('/iot/constantes', { params });

export const getConnectedDevices = (patientId) => API.get('/iot/devices', { params: { patient_id: patientId } });
