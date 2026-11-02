const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  console.log('Navigating to http://localhost:8080/data_atoms.html...');
  await page.goto('http://localhost:8080/data_atoms.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  // 1. Open Chat Widget
  await page.waitForSelector('#jitongFloatingTrigger', { timeout: 5000 });
  await page.click('#jitongFloatingTrigger');
  await new Promise(r => setTimeout(r, 600));

  // 2. Click golden chip
  console.log('Clicking "👑 數位乩童真身是誰？" chip...');
  await page.evaluate(() => {
    const chip = document.querySelector('.jitong-chip-btn.highlight');
    if (chip) chip.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // 3. Ask a follow-up question via input box
  console.log('Asking follow-up question about StayPass and ICMA lab...');
  await page.type('#jitongInput', '老師自研的 StayPass 宅護照和 ICMA 實驗室算力有多厲害？可以怎麼聯絡老師？');
  await page.click('#btnJitongSend');

  // Wait for LLM response
  console.log('Waiting for OpenRouter LLM response...');
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const isThinking = await page.evaluate(() => !!document.querySelector('[id^="thinking_"]'));
    if (!isThinking) {
      console.log(`Thinking finished at ${i + 1}s`);
      break;
    }
  }

  const messages = await page.evaluate(() => {
    const bubbles = Array.from(document.querySelectorAll('.jitong-msg.bot .jitong-msg-bubble'));
    return bubbles.map(b => b.innerText);
  });

  console.log('--- Last Bot Message ---');
  console.log(messages[messages.length - 1]);

  await page.screenshot({
    path: '/Users/chenchunchih/.gemini/antigravity/brain/c94a8ac3-56eb-4e5b-bbf2-98acfad3ce44/jitong_followup_verified.png'
  });
  console.log('Saved jitong_followup_verified.png');

  await browser.close();
})();
