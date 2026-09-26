const API_BASE = '/api';

export async function fetchRequests() {
  const res = await fetch(`${API_BASE}/requests`);
  return res.json();
}

export async function fetchRequestById(requestId) {
  const res = await fetch(`${API_BASE}/requests/${requestId}`);
  return res.json();
}

export async function uploadPhoto(photoData) {
  const res = await fetch(`${API_BASE}/photos/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(photoData)
  });
  return res.json();
}

export async function tagPhoto(photoId, tagData) {
  const res = await fetch(`${API_BASE}/photos/${photoId}/tag`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tagData)
  });
  return res.json();
}

export async function updateConsent(consentData) {
  const res = await fetch(`${API_BASE}/consent/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(consentData)
  });
  return res.json();
}

export async function transmitRequest(requestData) {
  const res = await fetch(`${API_BASE}/requests/transmit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData)
  });
  return res.json();
}

export async function handleHospitalAction(requestId, actionData) {
  const res = await fetch(`${API_BASE}/requests/${requestId}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(actionData)
  });
  return res.json();
}

export async function streamPhoto(photoId, viewerParams = {}) {
  const query = new URLSearchParams(viewerParams).toString();
  const res = await fetch(`${API_BASE}/photos/${photoId}/stream?${query}`);
  return res.json();
}

export async function fetchAuditLogs(queryParams = {}) {
  const query = new URLSearchParams(queryParams).toString();
  const res = await fetch(`${API_BASE}/audit/logs?${query}`);
  return res.json();
}

export async function fetchSchemas() {
  const res = await fetch(`${API_BASE}/audit/schemas`);
  return res.json();
}

export async function resetStore() {
  const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
  return res.json();
}
