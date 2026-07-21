import type { Character } from '../core/index.js';
import { canChoose } from '../core/index.js';
import { useGameStore } from '../store/gameStore.js';

export function EncounterModal({ character }: { character: Character }) {
  const node = useGameStore((s) => s.pendingEncounter);
  const choose = useGameStore((s) => s.chooseEncounter);

  if (!node) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-lg rounded-lg border border-amber-900/60 bg-stone-950 p-6">
        <h3 className="mb-3 text-lg font-bold text-amber-200">{node.title}</h3>
        <p className="mb-5 leading-relaxed text-stone-300">{node.text}</p>

        <div className="space-y-2">
          {node.options.map((opt, i) => {
            const ok = canChoose(character, opt);
            const req: string[] = [];
            if (opt.reqSilver) req.push(`${opt.reqSilver}銀`);
            if (opt.reqLevel) req.push(`${opt.reqLevel}級`);
            return (
              <button
                key={i}
                disabled={!ok}
                onClick={() => choose(i)}
                className="w-full rounded border border-stone-700 bg-stone-900/60 px-4 py-3 text-left text-sm text-stone-200 transition hover:border-amber-500 hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {opt.label}
                {req.length > 0 && <span className="ml-2 text-xs text-stone-500">（需 {req.join(' ')}）</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
