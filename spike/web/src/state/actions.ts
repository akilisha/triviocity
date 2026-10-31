import { errorMessage, joining } from './store';
import { markJoinSubmitted, send } from './transport';

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
