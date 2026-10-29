import styles from './KeyValueList.module.css';

export type Row = [label: string, value: string];

export function KeyValueList({ rows }: { rows: Row[] }) {
  return (
    <dl class={styles.list}>
      {rows.map(([label, value]) => (
        <div key={label} class={styles.row}>
          <dt class={styles.label}>{label}</dt>
          <dd class={styles.value}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
