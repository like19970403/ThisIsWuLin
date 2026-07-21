import type { Character } from '../core/index.js';
import type { LogEntry } from '../store/gameStore.js';
import { StatPanel } from './StatPanel.js';
import { ActionBar } from './ActionBar.js';
import { NarrativeLog } from './NarrativeLog.js';
import { SaveManager } from './SaveManager.js';
import { LoadoutPanel } from './LoadoutPanel.js';
import { ShopModal } from './ShopModal.js';

export function GameScreen({ character, log }: { character: Character; log: LogEntry[] }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-center text-2xl font-bold tracking-widest text-amber-200">
        這就是江湖
      </h1>
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="space-y-5">
          <StatPanel character={character} />
          <ActionBar />
          <LoadoutPanel character={character} />
          <SaveManager />
        </div>
        <NarrativeLog log={log} />
      </div>
      <ShopModal character={character} />
    </div>
  );
}
