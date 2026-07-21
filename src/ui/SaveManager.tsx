import { useState } from 'react';
import { useGameStore } from '../store/gameStore.js';

export function SaveManager() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const exportSave = useGameStore((s) => s.exportSave);
  const importSave = useGameStore((s) => s.importSave);
  const resetGame = useGameStore((s) => s.resetGame);

  return (
    <div className="rounded-lg border border-stone-800 bg-stone-950/40 p-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-sm text-stone-400 hover:text-amber-300"
      >
        {open ? '▾' : '▸'} 存檔管理
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => setText(exportSave())}
              className="rounded bg-stone-800 px-3 py-1.5 text-sm text-stone-200 hover:bg-stone-700"
            >
              匯出存檔
            </button>
            <button
              onClick={() => {
                if (importSave(text)) setOpen(false);
              }}
              className="rounded bg-stone-800 px-3 py-1.5 text-sm text-stone-200 hover:bg-stone-700"
            >
              匯入存檔
            </button>
            <button
              onClick={() => {
                if (confirm('確定要重新開始？目前進度將清除。')) resetGame();
              }}
              className="ml-auto rounded bg-rose-950/60 px-3 py-1.5 text-sm text-rose-300 hover:bg-rose-900/60"
            >
              重新開始
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="匯出的存檔 JSON 會出現在這裡；貼上 JSON 後可匯入。"
            rows={5}
            className="w-full rounded border border-stone-700 bg-stone-900/60 p-2 font-mono text-xs text-stone-300 outline-none focus:border-amber-500"
          />
        </div>
      )}
    </div>
  );
}
