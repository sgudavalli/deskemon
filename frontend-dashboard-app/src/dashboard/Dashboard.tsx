import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { DEFAULT_DASHBOARD_STATE } from './defaults';
import type {
  ActivityEntry,
  Connection,
  ConnectionIcon,
  DashboardSection,
  DashboardState,
  PrivacySettings,
  Routine,
  RoutineIcon,
} from './types';
import './dashboard.css';

const STORAGE_KEY = 'deskemon-control-center-v1';
const COMPANION_URL = import.meta.env.VITE_COMPANION_URL
  ?? (import.meta.env.DEV ? 'http://localhost:5176' : 'http://localhost:5173');

const SECTION_COPY: Record<DashboardSection, { title: string; description: string }> = {
  overview: {
    title: 'Good afternoon, Champ',
    description: 'Deskemon is nearby and your routines are running.',
  },
  routines: {
    title: 'Routines',
    description: 'Decide when Deskemon should notice, wait, and gently step in.',
  },
  connections: {
    title: 'Connections',
    description: 'Choose the context Deskemon can use and what it may prepare for you.',
  },
  privacy: {
    title: 'Privacy & autonomy',
    description: 'Control what is sensed, remembered, and allowed to happen.',
  },
};

function loadState(): DashboardState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_DASHBOARD_STATE;
    const parsed = JSON.parse(saved) as Partial<DashboardState>;
    return {
      routines: parsed.routines ?? DEFAULT_DASHBOARD_STATE.routines,
      connections: parsed.connections ?? DEFAULT_DASHBOARD_STATE.connections,
      privacy: { ...DEFAULT_DASHBOARD_STATE.privacy, ...parsed.privacy },
      activity: parsed.activity ?? DEFAULT_DASHBOARD_STATE.activity,
    };
  } catch {
    return DEFAULT_DASHBOARD_STATE;
  }
}

function Icon({
  name,
  size = 20,
}: {
  name:
    | DashboardSection
    | RoutineIcon
    | ConnectionIcon
    | 'plus'
    | 'device'
    | 'arrow'
    | 'check'
    | 'shield'
    | 'activity'
    | 'close'
    | 'external'
    | 'chevron';
  size?: number;
}) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  const paths: Record<string, ReactNode> = {
    overview: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
    routines: <><path d="M12 7v5l3 2" /><circle cx="12" cy="12" r="9" /><path d="M8 2h8" /></>,
    connections: <><circle cx="6" cy="12" r="3" /><circle cx="18" cy="6" r="3" /><circle cx="18" cy="18" r="3" /><path d="m8.7 10.6 6.5-3.2M8.7 13.4l6.5 3.2" /></>,
    privacy: <><path d="M12 3 5 6v5c0 4.8 2.9 8.3 7 10 4.1-1.7 7-5.2 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-5" /></>,
    stand: <><circle cx="12" cy="4.5" r="2" /><path d="M9 21v-6l-2-3 2-5h6l2 5-2 3v6M9 12h6" /></>,
    water: <path d="M12 2S6 9 6 14a6 6 0 0 0 12 0c0-5-6-12-6-12Z" />,
    food: <><path d="M5 3v8M8 3v8M5 7h3M6.5 11v10M16 3v18M16 3c3 2 3 7 0 9" /></>,
    medicine: <><path d="m8.5 4.5 11 11a4 4 0 0 1-5.7 5.7l-11-11a4 4 0 1 1 5.7-5.7Z" /><path d="m8 15 7-7" /></>,
    focus: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>,
    custom: <><path d="M12 3v18M3 12h18" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></>,
    slack: <><path d="M9 3a2 2 0 0 1 2 2v4H7a2 2 0 1 1 2-2V3ZM21 9a2 2 0 0 1-2 2h-4V7a2 2 0 1 1 2 2h4ZM15 21a2 2 0 0 1-2-2v-4h4a2 2 0 1 1-2 2v4ZM3 15a2 2 0 0 1 2-2h4v4a2 2 0 1 1-2-2H3Z" /></>,
    codex: <><path d="M12 3 4.2 7.5v9L12 21l7.8-4.5v-9L12 3Z" /><path d="m8 10 4-2.3 4 2.3v4l-4 2.3L8 14v-4Z" /></>,
    meeting: <><rect x="3" y="5" width="13" height="14" rx="3" /><path d="m16 10 5-3v10l-5-3" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    device: <><rect x="3" y="5" width="18" height="14" rx="4" /><path d="M8 9h.01M16 9h.01M8 9h8" /></>,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    shield: <><path d="M12 3 5 6v5c0 4.8 2.9 8.3 7 10 4.1-1.7 7-5.2 7-10V6l-7-3Z" /><path d="M9.5 12h5M12 9.5v5" /></>,
    activity: <><path d="M3 12h4l2-5 4 10 2-5h6" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...common}>{paths[name]}</svg>;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button className={`dash-toggle ${checked ? 'is-on' : ''}`} onClick={onChange} role="switch" aria-checked={checked} aria-label={label}>
      <span />
    </button>
  );
}

