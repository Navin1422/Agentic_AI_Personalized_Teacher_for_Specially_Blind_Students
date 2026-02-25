import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// ─── AI ───
export const sendMessage = (data) => API.post('/ai/chat', data);
export const endSession  = (data) => API.post('/ai/session-end', data);

// ─── Students ───
export const createStudent  = (data)      => API.post('/students', data);
export const getStudent     = (id)        => API.get(`/students/${id}`);
export const updateStudent  = (id, data)  => API.put(`/students/${id}`, data);
export const getProgress    = (id)        => API.get(`/students/${id}/progress`);

// ─── Content ───
export const getClasses  = ()                           => API.get('/content/classes');
export const getSubjects = (cls)                        => API.get(`/content/${cls}/subjects`);
export const getChapters = (cls, subject)               => API.get(`/content/${cls}/${subject}/chapters`);
export const getChapter  = (cls, subject, chapterNum)   => API.get(`/content/${cls}/${subject}/${chapterNum}`);

export default API;
