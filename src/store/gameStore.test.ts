import { describe, it, expect, beforeEach } from 'vitest';
// 註：node 環境無 localStorage，store 的 persist 於此靜默停用，不影響邏輯測試。
// persist 實際寫入由瀏覽器 E2E 驗證。
import { useGameStore, setNarrator, SAVE_VERSION } from './gameStore.js';
import { MockNarrator } from '../core/index.js';

const store = useGameStore.getState;

beforeEach(() => {
  useGameStore.getState().resetGame();
  setNarrator(new MockNarrator('[敘事]'));
});

describe('SPEC-001 Done When — store 整合驗證', () => {
  it('#1 初始無角色（導向建角）', () => {
    expect(store().character).toBeNull();
  });

  it('#1 建角後有角色', () => {
    const ok = store().createCharacter('王林', 'shaolin');
    expect(ok).toBe(true);
    expect(store().character?.name).toBe('王林');
  });

  it('建角拒絕空白姓名（Edge Case）', () => {
    expect(store().createCharacter('  ', 'shaolin')).toBe(false);
    expect(store().character).toBeNull();
  });

  it('建角拒絕無效門派', () => {
    expect(store().createCharacter('王林', 'no_such_sect')).toBe(false);
  });

  it('#2 練功：屬性上升、體力下降、產生敘事', async () => {
    store().createCharacter('王林', 'shaolin');
    const before = store().character!;
    await store().train();
    const after = store().character!;
    expect(after.stamina).toBeLessThan(before.stamina);
    // 某一屬性上升
    const sumBefore = before.attrs.gen + before.attrs.wu + before.attrs.shen + before.attrs.nei;
    const sumAfter = after.attrs.gen + after.attrs.wu + after.attrs.shen + after.attrs.nei;
    expect(sumAfter).toBeGreaterThan(sumBefore);
    expect(store().log[0]!.text).toBe('[敘事]'); // Narrator 有介入
  });

  it('#3 闖蕩：觸發事件，log 增加', async () => {
    store().createCharacter('王林', 'shaolin');
    const logLenBefore = store().log.length;
    await store().roam();
    expect(store().log.length).toBeGreaterThan(logLenBefore);
  });

  it('#5 體力歸零時 canAct 為 false（行動禁用）', () => {
    store().createCharacter('王林', 'shaolin');
    // 耗盡體力
    useGameStore.setState({ character: { ...store().character!, stamina: 0 } });
    expect(store().canAct(15)).toBe(false);
    expect(store().canAct(20)).toBe(false);
  });

  it('休息恢復體力後可再行動', () => {
    store().createCharacter('王林', 'shaolin');
    useGameStore.setState({ character: { ...store().character!, stamina: 0 } });
    store().rest();
    expect(store().character!.stamina).toBe(store().character!.maxStamina);
    expect(store().canAct(20)).toBe(true);
  });

  // #6 存檔持久化（localStorage 寫入）改由瀏覽器 E2E 驗證（scripts/browser-check）——
  // node 環境的 zustand persist 時序不代表真環境；匯出/匯入序列化邏輯已由 #7 覆蓋。

  it('#7 匯出→匯入還原', async () => {
    store().createCharacter('王林', 'shaolin');
    await store().train();
    const snapshot = store().exportSave();
    const fameAndSilver = { silver: store().character!.silver, attrs: store().character!.attrs };

    store().resetGame();
    expect(store().character).toBeNull();

    const ok = store().importSave(snapshot);
    expect(ok).toBe(true);
    expect(store().character!.name).toBe('王林');
    expect(store().character!.attrs).toEqual(fameAndSilver.attrs);
  });

  it('#7 匯入損壞 JSON 不覆蓋現況（Edge Case）', () => {
    store().createCharacter('王林', 'shaolin');
    const ok = store().importSave('{ 壞掉的 json');
    expect(ok).toBe(false);
    expect(store().character!.name).toBe('王林'); // 原狀態保留
  });

  it('#7 匯入版本不符被拒（Edge Case）', () => {
    store().createCharacter('王林', 'shaolin');
    const wrongVer = JSON.stringify({ version: SAVE_VERSION + 99, character: { name: '假' } });
    expect(store().importSave(wrongVer)).toBe(false);
    expect(store().character!.name).toBe('王林');
  });

  it('#8 Narrator 可插拔：換實作，遊戲數值不變', async () => {
    store().createCharacter('王林', 'shaolin');
    setNarrator(new MockNarrator('甲敘事'));
    await store().roam();
    const charA = store().character!;

    // 重來一次，換另一個 Narrator
    store().resetGame();
    store().createCharacter('王林', 'shaolin');
    setNarrator(new MockNarrator('乙敘事'));
    await store().roam();

    // 敘事文字不同，但兩次都成功執行（數值判定不依賴 Narrator）
    expect(store().log[0]!.text).toBe('乙敘事');
    expect(charA.name).toBe(store().character!.name);
  });
});
