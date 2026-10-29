import type { Player } from '../state/types';
import styles from './ScoreList.module.css';

interface Props {
  players: Player[];
  highlightId?: number | null;
}

export function ScoreList({ players, highlightId }: Props) {
  if (players.length === 0) return <p class={styles.empty}>No players yet</p>;
  const ranked = [...players].sort((a, b) => b.taps - a.taps || a.id - b.id);
  return (
    <ol class={styles.list}>
      {ranked.map((p) => (
        <li key={p.id} class={`${styles.row} ${p.id === highlightId ? styles.mine : ''} ${p.online ? '' : styles.offline}`}>
          <span class={styles.emoji} aria-hidden="true">{p.emoji}</span>
          <span class={styles.name}>{p.name}</span>
          <span class={styles.score}>{p.taps}</span>
        </li>
      ))}
    </ol>
  );
}
