import { useEffect, useState } from "react";
import { getEvents, getNudges } from "./api.js";

const POLL_MS = 3000;
const MAX_EVENT_ROWS = 100;
const MAX_NUDGE_ROWS = 10;

function useLivePolling(fetchFn) {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      try {
        const rows = await fetchFn();
        if (!cancelled) {
          setData(rows);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [fetchFn]);

  return { data, error };
}

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return ts;
  }
}

function isFake(event) {
  return Boolean(event.payload && event.payload.synthetic);
}

function EventsFeed({ onCount, showFake }) {
  const { data, error } = useLivePolling(getEvents);

  useEffect(() => {
    onCount(data.length);
  }, [data.length, onCount]);

  const filtered = showFake ? data : data.filter((e) => !isFake(e));
  const newestFirst = [...filtered].reverse().slice(0, MAX_EVENT_ROWS);

  return (
    <div className="panel">
      <h2>
        <span className="dot" /> Events
        <span className="count">{filtered.length}</span>
      </h2>
      {error && <div className="error">Error: {error}</div>}
      {!error && newestFirst.length === 0 && (
        <div className="empty">
          {showFake ? "No events yet..." : "No real events yet..."}
        </div>
      )}
      <div className="list">
        {newestFirst.map((e) => (
          <div className="row" key={e.id}>
            <div className="row-top">
              <span className={`badge badge-${e.source}`}>{e.source}</span>
              <span>{e.type}</span>
              {isFake(e) && <span className="badge badge-fake">fake</span>}
              <span>{formatTime(e.timestamp)}</span>
            </div>
            <div className="payload">{JSON.stringify(e.payload)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NudgesList({ onCount }) {
  const { data, error } = useLivePolling(getNudges);
  const newestFirst = [...data].reverse().slice(0, MAX_NUDGE_ROWS);
  const activeCount = data.filter((n) => !n.dismissed).length;

  useEffect(() => {
    onCount(data.length);
  }, [data.length, onCount]);

  return (
    <div className="panel">
      <h2>
        <span className="dot" /> Nudges
        <span className="count">{data.length}</span>
        {activeCount > 0 && <span className="count-sub">{activeCount} active</span>}
      </h2>
      {error && <div className="error">Error: {error}</div>}
      {!error && newestFirst.length === 0 && (
        <div className="empty">No nudges yet...</div>
      )}
      <div className="list">
        {newestFirst.map((n) => (
          <div
            className={`row ${n.dismissed ? "dismissed" : ""}`}
            key={n.id}
          >
            <div className="row-top">
              <span className={`badge badge-${n.type}`}>{n.type}</span>
              <span>{formatTime(n.timestamp)}</span>
            </div>
            <div className="message">{n.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [eventsCount, setEventsCount] = useState(0);
  const [nudgesCount, setNudgesCount] = useState(0);
  const [showFake, setShowFake] = useState(true);

  return (
    <div className="app">
      <div className="header-row">
        <div>
          <h1>Deskemon Monitor</h1>
          <p className="subtitle">Live events and nudges, polling every {POLL_MS / 1000}s</p>
        </div>
        <label className="toggle">
          <span>Fake events</span>
          <input
            type="checkbox"
            checked={showFake}
            onChange={(e) => setShowFake(e.target.checked)}
          />
          <span className="toggle-track">
            <span className="toggle-thumb" />
          </span>
          <span className="toggle-state">{showFake ? "Yes" : "No"}</span>
        </label>
      </div>

      <div className="summary">
        <div className="summary-stat">
          <div className="summary-number">{eventsCount}</div>
          <div className="summary-label">Events received</div>
        </div>
        <div className="summary-stat">
          <div className="summary-number">{nudgesCount}</div>
          <div className="summary-label">Nudges generated</div>
        </div>
      </div>

      <div className="panels">
        <EventsFeed onCount={setEventsCount} showFake={showFake} />
        <NudgesList onCount={setNudgesCount} />
      </div>
    </div>
  );
}
