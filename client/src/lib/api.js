// Small fetch wrapper for the REST API. Throws Error(message) on failure.
export async function api(path, { token, method = 'GET', body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    const err = new Error(data.message || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const chatApi = {
  listConversations: (token) => api('/conversations', { token }),
  startConversation: (token, userId) => api('/conversations', { token, method: 'POST', body: { userId } }),
  getMessages: (token, conversationId, { before, limit } = {}) => {
    const q = new URLSearchParams();
    if (before) q.set('before', before);
    if (limit) q.set('limit', limit);
    const qs = q.toString();
    return api(`/conversations/${conversationId}/messages${qs ? `?${qs}` : ''}`, { token });
  },
  searchUsers: (token, search = '') => api(`/users?search=${encodeURIComponent(search)}`, { token }),
};

// Group messages use chatApi.getMessages + the socket, same as 1:1 chats.
export const groupApi = {
  list: (token) => api('/groups', { token }),
  get: (token, id) => api(`/groups/${id}`, { token }),
  create: (token, { name, description, memberIds }) =>
    api('/groups', { token, method: 'POST', body: { name, description, memberIds } }),
  update: (token, id, fields) => api(`/groups/${id}`, { token, method: 'PATCH', body: fields }),
  addMembers: (token, id, userIds) => api(`/groups/${id}/members`, { token, method: 'POST', body: { userIds } }),
  removeMember: (token, id, userId) => api(`/groups/${id}/members/${userId}`, { token, method: 'DELETE' }),
  makeAdmin: (token, id, userId) => api(`/groups/${id}/admins/${userId}`, { token, method: 'PUT' }),
  removeAdmin: (token, id, userId) => api(`/groups/${id}/admins/${userId}`, { token, method: 'DELETE' }),
};
