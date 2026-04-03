import API from './axiosConfig';

export const getOrdonnances = () => API.get('/pharmacien/ordonnances');
export const getOrdonnance = (id) => API.get(`/pharmacien/ordonnances/${id}`);
export const validerDelivrance = (id) => API.post('/pharmacien/delivrances', { prescription_id: id });
export const getDelivrances = () => API.get('/pharmacien/delivrances');
