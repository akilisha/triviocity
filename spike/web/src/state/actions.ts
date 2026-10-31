import { errorMessage, joining, keepAwake } from './store';
import { markJoinSubmitted, send } from './transport';
import type { KeepAwakeMethod } from './types';

// What views may do. Views call these; they never touch the transport directly.

export function join(name: string, emoji: string): void {
  errorMessage.value = null;
  joining.value = true;
  markJoinSubmitted();
  send({ t: 'join', name, emoji });
}

export function tap(): void {
  send({ t: 'tap' });
}

export function reportKeepAwake(method: KeepAwakeMethod, detail?: string): void {
  keepAwake.value = method;
  send({ t: 'metric', kind: 'keepAwake', method, ...(detail ? { detail } : {}) });
}