function timeAgo(timestamp: string) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(timestamp).getTime()) / 60_000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
}

function scheduleLabel(routine: Routine) {
  if (routine.unit === 'daily') return `Daily at ${routine.activeStart}`;
  return `Every ${routine.every} ${routine.unit}`;
}

function DeskemonFace() {
  return <svg viewBox="0 0 600 300" role="img" aria-label="Deskemon is happy"><g fill="none" stroke="currentColor" strokeWidth="22" strokeLinecap="round"><path d="M120 158c34-53 84-51 112-2" /><path d="M368 156c29-49 79-51 112 2" /><path d="M228 158h144" /></g></svg>;
}

function Panel({ title, action, children, className = '' }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`dash-panel ${className}`}><div className="dash-panel-head"><h2>{title}</h2>{action}</div>{children}</section>;
}

function ActivityList({ entries }: { entries: ActivityEntry[] }) {
  return <div className="activity-list">{entries.slice(0, 6).map((entry) => <div className="activity-row" key={entry.id}><span className={`activity-dot ${entry.tone}`} /><div><strong>{entry.text}</strong><p>{entry.detail}</p></div><time>{timeAgo(entry.timestamp)}</time></div>)}</div>;
}

export function Dashboard() {
  const [section, setSection] = useState<DashboardSection>('overview');
  const [model, setModel] = useState<DashboardState>(loadState);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [showAddRoutine, setShowAddRoutine] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(model)), [model]);

  const notify = useCallback((text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const addActivity = useCallback((text: string, detail: string, tone: ActivityEntry['tone'] = 'neutral') => {
    setModel((current) => ({
      ...current,
      activity: [{ id: `${Date.now()}-${Math.random()}`, text, detail, timestamp: new Date().toISOString(), tone }, ...current.activity].slice(0, 30),
    }));
  }, []);

  const updateRoutine = useCallback((id: string, patch: Partial<Routine>, log?: string) => {
    setModel((current) => ({ ...current, routines: current.routines.map((routine) => routine.id === id ? { ...routine, ...patch } : routine) }));
    if (log) addActivity(log, 'Routine configuration changed in this browser.', 'success');
  }, [addActivity]);

  const updateConnection = useCallback((id: string, patch: Partial<Connection>) => {
    setModel((current) => ({ ...current, connections: current.connections.map((connection) => connection.id === id ? { ...connection, ...patch } : connection) }));
  }, []);

  const updatePrivacy = useCallback((patch: Partial<PrivacySettings>, label: string) => {
    setModel((current) => ({ ...current, privacy: { ...current.privacy, ...patch } }));
    addActivity(label, 'Privacy configuration changed in this browser.', 'attention');
  }, [addActivity]);

  const activeRoutines = model.routines.filter((routine) => routine.enabled);
  const connectedApps = model.connections.filter((connection) => connection.connected);
  const selectedRoutine = model.routines.find((routine) => routine.id === selectedRoutineId) ?? null;
  const selectedConnection = model.connections.find((connection) => connection.id === selectedConnectionId) ?? null;
  const copy = SECTION_COPY[section];

  const connect = (connection: Connection) => {
    if (connection.connected) {
      updateConnection(connection.id, { connected: false, statusDetail: 'Not connected' });
      addActivity(`${connection.name} disconnected`, 'The connection is now unavailable to Deskemon.', 'attention');
      notify(`${connection.name} disconnected`);
      return;
    }
    setConnectingId(connection.id);
    window.setTimeout(() => {
      updateConnection(connection.id, { connected: true, statusDetail: 'Demo connection · Ready' });
      setConnectingId(null);
      addActivity(`${connection.name} connected`, 'Permission choices are ready for backend integration.', 'success');
      notify(`${connection.name} connected for this prototype`);
    }, 700);
  };

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <a className="dash-brand" href={COMPANION_URL} aria-label="Open the Deskemon companion"><span className="brand-face"><i /><b /><i /></span><span>Deskemon<small>Control center</small></span></a>
        <nav aria-label="Dashboard sections">
          {(Object.keys(SECTION_COPY) as DashboardSection[]).map((item) => <button key={item} className={section === item ? 'active' : ''} onClick={() => setSection(item)}><Icon name={item} /><span>{item[0].toUpperCase() + item.slice(1)}</span>{item === 'connections' && <em>{connectedApps.length}</em>}</button>)}
        </nav>
        <div className="sidebar-device"><span className="status-light" /><div><strong>Deskemon nearby</strong><small>iPhone · Local prototype</small></div></div>
        <a className="open-companion" href={COMPANION_URL}><span>Open companion</span><Icon name="arrow" size={17} /></a>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header"><div><span className="eyebrow">DESKEMON · LOCAL PROTOTYPE</span><h1>{copy.title}</h1><p>{copy.description}</p></div><div className="header-actions"><span className="saved-state"><Icon name="check" size={15} />Saved locally</span><a className="round-link" href={COMPANION_URL} aria-label="Open companion"><Icon name="external" size={19} /></a></div></header>

        {section === 'overview' && <Overview routines={activeRoutines} connections={connectedApps} activity={model.activity} onOpenRoutines={() => setSection('routines')} onOpenConnections={() => setSection('connections')} />}
        {section === 'routines' && <Routines routines={model.routines} onSelect={setSelectedRoutineId} onToggle={(routine) => { updateRoutine(routine.id, { enabled: !routine.enabled }, `${routine.name} ${routine.enabled ? 'paused' : 'enabled'}`); notify(`${routine.name} ${routine.enabled ? 'paused' : 'enabled'}`); }} onAdd={() => setShowAddRoutine(true)} />}
        {section === 'connections' && <Connections connections={model.connections} connectingId={connectingId} onSelect={setSelectedConnectionId} onConnect={connect} />}
        {section === 'privacy' && <Privacy settings={model.privacy} onChange={updatePrivacy} onReset={() => { localStorage.removeItem(STORAGE_KEY); setModel(DEFAULT_DASHBOARD_STATE); notify('Prototype settings restored'); }} />}
      </main>

      {selectedRoutine && <RoutineEditor routine={selectedRoutine} onClose={() => setSelectedRoutineId(null)} onChange={(patch) => updateRoutine(selectedRoutine.id, patch)} onSave={() => { addActivity(`${selectedRoutine.name} updated`, scheduleLabel(selectedRoutine), 'success'); setSelectedRoutineId(null); notify('Routine saved'); }} />}
      {selectedConnection && <ConnectionEditor connection={selectedConnection} onClose={() => setSelectedConnectionId(null)} onChange={(patch) => updateConnection(selectedConnection.id, patch)} onConnect={() => connect(selectedConnection)} />}
      {showAddRoutine && <AddRoutine onClose={() => setShowAddRoutine(false)} onAdd={(routine) => { setModel((current) => ({ ...current, routines: [...current.routines, routine] })); addActivity(`${routine.name} created`, scheduleLabel(routine), 'success'); setShowAddRoutine(false); notify('New routine created'); }} />}
      {toast && <div className="dashboard-toast"><Icon name="check" size={17} />{toast}</div>}
    </div>
  );
}

