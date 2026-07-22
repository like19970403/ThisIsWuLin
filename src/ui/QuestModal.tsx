import type { Character } from '../core/index.js';
import { QUESTS, isQuestComplete, questProgress } from '../core/index.js';
import { useGameStore } from '../store/gameStore.js';

export function QuestModal({ character, onClose }: { character: Character; onClose: () => void }) {
  const accept = useGameStore((s) => s.accept);
  const claim = useGameStore((s) => s.claim);

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-lg border border-stone-700 bg-stone-950 p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-lg font-bold text-amber-200">江湖任務</h3>

        <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
          {QUESTS.map((quest) => {
            const st = character.quests[quest.id];
            const accepted = st?.accepted ?? false;
            const claimed = st?.claimed ?? false;
            const done = isQuestComplete(character, quest);
            const { current, target } = questProgress(character, quest);

            return (
              <div key={quest.id} className={`rounded border p-3 ${claimed ? 'border-stone-800 bg-stone-900/20 opacity-60' : 'border-stone-700 bg-stone-900/40'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-100">
                    {quest.name}
                    {claimed && <span className="ml-1 text-xs text-stone-500">已完成</span>}
                  </span>
                  {!accepted ? (
                    <button onClick={() => accept(quest.id)} className="btn-secondary px-3 py-1 text-xs">
                      接受
                    </button>
                  ) : !claimed ? (
                    <button
                      disabled={!done}
                      onClick={() => claim(quest.id)}
                      className="btn-primary px-3 py-1 text-xs disabled:opacity-100"
                    >
                      {done ? '領獎' : '進行中'}
                    </button>
                  ) : null}
                </div>
                <div className="mt-1 text-xs text-stone-400">{quest.description}</div>
                {accepted && !claimed && (
                  <div className="mt-1.5">
                    <div className="h-1.5 overflow-hidden rounded bg-stone-800">
                      <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, (current / target) * 100)}%` }} />
                    </div>
                    <div className="mt-0.5 text-right text-xs text-stone-500">{current}/{target}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button onClick={onClose} className="mt-4 w-full rounded bg-stone-800 py-2 text-sm text-stone-300 hover:bg-stone-700">
          離開
        </button>
      </div>
    </div>
  );
}
