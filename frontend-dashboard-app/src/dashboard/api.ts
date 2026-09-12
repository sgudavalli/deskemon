import type { Routine } from './types';

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(path, init);
  if (!resp.ok) {
    throw new Error(`${path} -> ${resp.status}`);
  }
  return resp.json();
}

export function getRoutines(): Promise<Routine[]> {
  return json('/api/routines');
}

export function createRoutine(routine: Routine): Promise<Routine> {
  return json('/api/routines', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(routine),
  });
}

export function updateRoutine(id: string, patch: Partial<Routine>): Promise<Routine> {
  return json(`/api/routines/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
}