function Overview({ routines, connections, activity, onOpenRoutines, onOpenConnections }: { routines: Routine[]; connections: Connection[]; activity: ActivityEntry[]; onOpenRoutines: () => void; onOpenConnections: () => void }) {
  const next = routines[0];
  return <div className="dashboard-content overview-grid">
    <section className="companion-card"><div className="companion-copy"><span className="live-chip"><span />NEARBY</span><h2>Your desk is quietly covered.</h2><p>Deskemon can see your active routines and connected context. Consequential actions still wait for you.</p><div className="companion-facts"><div><strong>{routines.length}</strong><span>active routines</span></div><div><strong>{connections.length}</strong><span>connections</span></div><div><strong>0</strong><span>pending approvals</span></div></div></div><div className="companion-face"><DeskemonFace /></div></section>
    <Panel title="Next up" action={<button className="text-button" onClick={onOpenRoutines}>All routines <Icon name="chevron" size={15} /></button>} className="next-panel">{next ? <div className="next-routine"><span className="icon-tile"><Icon name={next.icon} /></span><div><strong>{next.name}</strong><p>{scheduleLabel(next)}</p></div><time>in 32 min</time></div> : <p className="empty-copy">No active routines.</p>}<div className="quiet-window"><Icon name="shield" size={18} /><div><strong>Quiet window protected</strong><span>No low-priority interruptions during your portfolio review.</span></div></div></Panel>
    <Panel title="Connected context" action={<button className="text-button" onClick={onOpenConnections}>Manage <Icon name="chevron" size={15} /></button>}><div className="connection-strip">{connections.map((connection) => <div className="mini-connection" key={connection.id}><span><Icon name={connection.icon} /></span><div><strong>{connection.name}</strong><small>{connection.policy === 'automatic' ? 'Automatic' : connection.policy === 'confirm' ? 'Asks first' : 'Suggestions only'}</small></div><i /></div>)}</div></Panel>
    <Panel title="Recent activity" action={<span className="panel-meta">Stored on this device</span>} className="activity-panel"><ActivityList entries={activity} /></Panel>
  </div>;
}

