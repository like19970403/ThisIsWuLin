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
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-2 text-center text-4xl font-bold tracking-widest text-amber-200">
        這就是江湖
      </h1>
      <p className="mb-10 text-center text-sm text-stone-400">初入江湖，先報上名號、擇一門派。</p>

      <label className="mb-2 block text-sm text-stone-300">姓名</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="例：王林"
        maxLength={12}
        className="mb-8 w-full rounded border border-stone-700 bg-stone-900/60 px-4 py-2 text-stone-100 outline-none focus:border-amber-500"
      />

      <p className="mb-3 text-sm text-stone-300">選擇門派</p>
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {SECTS.map((sect) => {
          const active = sect.id === sectId;
          return (
            <button
              key={sect.id}
              onClick={() => setSectId(sect.id)}
              className={`rounded border p-4 text-left transition ${
                active
                  ? 'border-amber-500 bg-amber-950/40 ring-1 ring-amber-500'
                  : 'border-stone-700 bg-stone-900/40 hover:border-stone-500'
              }`}
            >
              <div className="mb-1 text-lg font-semibold text-amber-100">{sect.name}</div>
              <div className="text-xs leading-relaxed text-stone-400">{sect.description}</div>
              <div className="mt-2 text-xs text-emerald-400/80">
                {Object.entries(sect.attrBonus)
                  .map(([k, v]) => `${attrName(k)}+${v}`)
                  .join('　')}
              </div>
            </button>
          );
        })}
      </div>

      {notice && <p className="mb-4 text-center text-sm text-rose-400">{notice}</p>}

      <button
        disabled={!canCreate}
        onClick={() => create(name, sectId)}
        className="w-full rounded bg-amber-700 py-3 text-lg font-semibold text-amber-50 transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-stone-800 disabled:text-stone-500"
      >
        踏入江湖
      </button>
    </div>
  );
}

function attrName(k: string): string {
  return { gen: '根骨', wu: '悟性', shen: '身法', nei: '內力' }[k] ?? k;
}
