export type DashboardSection = 'overview' | 'routines' | 'connections' | 'privacy';

export type RoutineIcon =
  | 'stand'
  | 'water'
  | 'food'
  | 'medicine'
  | 'focus'
  | 'custom';

export type InterruptionLevel = 'quiet' | 'gentle' | 'important';

export interface Routine {
  id: string;
  name: string;
  description: string;
  icon: RoutineIcon;
  enabled: boolean;
  every: number;
  unit: 'minutes' | 'hours' | 'daily';
  activeStart: string;
  activeEnd: string;
  quietStart: string;
  quietEnd: string;
  interruption: InterruptionLevel;
  contextAware: boolean;
}

export type ConnectionIcon =
  | 'calendar'
  | 'mail'
  | 'slack'
  | 'codex'
  | 'food'
  | 'meeting';

export type ActionPolicy = 'suggest' | 'confirm' | 'automatic';

export interface Connection {
  id: string;
  name: string;
  description: string;
  icon: ConnectionIcon;
  connected: boolean;
  permissions: string[];
  enabledPermissions: string[];
  policy: ActionPolicy;
  statusDetail: string;
}

export interface PrivacySettings {
  ambientListening: boolean;
  saveRawAudio: boolean;
  confirmMemories: boolean;
  activityLog: boolean;
  retention: 'session' | '24-hours' | '7-days';
}

export interface ActivityEntry {
  id: string;
  text: string;
  detail: string;
  timestamp: string;
  tone: 'neutral' | 'success' | 'attention';
}

export interface DashboardState {
  routines: Routine[];
  connections: Connection[];
  privacy: PrivacySettings;
  activity: ActivityEntry[];
}