function Routines({ routines, onSelect, onToggle, onAdd }: { routines: Routine[]; onSelect: (id: string) => void; onToggle: (routine: Routine) => void; onAdd: () => void }) {
  return <div className="dashboard-content"><div className="section-tools"><div className="segmented"><button className="active">All</button><button>Wellbeing</button><button>Work</button></div><button className="primary-action" onClick={onAdd}><Icon name="plus" size={18} />New routine</button></div><div className="routine-grid">{routines.map((routine) => <article className={`routine-card ${routine.enabled ? '' : 'disabled'}`} key={routine.id}><div className="routine-card-top"><span className="icon-tile large"><Icon name={routine.icon} size={23} /></span><Toggle checked={routine.enabled} onChange={() => onToggle(routine)} label={`${routine.enabled ? 'Pause' : 'Enable'} ${routine.name}`} /></div><button className="routine-body" onClick={() => onSelect(routine.id)}><h2>{routine.name}</h2><p>{routine.description}</p><div className="routine-meta"><span>{scheduleLabel(routine)}</span><span>{routine.contextAware ? 'Context aware' : 'Fixed schedule'}</span></div><footer><span className={`priority-tag ${routine.interruption}`}>{routine.interruption}</span><span className="configure">Configure <Icon name="chevron" size={15} /></span></footer></button></article>)}</div></div>;
}

function Connections({ connections, connectingId, onSelect, onConnect }: { connections: Connection[]; connectingId: string | null; onSelect: (id: string) => void; onConnect: (connection: Connection) => void }) {
  return <div className="dashboard-content"><div className="connections-intro"><Icon name="shield" size={21} /><p><strong>You choose every capability.</strong> Connecting an app never gives Deskemon permission to act without the policy shown here.</p></div><div className="connections-grid">{connections.map((connection) => <article className={`connection-card ${connection.connected ? 'connected' : ''}`} key={connection.id}><div className="connection-card-head"><span className="connection-logo"><Icon name={connection.icon} size={25} /></span>{connection.connected && <span className="connected-chip"><Icon name="check" size={13} />Connected</span>}</div><h2>{connection.name}</h2><p>{connection.description}</p><div className="connection-status"><span>Action policy</span><strong>{connection.policy === 'confirm' ? 'Ask before acting' : connection.policy === 'automatic' ? 'Automatic for allowed actions' : 'Suggestions only'}</strong></div><div className="connection-actions"><button className={connection.connected ? 'secondary-action' : 'primary-action'} onClick={() => onConnect(connection)} disabled={connectingId === connection.id}>{connectingId === connection.id ? 'Connecting…' : connection.connected ? 'Disconnect' : 'Connect'}</button><button className="icon-action" onClick={() => onSelect(connection.id)} aria-label={`Configure ${connection.name}`}><Icon name="chevron" size={18} /></button></div></article>)}</div><p className="prototype-note">Connections are simulated in this frontend build. Permission choices are stored locally and ready to map to backend OAuth and adapter states.</p></div>;
}

