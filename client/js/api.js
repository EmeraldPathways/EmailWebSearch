const BASE_URL = '/v1';

function getToken() {
  return document.getElementById('api-token')?.value ?? '';
}

export function showToast(message, type = '') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3500);
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });

  const body = await res.json();

  if (!res.ok) {
    const msg = body?.error?.message ?? `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return body;
}

export async function startExtraction(urls) {
  return request('/extract', {
    method: 'POST',
    body: JSON.stringify({ urls }),
  });
}

export async function getExtraction(id) {
  return request(`/extract/${id}`);
}

export async function getHistory(limit = 20, offset = 0) {
  return request(`/extract/history?limit=${limit}&offset=${offset}`);
}
