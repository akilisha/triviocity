import { connection, mode, myId, needsJoin } from '../state/store';
import { ConnectingView } from './ConnectingView';
import { DiagView } from './DiagView';
import { GameView } from './GameView';
import { JoinView } from './JoinView';

export function App() {
  if (mode.value === 'diag') return <DiagView />;
  if (mode.value === 'player' && myId.value === null) {
    return needsJoin.value ? <JoinView /> : <ConnectingView />;
  }
  if (mode.value === 'tv' && connection.value === 'connecting') return <ConnectingView />;
  return <GameView />;
}
