// Phase 2 垂直切片 E2E：驗證 UI 呈現 + 存檔遷移 + 學功法/購物互動。
import puppeteer from 'puppeteer-core';

const BASE = 'http://localhost:5173';
const results = [];
const check = (name, pass) => {
  results.push({ name, pass });
  console.log(`${pass ? '✓' : '✗'} ${name}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: '/snap/bin/chromium',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
});

try {
  const page = await browser.newPage();

  // ─── 存檔遷移：先塞一個 v1 存檔，再載入頁面 ───
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    // 模擬 Phase 1 的 v1 存檔（無 level/exp/功法/裝備欄位）
    const v1 = {
      state: {
        version: 1,
        character: {
          name: '老玩家', sectId: 'shaolin',
          attrs: { gen: 10, wu: 8, shen: 7, nei: 9 },
          stamina: 80, maxStamina: 100, hp: 50, maxHp: 70, silver: 500, fame: 40,
        },
        log: [],
      },
      version: 1,
    };
    localStorage.setItem('wulin-save-v1', JSON.stringify(v1));
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(400);

  // 遷移後：舊角色仍在、進度保留，且出現 Phase 2 UI（等級、功法）
  const migrated = await page.evaluate(() => document.body.innerText.includes('老玩家'));
  check('v1 存檔遷移：舊角色保留', migrated);
  const hasLevel = await page.evaluate(() => /\d+\s*級/.test(document.body.innerText));
  check('遷移後顯示等級（Phase 2 欄位補上）', hasLevel);
  const silverKept = await page.evaluate(() => document.body.innerText.includes('500'));
  check('遷移後銀兩進度保留', silverKept);

  // ─── Phase 2 UI 呈現 ───
  const hasSkillTab = await page.evaluate(() => document.body.innerText.includes('功法'));
  check('功法面板存在', hasSkillTab);
  const hasEquipTab = await page.evaluate(() =>
    [...document.querySelectorAll('button')].some((b) => b.textContent?.trim() === '裝備'),
  );
  check('裝備分頁存在', hasEquipTab);

  // ─── 學功法互動（老玩家有 500 銀、等級 1，可學長拳 30 銀）───
  const learnedBefore = await page.evaluate(() => document.body.innerText.includes('◆上陣'));
  // 點「學」長拳
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent?.includes('學（'));
    btn?.click();
  });
  await sleep(300);
  // 學完後該功法出現「裝備」按鈕
  const canEquipNow = await page.evaluate(() =>
    [...document.querySelectorAll('button')].some((b) => b.textContent?.trim() === '裝備' || b.textContent?.trim() === '卸下'),
  );
  check('可學習功法（學後出現裝備按鈕）', canEquipNow && !learnedBefore);

  // 裝備該功法
  await page.evaluate(() => {
    // 切到功法分頁後找「裝備」按鈕（非分頁的那個）
    const btns = [...document.querySelectorAll('button')];
    const equipBtn = btns.find((b) => b.textContent?.trim() === '裝備' && b.className.includes('bg-stone-700'));
    equipBtn?.click();
  });
  await sleep(300);
  const equipped = await page.evaluate(() => document.body.innerText.includes('◆上陣'));
  check('裝備功法後顯示上陣標記', equipped);

  // ─── 闖蕩觸發商店的可能性（多次闖蕩直到出現商店或體力耗盡）───
  let shopSeen = false;
  for (let i = 0; i < 15; i++) {
    const staminaLow = await page.evaluate(() => {
      const m = document.body.innerText.match(/體力\s*(\d+)/);
      return m ? Number(m[1]) < 15 : false;
    });
    if (staminaLow) {
      // 休息回體力
      await page.evaluate(() =>
        [...document.querySelectorAll('button')].find((b) => b.textContent?.includes('休息'))?.click(),
      );
      await sleep(200);
    }
    await page.evaluate(() =>
      [...document.querySelectorAll('button')].find((b) => b.textContent?.includes('闖蕩') && !b.disabled)?.click(),
    );
    await sleep(300);
    shopSeen = await page.evaluate(() => document.body.innerText.includes('集鎮商鋪'));
    if (shopSeen) break;
  }
  check('闖蕩可觸發商店（15回合內至少一次）', shopSeen);

  if (shopSeen) {
    // 商店購買一件買得起的裝備
    const boughtOrClosed = await page.evaluate(() => {
      const buyBtn = [...document.querySelectorAll('button')].find((b) => /\d+\s*銀$/.test(b.textContent?.trim() ?? '') && !b.disabled);
      if (buyBtn) { buyBtn.click(); return true; }
      return false;
    });
    check('商店可購買裝備', boughtOrClosed);
    // 關商店
    await page.evaluate(() =>
      [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '離開')?.click(),
    );
  }
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} 通過`);
process.exit(failed.length === 0 ? 0 : 1);
