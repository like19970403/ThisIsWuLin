import { useState } from 'react';
import type { Character } from '../core/index.js';
import { SKILLS, getEquipItem, MAX_EQUIPPED_SKILLS } from '../core/index.js';
import { useGameStore } from '../store/gameStore.js';

export function LoadoutPanel({ character }: { character: Character }) {
  const [tab, setTab] = useState<'skill' | 'equip'>('skill');
  return (
    <div className="rounded-lg border border-stone-800 bg-stone-950/40 p-4">
      <div className="mb-3 flex gap-2 text-sm">
        <TabBtn active={tab === 'skill'} onClick={() => setTab('skill')}>
          功法（{character.equippedSkillIds.length}/{MAX_EQUIPPED_SKILLS}）
        </TabBtn>
        <TabBtn active={tab === 'equip'} onClick={() => setTab('equip')}>
          裝備
        </TabBtn>
      </div>
      {tab === 'skill' ? <SkillList character={character} /> : <EquipList character={character} />}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded px-3 py-1 ${active ? 'bg-amber-800 text-amber-50' : 'bg-stone-800 text-stone-400 hover:text-stone-200'}`}
    >
      {children}
    </button>
  );
}

function SkillList({ character }: { character: Character }) {
  const learn = useGameStore((s) => s.learn);
  const toggleSkill = useGameStore((s) => s.toggleSkill);

  return (
    <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
      {SKILLS.map((skill) => {
        const learned = character.learnedSkillIds.includes(skill.id);
        const equipped = character.equippedSkillIds.includes(skill.id);
        const canLearn = character.level >= skill.reqLevel && character.silver >= skill.cost;
        return (
          <div key={skill.id} className="rounded border border-stone-700 bg-stone-900/40 p-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-100">
                {skill.name}
                {equipped && <span className="ml-1 text-xs text-emerald-400">◆上陣</span>}
              </span>
              {!learned ? (
                <button
                  disabled={!canLearn}
                  onClick={() => learn(skill.id)}
                  className="rounded bg-amber-800 px-2 py-0.5 text-xs text-amber-50 disabled:bg-stone-800 disabled:text-stone-600"
                >
                  學（{skill.cost}銀 · {skill.reqLevel}級）
                </button>
              ) : (
                <button
                  onClick={() => toggleSkill(skill.id)}
                  className="rounded bg-stone-700 px-2 py-0.5 text-xs text-stone-100 hover:bg-stone-600"
                >
                  {equipped ? '卸下' : '裝備'}
                </button>
              )}
            </div>
            <div className="mt-1 text-xs text-stone-400">{skill.description}</div>
          </div>
        );
      })}
    </div>
  );
}

function EquipList({ character }: { character: Character }) {
  const equip = useGameStore((s) => s.equip);
  const unequip = useGameStore((s) => s.unequip);

  const weapon = character.equipment.weapon ? getEquipItem(character.equipment.weapon) : null;
  const armor = character.equipment.armor ? getEquipItem(character.equipment.armor) : null;

  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-2 gap-2">
        <SlotBox label="武器" item={weapon} onRemove={() => unequip('weapon')} />
        <SlotBox label="防具" item={armor} onRemove={() => unequip('armor')} />
      </div>
      <div>
        <div className="mb-1 text-xs text-stone-400">行囊（{character.inventory.length}）</div>
        {character.inventory.length === 0 ? (
          <p className="text-xs text-stone-500">空空如也。闖蕩或購物可得裝備。</p>
        ) : (
          <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
            {character.inventory.map((id, i) => {
              const item = getEquipItem(id);
              if (!item) return null;
              return (
                <div key={`${id}-${i}`} className="flex items-center justify-between rounded bg-stone-900/40 px-2 py-1">
                  <span className="text-stone-200">{item.name}</span>
                  <button
                    onClick={() => equip(id)}
                    className="rounded bg-stone-700 px-2 py-0.5 text-xs text-stone-100 hover:bg-stone-600"
                  >
                    穿戴
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SlotBox({
  label,
  item,
  onRemove,
}: {
  label: string;
  item: ReturnType<typeof getEquipItem> | null | undefined;
  onRemove: () => void;
}) {
  return (
    <div className="rounded border border-stone-700 bg-stone-900/40 p-2">
      <div className="text-xs text-stone-400">{label}</div>
      {item ? (
        <div className="flex items-center justify-between">
          <span className="text-amber-100">{item.name}</span>
          <button onClick={onRemove} className="text-xs text-stone-500 hover:text-rose-400">
            卸
          </button>
        </div>
      ) : (
        <span className="text-xs text-stone-600">未裝備</span>
      )}
    </div>
  );
}
