import type { Character } from '../core/index.js';
import { getEquipItem } from '../core/index.js';
import { useGameStore } from '../store/gameStore.js';

export function ShopModal({ character }: { character: Character }) {
  const shopItems = useGameStore((s) => s.shopItems);
  const buy = useGameStore((s) => s.buy);
  const closeShop = useGameStore((s) => s.closeShop);

  if (!shopItems) return null;

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 p-4" onClick={closeShop}>
      <div
        className="w-full max-w-md rounded-lg border border-stone-700 bg-stone-950 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-baseline justify-between">
          <h3 className="text-lg font-bold text-amber-200">集鎮商鋪</h3>
          <span className="text-sm text-stone-400">
            銀兩 <span className="text-amber-200">{character.silver}</span>
          </span>
        </div>

        <div className="space-y-2">
          {shopItems.map((id) => {
            const item = getEquipItem(id);
            if (!item) return null;
            const affordable = character.silver >= item.price;
            return (
              <div key={id} className="flex items-center justify-between rounded border border-stone-700 bg-stone-900/40 p-2">
                <div>
                  <div className="text-sm font-semibold text-amber-100">{item.name}</div>
                  <div className="text-xs text-stone-400">{item.description}</div>
                </div>
                <button
                  disabled={!affordable}
                  onClick={() => buy(id)}
                  className="ml-3 shrink-0 rounded bg-amber-800 px-3 py-1 text-sm text-amber-50 disabled:bg-stone-800 disabled:text-stone-600"
                >
                  {item.price} 銀
                </button>
              </div>
            );
          })}
        </div>

        <button
          onClick={closeShop}
          className="mt-4 w-full rounded bg-stone-800 py-2 text-sm text-stone-300 hover:bg-stone-700"
        >
          離開
        </button>
      </div>
    </div>
  );
}
