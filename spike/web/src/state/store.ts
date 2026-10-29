import { computed, signal } from '@preact/signals';
import type { ConnectionStatus, Mode, Player } from './types';

function readMode(): Mode {
  const mode = new URLSearchParams(location.search).get('mode');
  return mode === 'tv' || mode === 'diag' ? mode : 'player';
}

/** The single client store. The transport writes it; views read it. */
export const mode = signal<Mode>(readMode());
export const connection = signal<ConnectionStatus>('connecting');
export const needsJoin = signal(false);
export const joining = signal(false);
export const myId = signal<number | null>(null);
export const players = signal<Player[]>([]);
export const totalTaps = signal(0);
export const viewers = signal(0);
export const counter = signal(0);
export const errorMessage = signal<string | null>(null);

/** Spike measurements, shown on screen so testers can read them off a phone. */
export const rttMs = signal<number | null>(null);
export const reconnects = signal(0);
export const lastReconnectMs = signal<number | null>(null);
export const joinMs = signal<number | null>(null);
export const maxTickGapMs = signal(0);

export const me = computed(() => players.value.find((p) => p.id === myId.value) ?? null);
export const playersOnline = computed(() => players.value.filter((p) => p.online).length);
