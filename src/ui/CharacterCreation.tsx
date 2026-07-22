import { useState } from 'react';
import { SECTS } from '../core/index.js';
import { useGameStore } from '../store/gameStore.js';

export function CharacterCreation() {
  const [name, setName] = useState('');
  const [sectId, setSectId] = useState<string>('');
  const create = useGameStore((s) => s.createCharacter);
  const notice = useGameStore((s) => s.notice);

  const canCreate = name.trim().length > 0 && sectId !== '';

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-10 text-center">
        <div className="mb-2 text-xs tracking-[0.5em] text-amber-700/80">— 俠 客 行 —</div>
        <h1 className="bg-linear-to-b from-amber-200 to-amber-500 bg-clip-text text-5xl font-bold tracking-[0.15em] text-transparent drop-shadow">
          這就是武林
        </h1>
        <p className="mt-3 text-sm text-stone-400">初入江湖，先報上名號、擇一門派。</p>
      </div>

      <div className="panel mb-6">
        <label className="mb-2 block text-sm font-medium text-amber-200/90">俠名</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例：王林"
          maxLength={12}
          className="w-full rounded-md border border-stone-600 bg-stone-950/60 px-4 py-2.5 text-stone-100 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
        />
      </div>

      <p className="mb-3 text-sm font-medium text-amber-200/90">選擇門派</p>
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SECTS.map((sect) => {
          const active = sect.id === sectId;
          return (
            <button
              key={sect.id}
              onClick={() => setSectId(sect.id)}
              className={`rounded-lg border p-4 text-left shadow-md transition-all ${
                active
                  ? 'border-amber-500 bg-linear-to-b from-amber-950/60 to-stone-900 shadow-amber-900/40 ring-2 ring-amber-500/60'
                  : 'border-stone-700 bg-stone-900/50 hover:-translate-y-0.5 hover:border-amber-600/60 hover:shadow-lg'
              }`}
            >
              <div className="mb-1 flex items-center gap-1.5 text-lg font-semibold text-amber-100">
                {sect.name}
                {active && <span className="text-xs text-amber-400">✓</span>}
              </div>
              <div className="text-xs leading-relaxed text-stone-400">{sect.description}</div>
              <div className="mt-2 flex flex-wrap gap-1">
                {Object.entries(sect.attrBonus).map(([k, v]) => (
                  <span key={k} className="rounded bg-emerald-950/60 px-1.5 py-0.5 text-xs text-emerald-300">
                    {attrName(k)}+{v}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {notice && (
        <p className="mb-4 rounded-md bg-rose-950/40 py-2 text-center text-sm text-rose-300">{notice}</p>
      )}

      <button disabled={!canCreate} onClick={() => create(name, sectId)} className="btn-primary w-full py-3.5 text-lg tracking-widest">
        踏入江湖
      </button>
      {!canCreate && (
        <p className="mt-2 text-center text-xs text-stone-500">
          {name.trim().length === 0 ? '請先輸入俠名' : '請選擇一個門派'}
        </p>
      )}
    </div>
  );
}

function attrName(k: string): string {
  return { gen: '根骨', wu: '悟性', shen: '身法', nei: '內力' }[k] ?? k;
}