function Privacy({ settings, onChange, onReset }: { settings: PrivacySettings; onChange: (patch: Partial<PrivacySettings>, label: string) => void; onReset: () => void }) {
  const rows: { key: keyof Pick<PrivacySettings, 'ambientListening' | 'saveRawAudio' | 'confirmMemories' | 'activityLog'>; title: string; detail: string; locked?: boolean }[] = [
    { key: 'ambientListening', title: 'Ambient listening', detail: 'Use nearby sound to notice when speech begins. The face always shows when audio is processed.' },
    { key: 'saveRawAudio', title: 'Save raw audio', detail: 'Off by default. Deskemon can extract useful meaning without keeping recordings.' },
    { key: 'confirmMemories', title: 'Confirm before remembering', detail: 'Ask before a commitment or personal detail enters long-term memory.', locked: true },
    { key: 'activityLog', title: 'Keep an activity log', detail: 'Record configuration changes and agent actions on this device.' },
  ];
  return <div className="dashboard-content privacy-grid"><Panel title="Sensing & memory" className="settings-panel">{rows.map((row) => <div className="setting-row" key={row.key}><div><strong>{row.title}{row.locked && <span className="recommended">RECOMMENDED</span>}</strong><p>{row.detail}</p></div><Toggle checked={settings[row.key]} onChange={() => onChange({ [row.key]: !settings[row.key] }, `${row.title} ${settings[row.key] ? 'disabled' : 'enabled'}`)} label={row.title} /></div>)}<div className="setting-row select-row"><div><strong>Temporary context retention</strong><p>How long processed context may remain available before automatic deletion.</p></div><select value={settings.retention} onChange={(event) => onChange({ retention: event.target.value as PrivacySettings['retention'] }, 'Context retention updated')}><option value="session">This session</option><option value="24-hours">24 hours</option><option value="7-days">7 days</option></select></div></Panel><Panel title="Autonomy boundaries" className="autonomy-panel"><div className="boundary-visual"><span><Icon name="shield" size={28} /></span><div><strong>Deskemon asks before consequences.</strong><p>Purchases, sent messages, calendar edits, and durable memories always require a clear confirmation.</p></div></div><div className="boundary-list"><div><Icon name="check" size={17} /><span>May observe allowed context</span></div><div><Icon name="check" size={17} /><span>May prepare drafts and suggestions</span></div><div><Icon name="check" size={17} /><span>May update Slack presence when allowed</span></div><div className="blocked"><Icon name="close" size={17} /><span>Cannot purchase, send, or publish alone</span></div></div></Panel><Panel title="Trust signals" className="trust-panel"><div className="trust-grid"><div><span className="trust-icon listening"><span /></span><strong>Visible listening</strong><p>The companion's face and status always reveal active audio processing.</p></div><div><span className="trust-icon"><Icon name="activity" size={22} /></span><strong>Reviewable history</strong><p>Every configuration change and autonomous action is inspectable.</p></div></div></Panel><button className="reset-button" onClick={onReset}>Restore prototype defaults</button></div>;
}

function Drawer({ title, eyebrow, onClose, children }: { title: string; eyebrow: string; onClose: () => void; children: ReactNode }) {
  return <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><aside className="dash-drawer" role="dialog" aria-modal="true" aria-label={title}><header><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div><button className="close-button" onClick={onClose} aria-label="Close"><Icon name="close" /></button></header>{children}</aside></div>;
}

function RoutineEditor({ routine, onClose, onChange, onSave }: { routine: Routine; onClose: () => void; onChange: (patch: Partial<Routine>) => void; onSave: () => void }) {
  return <Drawer title={routine.name} eyebrow="ROUTINE SETTINGS" onClose={onClose}><div className="drawer-content"><div className="drawer-hero"><span className="icon-tile large"><Icon name={routine.icon} size={24} /></span><div><p>{routine.description}</p><label className="inline-toggle"><Toggle checked={routine.enabled} onChange={() => onChange({ enabled: !routine.enabled })} label="Routine enabled" />{routine.enabled ? 'Active' : 'Paused'}</label></div></div><fieldset><legend>Schedule</legend><div className="form-grid"><label><span>Repeat every</span><input type="number" min="1" max="999" value={routine.every} onChange={(event) => onChange({ every: Number(event.target.value) })} /></label><label><span>Unit</span><select value={routine.unit} onChange={(event) => onChange({ unit: event.target.value as Routine['unit'] })}><option value="minutes">Minutes</option><option value="hours">Hours</option><option value="daily">Daily</option></select></label><label><span>Active from</span><input type="time" value={routine.activeStart} onChange={(event) => onChange({ activeStart: event.target.value })} /></label><label><span>Active until</span><input type="time" value={routine.activeEnd} onChange={(event) => onChange({ activeEnd: event.target.value })} /></label></div></fieldset><fieldset><legend>Interruption</legend><div className="choice-group">{(['quiet', 'gentle', 'important'] as const).map((level) => <button key={level} className={routine.interruption === level ? 'selected' : ''} onClick={() => onChange({ interruption: level })}><strong>{level[0].toUpperCase() + level.slice(1)}</strong><small>{level === 'quiet' ? 'Fades if ignored' : level === 'gentle' ? 'Waits for a natural gap' : 'Requires acknowledgement'}</small></button>)}</div></fieldset><div className="setting-row compact"><div><strong>Use calendar and work context</strong><p>Delay the reminder during calls, presentations, or deep focus.</p></div><Toggle checked={routine.contextAware} onChange={() => onChange({ contextAware: !routine.contextAware })} label="Use context" /></div><button className="save-button" onClick={onSave}>Save routine</button></div></Drawer>;
}

