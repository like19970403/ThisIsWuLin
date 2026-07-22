import type { Character } from '../core/index.js';
import type { LogEntry } from '../store/gameStore.js';
import { StatPanel } from './StatPanel.js';
import { ActionBar } from './ActionBar.js';
import { NarrativeLog } from './NarrativeLog.js';
import { SaveManager } from './SaveManager.js';
import { LoadoutPanel } from './LoadoutPanel.js';
import { ShopModal } from './ShopModal.js';
import { EncounterModal } from './EncounterModal.js';

export function GameScreen({ character, log }: { character: Character; log: LogEntry[] }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-6 text-center text-2xl font-bold tracking-[0.3em] text-transparent bg-linear-to-b from-amber-200 to-amber-500 bg-clip-text">
        這就是武林
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
      <EncounterModal character={character} />
    </div>
  );
}
