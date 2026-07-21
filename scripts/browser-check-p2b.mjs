// Phase 2b E2E：v2→v3 遷移、消耗品使用、稱號顯示、奇遇 modal。
import puppeteer from 'puppeteer-core';

const BASE = 'http://localhost:5173';
const results = [];
const check = (name, pass) => { results.push({ name, pass }); console.log(`${pass ? '✓' : '✗'} ${name}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: '/snap/bin/chromium', headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
});

try {
  const page = await browser.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle0' });

  // v2 存檔（無 consumables/titles）→ 載入應遷移為 v3
  await page.evaluate(() => {
    localStorage.setItem('wulin-save-v1', JSON.stringify({
      state: { version: 2, character: {
        name: '老俠客', sectId: 'gaibang',
        attrs: { gen: 20, wu: 12, shen: 14, nei: 13 }, stamina: 90, maxStamina: 100, hp: 100, maxHp: 120,
        silver: 2000, fame: 350, level: 12, exp: 10,
        learnedSkillIds: ['basic_fist', 'iron_body', 'inner_flow', 'wandering_fist', 'nine_yang'],
        equippedSkillIds: ['basic_fist'], equipment: { weapon: 'iron_sword', armor: null }, inventory: ['wooden_sword'],
      }, log: [] }, version: 2,
    }));
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(400);

  check('v2→v3 遷移：舊角色保留', await page.evaluate(() => document.body.innerText.includes('老俠客')));
  check('丐幫門派存在（新門派）', await page.evaluate(() => document.body.innerText.includes('丐幫')));

  // 稱號：level12/fame350/silver2000/5功法 → 應解鎖多個稱號（觸發一次行動讓 store 檢查）
  // 先做一次休息（觸發 store 稱號檢查路徑之一：透過任何 mutate）… rest 不經 tryMutate，改用練功
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent?.includes('練功') && !b.disabled)?.click());
  await sleep(400);
  const hasTitle = await page.evaluate(() => document.body.innerText.includes('稱號'));
  check('稱號區顯示（達標解鎖）', hasTitle);

  // 丹藥 tab
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent?.includes('丹藥'))?.click());
  await sleep(200);
  check('丹藥面板存在', await page.evaluate(() => document.body.innerText.includes('行囊中沒有丹藥') || document.body.innerText.includes('使用')));

  // 闖蕩直到觸發商店 → 買丹藥 → 使用
  let shopSeen = false;
  for (let i = 0; i < 25; i++) {
    const low = await page.evaluate(() => { const m = document.body.innerText.match(/體力\s*(\d+)/); return m ? Number(m[1]) < 15 : false; });
    if (low) { await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent?.includes('休息'))?.click()); await sleep(150); }
    await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent?.includes('闖蕩') && !b.disabled)?.click());
    await sleep(250);
    shopSeen = await page.evaluate(() => document.body.innerText.includes('丹藥雜貨'));
    if (shopSeen) break;
  }
  check('商店販售丹藥', shopSeen);
  if (shopSeen) {
    // 買第一個丹藥（綠色按鈕）
    const bought = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => b.className.includes('bg-emerald-800') && /\d+\s*銀/.test(b.textContent ?? '') && !b.disabled);
      if (btn) { btn.click(); return true; } return false;
    });
    check('可購買丹藥', bought);
    await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '離開')?.click());
    await sleep(200);
  }

  // 闖蕩直到觸發奇遇（18% 機率，多試幾次）
  let encounterSeen = false;
  for (let i = 0; i < 40; i++) {
    const low = await page.evaluate(() => { const m = document.body.innerText.match(/體力\s*(\d+)/); return m ? Number(m[1]) < 15 : false; });
    if (low) { await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent?.includes('休息'))?.click()); await sleep(150); }
    await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent?.includes('闖蕩') && !b.disabled)?.click());
    await sleep(250);
    encounterSeen = await page.evaluate(() => document.body.innerText.includes('路遇落難書生') || document.body.innerText.includes('荒廟夜宿'));
    if (encounterSeen) break;
    // 若商店擋路先關掉
    await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '離開')?.click());
  }
  check('闖蕩觸發奇遇連鎖（40回合內）', encounterSeen);
  if (encounterSeen) {
    // 做一個選擇
    const chose = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')];
      // 奇遇選項是 modal 裡 text-left 的按鈕
      const opt = btns.find((b) => b.className.includes('text-left') && !b.disabled);
      if (opt) { opt.click(); return true; } return false;
    });
    check('奇遇可做選擇', chose);
  }
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} 通過`);
process.exit(failed.length === 0 ? 0 : 1);
