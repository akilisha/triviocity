import type { ComponentChildren } from 'preact';
import type { ConnectionStatus } from '../state/types';
import { StatusBadge } from './StatusBadge';
import styles from './Screen.module.css';

interface Props {
  title: string;
  status: ConnectionStatus;
  children: ComponentChildren;
}

export function Screen({ title, status, children }: Props) {
  return (
    <main class={styles.screen}>
      <header class={styles.header}>
        <h1 class={styles.title}>{title}</h1>
        <StatusBadge status={status} />
      </header>
      <div class={styles.body}>{children}</div>
    </main>
  );
}
