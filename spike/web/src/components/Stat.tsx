import styles from './Stat.module.css';

interface Props {
  label: string;
  value: string | number;
  size?: 'normal' | 'display';
}

export function Stat({ label, value, size = 'normal' }: Props) {
  return (
    <div class={styles.stat}>
      <span class={`${styles.value} ${styles[size]}`}>{value}</span>
      <span class={styles.label}>{label}</span>
    </div>
  );
}
