async function getJson(path) {
  const resp = await fetch(path);
  if (!resp.ok) {
    throw new Error(`${path} -> ${resp.status}`);
  }
  return resp.json();
}

export function getEvents() {
  return getJson("/api/events");
}

export function getNudges() {
  return getJson("/api/nudges");
}
