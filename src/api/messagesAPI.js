import API from './axiosConfig';

export const getConversations  = (params = {}) => API.get('/messages/conversations', { params });
export const getContacts       = (params = {}) => API.get('/messages/contacts', { params });
export const getNonLus         = () => API.get('/messages/non-lus');
export const getMessages       = (userId, params = {}) => API.get(`/messages/${userId}`, { params });
export const sendMessage       = (data) => API.post('/messages/', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
