import type { LogEntry } from '../store/gameStore.js';

export function NarrativeLog({ log }: { log: LogEntry[] }) {
  return (
    <div className="rounded-lg border border-stone-800 bg-stone-950/40 p-5">
      <h3 className="mb-3 text-sm font-semibold tracking-wide text-stone-400">江湖見聞</h3>
      <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-1">
        {log.length === 0 && <p className="text-sm text-stone-500">尚無事發生……</p>}
        {log.map((entry, i) => (
          <div
            key={entry.id}
            className={`rounded border-l-2 py-1 pl-3 text-sm leading-relaxed ${
              i === 0 ? 'border-amber-500 text-stone-200' : 'border-stone-700 text-stone-400'
            }`}
          >
            {entry.text}
          </div>
        ))}
      </div>
    </div>
  );
}
