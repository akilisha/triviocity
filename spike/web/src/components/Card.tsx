import type { ComponentChildren } from 'preact';
import styles from './Card.module.css';

interface Props {
  title?: string;
  children: ComponentChildren;
}

export function Card({ title, children }: Props) {
  return (
    <section class={styles.card}>
      {title && <h2 class={styles.title}>{title}</h2>}
      {children}
    </section>
  );
}
