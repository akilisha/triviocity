import { NativeModule, requireNativeModule } from 'expo';

export interface LanAddress {
  name: string;
  ip: string;
  kind: 'wifi' | 'hotspot' | 'other';
}

export interface ServerStatus {
  running: boolean;
  httpPort: number;
  addresses: LanAddress[];
  players: number;
  playersOnline: number;
  viewers: number;
  unexpectedCloses: number;
  ticks: number;
  maxTickLateMs: number;
  logFile: string | null;
  error: string | null;
}

export interface HotspotInfo {
  ssid: string;
  passphrase: string | null;
  security: 'WPA' | 'SAE' | 'nopass';
}

declare class SpikeServerModule extends NativeModule<{}> {
  start(): void;
  stop(): void;
  getStatus(): ServerStatus;
  startHotspot(): Promise<HotspotInfo>;
  stopHotspot(): void;
}

export default requireNativeModule<SpikeServerModule>('SpikeServer');
