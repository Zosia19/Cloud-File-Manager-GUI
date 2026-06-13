import axios from 'axios';

const http = axios.create({ baseURL: '/api' });

async function sha256(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

export function getUserIdFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub;
  } catch {
    return null;
  }
}

export async function login(name, password) {
  const res = await http.post('/v1/auth/login', { name, password });
  return res.data;
}

export async function register(name, password, confirmedPassword) {
  const res = await http.post('/v1/auth/register', { name, password, confirmedPassword });
  return res.data;
}

export async function listItems(location, token) {
  const res = await http.get('/v1/directories/items', {
    params: { location },
    headers: auth(token),
  });
  return res.data;
}

export async function getFile(id, token) {
  const res = await http.get(`/v1/files/${id}`, { headers: auth(token) });
  return res.data;
}

export async function uploadFile(file, directoryId, token) {
  const checksum = await sha256(file);
  const formData = new FormData();
  formData.append('file', file);
  formData.append('checksum', checksum);
  formData.append('idempotencyKey', crypto.randomUUID());
  if (directoryId) formData.append('directoryId', directoryId);

  const res = await http.post('/v1/files', formData, { headers: auth(token) });
  return res.data;
}

export async function downloadFile(id, token) {
  const res = await http.get(`/v1/files/${id}/download`, {
    headers: auth(token),
    responseType: 'blob',
  });
  return res;
}

export async function deleteFile(id, token) {
  await http.delete(`/v1/files/${id}`, { headers: auth(token) });
}

export async function renameFile(id, name, token) {
  const res = await http.patch(`/v1/files/${id}`, { name }, { headers: auth(token) });
  return res.data;
}

export async function createDirectory(name, parentId, token) {
  const res = await http.post('/v1/directories', { name, parentId: parentId || '' }, { headers: auth(token) });
  return res.data;
}

export async function deleteDirectory(id, token) {
  await http.delete(`/v1/directories/${id}`, { headers: auth(token) });
}

export async function renameDirectory(id, name, token) {
  const res = await http.patch(`/v1/directories/${id}`, { name }, { headers: auth(token) });
  return res.data;
}

export async function downloadDirectory(id, name, token) {
  const res = await http.get(`/v1/directories/${id}/download`, {
    headers: auth(token),
    responseType: 'blob',
  });
  return res;
}

export async function getUsage(location, token) {
  const res = await http.get('/v1/usage', {
    params: { location },
    headers: auth(token),
  });
  return res.data;
}