function ConnectionEditor({ connection, onClose, onChange, onConnect }: { connection: Connection; onClose: () => void; onChange: (patch: Partial<Connection>) => void; onConnect: () => void }) {
  const automaticAllowed = connection.id === 'slack';
  const togglePermission = (permission: string) => onChange({ enabledPermissions: connection.enabledPermissions.includes(permission) ? connection.enabledPermissions.filter((item) => item !== permission) : [...connection.enabledPermissions, permission] });
  return <Drawer title={connection.name} eyebrow="CONNECTION SETTINGS" onClose={onClose}><div className="drawer-content"><div className="connection-detail-head"><span className="connection-logo large"><Icon name={connection.icon} size={29} /></span><div><strong>{connection.connected ? 'Connected' : 'Not connected'}</strong><p>{connection.statusDetail}</p></div></div><fieldset><legend>Allowed capabilities</legend><div className="permission-list">{connection.permissions.map((permission) => <label key={permission}><input type="checkbox" checked={connection.enabledPermissions.includes(permission)} onChange={() => togglePermission(permission)} /><span><Icon name="check" size={15} />{permission}</span></label>)}</div></fieldset><fieldset><legend>Default action policy</legend><div className="policy-list"><label><input type="radio" name="policy" checked={connection.policy === 'suggest'} onChange={() => onChange({ policy: 'suggest' })} /><span><strong>Suggestions only</strong><small>Deskemon explains what it could do.</small></span></label><label><input type="radio" name="policy" checked={connection.policy === 'confirm'} onChange={() => onChange({ policy: 'confirm' })} /><span><strong>Ask before acting</strong><small>Prepare the action, then wait for approval.</small></span></label>{automaticAllowed && <label><input type="radio" name="policy" checked={connection.policy === 'automatic'} onChange={() => onChange({ policy: 'automatic' })} /><span><strong>Automatic presence only</strong><small>Limited to the permitted reversible action.</small></span></label>}</div></fieldset><div className="consequence-note"><Icon name="shield" size={19} /><span>Sending, purchasing, publishing, and calendar edits always require confirmation regardless of this setting.</span></div><button className={connection.connected ? 'disconnect-button' : 'save-button'} onClick={onConnect}>{connection.connected ? 'Disconnect' : `Connect ${connection.name}`}</button></div></Drawer>;
}

function AddRoutine({ onClose, onAdd }: { onClose: () => void; onAdd: (routine: Routine) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [every, setEvery] = useState(60);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    onAdd({ id: `custom-${Date.now()}`, name: name.trim(), description: description.trim() || 'A custom reminder from Deskemon.', icon: 'custom', enabled: true, every, unit: 'minutes', activeStart: '09:00', activeEnd: '18:00', quietStart: '22:00', quietEnd: '08:00', interruption: 'gentle', contextAware: true });
  };
  return <Drawer title="New routine" eyebrow="CUSTOM REMINDER" onClose={onClose}><form className="drawer-content" onSubmit={submit}><div className="form-stack"><label><span>Name</span><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Take a screen break" /></label><label><span>What should Deskemon remember?</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="A gentle reminder to look away from the screen." rows={3} /></label><label><span>Repeat every</span><div className="input-with-unit"><input type="number" min="1" value={every} onChange={(event) => setEvery(Number(event.target.value))} /><span>minutes</span></div></label></div><div className="consequence-note"><Icon name="shield" size={19} /><span>Context awareness is on, so Deskemon waits for a considerate moment.</span></div><button className="save-button" type="submit" disabled={!name.trim()}>Create routine</button></form></Drawer>;
}
