import API from './axiosConfig';

export const getNotifications = () => API.get('/notifications');
export const marquerLue = (id) => API.put(`/notifications/${id}/lue`);
export const marquerToutesLues = () => API.put('/notifications/tout-lues');
export const supprimerNotification = (id) => API.delete(`/notifications/${id}`);