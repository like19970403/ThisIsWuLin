import { useGameStore } from '../store/gameStore.js';
import { TRAIN_STAMINA_COST, ROAM_STAMINA_COST } from '../core/index.js';

function ActionButton({
  icon,
  label,
  hint,
  disabled,
  onClick,
}: {
  icon: string;
  label: string;
  hint: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="group flex flex-1 flex-col items-center gap-0.5 rounded-lg border border-stone-600 bg-linear-to-b from-stone-700/80 to-stone-800 py-3.5 shadow-md shadow-black/30 transition-all hover:border-amber-500/70 hover:from-stone-600 hover:to-stone-700 hover:text-amber-100 hover:shadow-amber-900/30 active:translate-y-px disabled:cursor-not-allowed disabled:border-stone-700 disabled:from-stone-900 disabled:to-stone-900 disabled:text-stone-600 disabled:shadow-none"
    >
      <span className="text-xl leading-none opacity-80 transition group-hover:opacity-100">{icon}</span>
      <span className="text-base font-semibold tracking-wide">{label}</span>
      <span className="text-xs text-stone-400 group-disabled:text-stone-600">{hint}</span>
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
        icon="🧘"
        label="練功"
        hint={`體力 -${TRAIN_STAMINA_COST}`}
        disabled={busy || !canAct(TRAIN_STAMINA_COST)}
        onClick={train}
      />
      <ActionButton
        icon="🗺️"
        label="闖蕩"
        hint={`體力 -${ROAM_STAMINA_COST}`}
        disabled={busy || !canAct(ROAM_STAMINA_COST)}
        onClick={roam}
      />
      <ActionButton icon="🏮" label="休息" hint="回復體力" disabled={busy} onClick={rest} />
    </div>
  );
}
