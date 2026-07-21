import type { Character } from '../core/index.js';
import { getSect } from '../core/index.js';

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="mb-2">
      <div className="mb-1 flex justify-between text-xs text-stone-400">
        <span>{label}</span>
        <span>
          {value} / {max}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded bg-stone-800">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded bg-stone-900/50 px-3 py-2 text-center">
      <div className="text-xs text-stone-400">{label}</div>
      <div className="text-lg font-semibold text-amber-100">{value}</div>
    </div>
  );
}

export function StatPanel({ character }: { character: Character }) {
  const sect = getSect(character.sectId);
  return (
    <div className="rounded-lg border border-stone-800 bg-stone-950/40 p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-2xl font-bold text-amber-200">{character.name}</h2>
        <span className="text-sm text-stone-400">{sect?.name ?? '無門無派'}</span>
      </div>

      <Bar label="氣血" value={character.hp} max={character.maxHp} color="bg-rose-600" />
      <Bar label="體力" value={character.stamina} max={character.maxStamina} color="bg-emerald-600" />

      <div className="mt-4 grid grid-cols-4 gap-2">
        <Stat label="根骨" value={character.attrs.gen} />
        <Stat label="悟性" value={character.attrs.wu} />
        <Stat label="身法" value={character.attrs.shen} />
        <Stat label="內力" value={character.attrs.nei} />
      </div>

      <div className="mt-4 flex justify-between text-sm">
        <span className="text-stone-300">
          銀兩 <span className="font-semibold text-amber-200">{character.silver}</span>
        </span>
        <span className="text-stone-300">
          聲望 <span className="font-semibold text-amber-200">{character.fame}</span>
        </span>
      </div>
    </div>
  );
}
