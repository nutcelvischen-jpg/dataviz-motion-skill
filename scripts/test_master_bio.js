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

  // 2. Click the new golden chip "👑 數位乩童真身是誰？"
  console.log('Clicking "👑 數位乩童真身是誰？" chip...');
  await page.evaluate(() => {
    const chip = document.querySelector('.jitong-chip-btn.highlight');
    if (chip) chip.click();
  });

  // Wait until thinking indicator disappears or at least 5 seconds
  console.log('Waiting for response...');
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    const isThinking = await page.evaluate(() => {
      return !!document.querySelector('[id^="thinking_"]');
    });
    if (!isThinking) break;
  }

  // Check last bot message content
  const lastReply = await page.evaluate(() => {
    const bubbles = Array.from(document.querySelectorAll('.jitong-msg.bot .jitong-msg-bubble'));
    return bubbles.length ? bubbles[bubbles.length - 1].innerText : null;
  });
  console.log('Bot response preview:\n', lastReply);

  // Capture screenshot of the bio & promotion in chat
  await page.screenshot({
    path: '<LOCAL_PATH>/jitong_master_bio_revealed.png'
  });
  console.log('Saved jitong_master_bio_revealed.png');

  await browser.close();
  console.log('Test completed successfully!');
})();
