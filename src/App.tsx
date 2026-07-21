import { useEffect } from 'react';
import { useGameStore } from './store/gameStore.js';
import { CharacterCreation } from './ui/CharacterCreation.js';
import { GameScreen } from './ui/GameScreen.js';

export default function App() {
  const character = useGameStore((s) => s.character);
  const log = useGameStore((s) => s.log);
  const notice = useGameStore((s) => s.notice);
  const clearNotice = useGameStore((s) => s.clearNotice);

  // 遊戲中的一次性提示（體力不足 / 匯入結果）自動淡出
  useEffect(() => {
    if (!character || !notice) return;
    const t = setTimeout(clearNotice, 2500);
    return () => clearTimeout(t);
  }, [character, notice, clearNotice]);

  return (
    <>
      {character ? <GameScreen character={character} log={log} /> : <CharacterCreation />}

      {character && notice && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded bg-stone-800 px-4 py-2 text-sm text-amber-200 shadow-lg">
          {notice}
        </div>
      )}
    </>
  );
}
