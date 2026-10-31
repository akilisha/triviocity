import { useEffect, useRef, useState } from 'preact/hooks';
import disc from '../assets/spinning-disc.mp4?inline';
import tiny from '../assets/keep-awake.mp4?inline';
import { reportKeepAwake } from '../state/actions';
import type { KeepAwakeVideo } from '../state/types';
import styles from './KeepAwake.module.css';

const CLIPS: Record<KeepAwakeVideo, string> = { disc, tiny };

type WakeLockSentinel = { release(): Promise<void> };
type WakeLockNavigator = Navigator & { wakeLock?: { request(type: 'screen'): Promise<WakeLockSentinel> } };

/**
 * Keeps the player's screen on while they are in a game (spec §3.4). Uses the Wake Lock API
 * where the browser allows it (HTTPS only), and falls back to a muted looping video, the
 * plain-HTTP workaround the spec names. Phase 0 measures whether either actually works:
 * `disc` is a visible spinning disc, `tiny` a near-invisible 2 px video.
 */
export function KeepAwake({ video: variant }: { video: KeepAwakeVideo }) {
  const nav = navigator as WakeLockNavigator;
  const [method, setMethod] = useState<'wakeLock' | 'video'>(
    window.isSecureContext && nav.wakeLock ? 'wakeLock' : 'video',
  );
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (method !== 'wakeLock') return;
    let sentinel: WakeLockSentinel | null = null;
    // The browser releases the lock whenever the page is hidden; take it again on return.
    const acquire = () => {
      if (document.visibilityState !== 'visible') return;
      nav.wakeLock!.request('screen').then(
        (s) => {
          sentinel = s;
          reportKeepAwake('wakeLock');
        },
        () => setMethod('video'),
      );
    };
    acquire();
    document.addEventListener('visibilitychange', acquire);
    return () => {
      document.removeEventListener('visibilitychange', acquire);
      sentinel?.release();
    };
  }, [method]);

  useEffect(() => {
    if (method !== 'video') return;
    const el = video.current!;
    el.muted = true; // Must be set before play() for autoplay to be allowed.
    const play = () => {
      el.play().then(
        () => reportKeepAwake('video', variant),
        (e: Error) => reportKeepAwake(e.name === 'NotAllowedError' ? 'blocked' : 'failed', `${e.name}: ${e.message}`),
      );
    };
    // Autoplay may be refused until the player touches the page; retry on every touch until it runs.
    const retry = () => {
      if (el.paused) play();
    };
    play();
    document.addEventListener('pointerdown', retry);
    document.addEventListener('visibilitychange', retry);
    return () => {
      document.removeEventListener('pointerdown', retry);
      document.removeEventListener('visibilitychange', retry);
      el.pause();
    };
  }, [method]);

  if (method !== 'video') return null;
  return <video ref={video} class={styles[variant]} src={CLIPS[variant]} muted playsInline loop aria-hidden="true" />;
}
