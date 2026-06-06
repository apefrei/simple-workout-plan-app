const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001';

const TOKEN_KEY = 'workout_auth_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.error || `HTTP ${res.status}`), {
      status: res.status,
      body,
    });
  }

  return res.json() as Promise<T>;
}

export interface ApiUser {
  id: string;
  email: string;
}

export interface AuthResponse {
  user: ApiUser;
  token: string;
}

export const auth = {
  signup: (email: string, password: string, captchaToken?: string | null) =>
    apiFetch<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, captchaToken }),
    }),

  signin: (email: string, password: string, captchaToken?: string | null) =>
    apiFetch<AuthResponse>('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password, captchaToken }),
    }),

  me: () => apiFetch<AuthResponse>('/api/auth/me'),

  signout: () => apiFetch<{ success: boolean }>('/api/auth/signout', { method: 'POST' }),
};

export interface Routine {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export const routines = {
  list: () => apiFetch<Routine[]>('/api/routines'),
  get: (id: string) => apiFetch<Routine>(`/api/routines/${id}`),
  create: (name: string) =>
    apiFetch<Routine>('/api/routines', { method: 'POST', body: JSON.stringify({ name }) }),
  update: (id: string, name: string) =>
    apiFetch<Routine>(`/api/routines/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/routines/${id}`, { method: 'DELETE' }),
};

export interface Exercise {
  id: string;
  routine_id: string;
  name: string;
  muscle_group: string;
  machine_info: string | null;
  target_sets_reps: string | null;
  media_url: string | null;
  starting_weight_kg: number | null;
  sort_order: number;
  created_at: string;
}

export const exercises = {
  list: (routineId: string) =>
    apiFetch<Exercise[]>(`/api/exercises?routineId=${encodeURIComponent(routineId)}`),

  create: (data: {
    routine_id: string;
    name: string;
    muscle_group: string;
    machine_info?: string | null;
    target_sets_reps?: string | null;
    sort_order?: number;
  }) => apiFetch<Exercise>('/api/exercises', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, updates: Partial<Omit<Exercise, 'id' | 'routine_id' | 'created_at'>>) =>
    apiFetch<Exercise>(`/api/exercises/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/exercises/${id}`, { method: 'DELETE' }),

  reorder: (exerciseIds: string[]) =>
    apiFetch<{ success: boolean }>('/api/exercises/reorder', {
      method: 'POST',
      body: JSON.stringify({ exerciseIds }),
    }),
};

export interface WorkoutLog {
  id: string;
  user_id: string;
  exercise_id: string;
  weight_kg: number;
  reps: number;
  comment: string | null;
  logged_at: string;
}

export const workoutLogs = {
  list: (exerciseIds: string[]) =>
    apiFetch<WorkoutLog[]>(
      `/api/workout-logs?exerciseIds=${exerciseIds.map(encodeURIComponent).join(',')}`
    ),

  create: (data: {
    exercise_id: string;
    weight_kg: number;
    reps: number;
    comment?: string;
    logged_at?: string;
  }) => apiFetch<WorkoutLog>('/api/workout-logs', { method: 'POST', body: JSON.stringify(data) }),
};

export async function uploadFile(file: File): Promise<string> {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_URL}/api/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Upload failed');
  }

  const data = await res.json();
  return data.url as string;
}

export async function deleteFile(fileUrl: string): Promise<void> {
  const marker = '/api/uploads/';
  const idx = fileUrl.indexOf(marker);
  if (idx === -1) return;

  const filePath = fileUrl.slice(idx + marker.length);
  await apiFetch('/api/upload', { method: 'DELETE', body: JSON.stringify({ filePath }) });
}
