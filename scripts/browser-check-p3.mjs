// Phase 3 E2E：v3→v4 遷移、職位封號、鑄造坊、任務面板。
import puppeteer from 'puppeteer-core';

const BASE = process.env.WL_BASE || 'http://localhost:5174';
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

  // v3 存檔（無 rankId/materials/quests）→ 遷移 v4，高聲望應可晉升
  await page.evaluate(() => {
    localStorage.setItem('wulin-save-v1', JSON.stringify({
      state: { version: 3, character: {
        name: '大俠客', sectId: 'shaolin',
        attrs: { gen: 15, wu: 10, shen: 12, nei: 14 }, stamina: 90, maxStamina: 100, hp: 100, maxHp: 120,
        silver: 3000, fame: 200, level: 10, exp: 0,
        learnedSkillIds: [], equippedSkillIds: [], equipment: { weapon: null, armor: null }, inventory: [],
        consumables: {}, titles: [],
      }, log: [] }, version: 3,
    }));
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(400);

  check('v3→v4 遷移：舊角色保留', await page.evaluate(() => document.body.innerText.includes('大俠客')));

  // 觸發一次行動讓 store 檢查晉升（聲望200 → 應晉升到侍衛/精英侍衛階）
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent?.includes('練功') && !b.disabled)?.click());
  await sleep(400);
  // 職位封號應顯示（流浪者以外的階）
  const rankShown = await page.evaluate(() => {
    const t = document.body.innerText;
    return /食客|武士|侍衛|統領|禁衛|將軍|元帥/.test(t);
  });
  check('職位封號顯示（依聲望晉升）', rankShown);

  // 鑄造坊
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent?.includes('鑄造坊'))?.click());
  await sleep(300);
  check('鑄造坊面板開啟', await page.evaluate(() => document.body.innerText.includes('鑄造坊') && document.body.innerText.includes('現有材料')));
  check('鑄造配方顯示', await page.evaluate(() => document.body.innerText.includes('青鋒劍') || document.body.innerText.includes('屠龍刀')));
  // 關閉
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '離開')?.click());
  await sleep(200);

  // 任務面板
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent?.includes('江湖任務'))?.click());
  await sleep(300);
  check('任務面板開啟', await page.evaluate(() => document.body.innerText.includes('初試身手') || document.body.innerText.includes('除暴安良')));
  // 接一個任務
  const accepted = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === '接受');
    if (btn) { btn.click(); return true; } return false;
  });
  check('可接受任務', accepted);
  await sleep(300);
  // 接受後應出現進度條/進行中
  check('任務顯示進行中', await page.evaluate(() => document.body.innerText.includes('進行中') || /\d+\/\d+/.test(document.body.innerText)));
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} 通過`);
process.exit(failed.length === 0 ? 0 : 1);
