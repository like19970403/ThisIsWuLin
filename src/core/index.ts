// 核心模組公開介面 — Phase 1 的 React/Zustand 層只從這裡 import，
// 不直接碰內部檔案結構。

export * from './types.js';
export * from './rng.js';
export * from './rules.js';
export * from './turn.js';
export * from './progression.js';
export * from './loadout.js';
export { SKILLS, getSkill, MAX_EQUIPPED_SKILLS } from './data/skills.js';
export { EQUIPMENT, getEquipItem } from './data/equipment.js';
export { SECTS, getSect } from './data/sects.js';
export { ENEMIES, getEnemy } from './data/enemies.js';
export { EVENTS } from './data/events.js';
export { TemplateNarrator } from './narrator/template.js';
export { MockNarrator } from './narrator/mock.js';
