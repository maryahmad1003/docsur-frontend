import API from './axiosConfig';

export const getConversations  = ()             => API.get('/messages/conversations');
export const getContacts       = ()             => API.get('/messages/contacts');
export const getNonLus         = ()             => API.get('/messages/non-lus');
export const getMessages       = (userId, params) => API.get(`/messages/${userId}`, { params });
export const sendMessage       = (data)         => API.post('/messages/', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
