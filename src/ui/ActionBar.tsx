import { useGameStore } from '../store/gameStore.js';
import { TRAIN_STAMINA_COST, ROAM_STAMINA_COST } from '../core/index.js';

function ActionButton({
  label,
  hint,
  disabled,
  onClick,
}: {
  label: string;
  hint: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="flex flex-1 flex-col items-center rounded border border-stone-700 bg-stone-900/60 py-3 transition hover:border-amber-500 hover:bg-stone-800 disabled:cursor-not-allowed disabled:border-stone-800 disabled:bg-stone-900/30 disabled:text-stone-600"
    >
      <span className="text-base font-semibold">{label}</span>
      <span className="text-xs text-stone-500">{hint}</span>
    </button>
  );
}

export function ActionBar() {
  const busy = useGameStore((s) => s.busy);
  const canAct = useGameStore((s) => s.canAct);
  const train = useGameStore((s) => s.train);
  const roam = useGameStore((s) => s.roam);
  const rest = useGameStore((s) => s.rest);

  return (
    <div className="flex gap-3">
      <ActionButton
        label="練功"
        hint={`體力 -${TRAIN_STAMINA_COST}`}
        disabled={busy || !canAct(TRAIN_STAMINA_COST)}
        onClick={train}
      />
      <ActionButton
        label="闖蕩"
        hint={`體力 -${ROAM_STAMINA_COST}`}
        disabled={busy || !canAct(ROAM_STAMINA_COST)}
        onClick={roam}
      />
      <ActionButton label="休息" hint="回復體力" disabled={busy} onClick={rest} />
    </div>
  );
}
