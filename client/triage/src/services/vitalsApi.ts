import type { VitalsData } from '../types/triage';

const API_BASE_URL = 'http://localhost:5000/api/vitals';

export interface VitalsUpdatePayload {
  patientId: string;
  heartRate: number;
  spo2: number;
}

export interface VitalsUpdateResponse {
  message: string;
  data: VitalsData;
}

/**
 * Fetch latest vitals from the backend API
 */
export async function fetchVitals(): Promise<VitalsData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(API_BASE_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch vitals`);
    }

    const data: VitalsData = await response.json();
    return data;
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Connection timed out while fetching vitals from backend.', { cause: error });
    }
    if (error instanceof Error) {
      throw new Error(error.message, { cause: error });
    }
    throw new Error('An unexpected error occurred while fetching vitals.', { cause: error });
  }
}

/**
 * Post new/simulated vitals to the backend API
 */
export async function updateVitals(payload: VitalsUpdatePayload): Promise<VitalsUpdateResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message =
        typeof errorData === 'object' && errorData !== null && 'message' in errorData
          ? String(errorData.message)
          : `HTTP ${response.status}: Failed to submit vitals`;
      throw new Error(message);
    }

    const result: VitalsUpdateResponse = await response.json();
    return result;
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Connection timed out while updating vitals on backend.', { cause: error });
    }
    if (error instanceof Error) {
      throw new Error(error.message, { cause: error });
    }
    throw new Error('An unexpected error occurred while updating vitals.', { cause: error });
  }
}
