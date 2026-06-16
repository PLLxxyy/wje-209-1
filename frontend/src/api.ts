const BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '请求失败');
  }
  return data as T;
}

// Auth
export async function apiRegister(username: string, password: string, nickname: string) {
  return request<{ token: string; user: { id: number; username: string; nickname: string } }>(
    '/auth/register',
    { method: 'POST', body: JSON.stringify({ username, password, nickname }) }
  );
}

export async function apiLogin(username: string, password: string) {
  return request<{ token: string; user: { id: number; username: string; nickname: string } }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ username, password }) }
  );
}

export async function apiGetMe() {
  return request<{ user: { id: number; username: string; nickname: string; avatar: string; created_at: string } }>(
    '/auth/me'
  );
}

// Meetups
export async function apiGetMeetups(params?: { status?: string; type?: string; search?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.type) qs.set('type', params.type);
  if (params?.search) qs.set('search', params.search);
  const q = qs.toString();
  return request<{ meetups: import('./types').Meetup[] }>(`/meetups${q ? `?${q}` : ''}`);
}

export async function apiGetMeetup(id: number) {
  return request<{ meetup: import('./types').Meetup; participants: import('./types').Participant[] }>(
    `/meetups/${id}`
  );
}

export async function apiCreateMeetup(data: {
  title: string;
  restaurant_type: string;
  description?: string;
  location: string;
  meeting_time: string;
  max_participants: number;
  estimated_cost: number;
}) {
  return request<{ meetup: import('./types').Meetup }>('/meetups', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiJoinMeetup(id: number) {
  return request<{ message: string }>(`/meetups/${id}/join`, { method: 'POST' });
}

export async function apiLeaveMeetup(id: number) {
  return request<{ message: string }>(`/meetups/${id}/leave`, { method: 'POST' });
}

export async function apiRecordExpense(id: number, actual_cost: number) {
  return request<{ message: string; actual_cost: number; per_person: number; participant_count: number }>(
    `/meetups/${id}/expense`,
    { method: 'POST', body: JSON.stringify({ actual_cost }) }
  );
}

export async function apiConfirmPayment(id: number) {
  return request<{ message: string }>(`/meetups/${id}/confirm`, { method: 'POST' });
}

// Users
export async function apiGetUserProfile() {
  return request<{ user: import('./types').User; stats: import('./types').UserStats }>('/users/me');
}

export async function apiGetMyCreated() {
  return request<{ meetups: import('./types').Meetup[] }>('/users/me/created');
}

export async function apiGetMyJoined() {
  return request<{ meetups: import('./types').Meetup[] }>('/users/me/joined');
}
