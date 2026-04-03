import API from './axiosConfig';

export const login = (data) => API.post('/login', data);
export const register = (data) => API.post('/register', data);
export const logout = () => API.post('/logout');
export const getProfil = () => API.get('/profil');
export const updateProfil = (data) => API.put('/profil', data);
export const changerLangue = (data) => API.post('/changer-langue', data);