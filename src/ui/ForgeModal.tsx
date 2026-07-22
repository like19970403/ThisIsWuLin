import type { Character } from '../core/index.js';
import { RECIPES, getEquipItem, getMaterial, rarityMeta } from '../core/index.js';
import { useGameStore } from '../store/gameStore.js';

export function ForgeModal({ character, onClose }: { character: Character; onClose: () => void }) {
  const craftItem = useGameStore((s) => s.craftItem);

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-lg border border-stone-700 bg-stone-950 p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-baseline justify-between">
          <h3 className="text-lg font-bold text-amber-200">鑄造坊</h3>
          <span className="text-sm text-stone-400">銀兩 <span className="text-amber-200">{character.silver}</span></span>
        </div>

        {/* 現有材料 */}
        <div className="mb-4">
          <div className="mb-1 text-xs text-stone-400">現有材料</div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(character.materials).filter(([, n]) => n > 0).length === 0 ? (
              <span className="text-xs text-stone-500">無（擊敗敵人有機率取得）</span>
            ) : (
              Object.entries(character.materials).map(([id, n]) => (
                <span key={id} className="rounded bg-stone-800 px-2 py-0.5 text-xs text-stone-200">
                  {getMaterial(id)?.name ?? id} ×{n}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="space-y-2">
          {RECIPES.map((recipe) => {
            const out = getEquipItem(recipe.output);
            const affordable = character.silver >= recipe.cost;
            const hasMats = Object.entries(recipe.materials).every(([mid, need]) => (character.materials[mid] ?? 0) >= need);
            const canCraft = affordable && hasMats;
            return (
              <div key={recipe.id} className="rounded border border-stone-700 bg-stone-900/40 p-3">
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${out ? rarityMeta(out.rarity).color : 'text-amber-100'}`}>
                    {out?.name ?? recipe.name}
                  </span>
                  <button
                    disabled={!canCraft}
                    onClick={() => craftItem(recipe.id)}
                    className="btn-primary px-3 py-1 text-sm disabled:opacity-100"
                  >
                    鑄造
                  </button>
                </div>
                <div className="mt-1 text-xs text-stone-400">
                  需 {recipe.cost} 銀 ·{' '}
                  {Object.entries(recipe.materials).map(([mid, need], i) => {
                    const have = character.materials[mid] ?? 0;
                    return (
                      <span key={mid} className={have >= need ? 'text-emerald-400' : 'text-rose-400'}>
                        {i > 0 && '、'}
                        {getMaterial(mid)?.name ?? mid} {have}/{need}
                      </span>
                    );
                  })}
                </div>
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
