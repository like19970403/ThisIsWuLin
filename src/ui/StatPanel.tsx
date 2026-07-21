import type { Character } from '../core/index.js';
import { getSect, effectiveAttrs, expToNext, getTitle } from '../core/index.js';

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

function Stat({ label, base, eff }: { label: string; base: number; eff: number }) {
  const bonus = eff - base;
  return (
    <div className="rounded bg-stone-900/50 px-3 py-2 text-center">
      <div className="text-xs text-stone-400">{label}</div>
      <div className="text-lg font-semibold text-amber-100">
        {eff}
        {bonus > 0 && <span className="ml-0.5 text-xs text-emerald-400">+{bonus}</span>}
      </div>
    </div>
  );
}

export function StatPanel({ character }: { character: Character }) {
  const sect = getSect(character.sectId);
  const eff = effectiveAttrs(character);
  const expNeed = expToNext(character.level);
  return (
    <div className="rounded-lg border border-stone-800 bg-stone-950/40 p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-2xl font-bold text-amber-200">{character.name}</h2>
        <span className="text-sm text-stone-400">
          {sect?.name ?? '無門無派'} · <span className="text-amber-300">{character.level} 級</span>
        </span>
      </div>

      <Bar label="經驗" value={character.exp} max={expNeed} color="bg-amber-500" />
      <Bar label="氣血" value={character.hp} max={character.maxHp} color="bg-rose-600" />
      <Bar label="體力" value={character.stamina} max={character.maxStamina} color="bg-emerald-600" />

      <div className="mt-4 grid grid-cols-4 gap-2">
        <Stat label="根骨" base={character.attrs.gen} eff={eff.gen} />
        <Stat label="悟性" base={character.attrs.wu} eff={eff.wu} />
        <Stat label="身法" base={character.attrs.shen} eff={eff.shen} />
        <Stat label="內力" base={character.attrs.nei} eff={eff.nei} />
      </div>

      <div className="mt-4 flex justify-between text-sm">
        <span className="text-stone-300">
          銀兩 <span className="font-semibold text-amber-200">{character.silver}</span>
        </span>
        <span className="text-stone-300">
          聲望 <span className="font-semibold text-amber-200">{character.fame}</span>
        </span>
      </div>

      {character.titles.length > 0 && (
        <div className="mt-4 border-t border-stone-800 pt-3">
          <div className="mb-1 text-xs text-stone-400">稱號</div>
          <div className="flex flex-wrap gap-1.5">
            {character.titles.map((id) => (
              <span
                key={id}
                className="rounded bg-amber-950/60 px-2 py-0.5 text-xs text-amber-300"
                title={getTitle(id)?.description}
              >
                {getTitle(id)?.name ?? id}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
