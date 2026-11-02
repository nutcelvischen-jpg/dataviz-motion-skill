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
  await new Promise(r => setTimeout(r, 1200));

  // 1. Open Chat Widget
  await page.waitForSelector('#jitongFloatingTrigger', { timeout: 5000 });
  await page.click('#jitongFloatingTrigger');
  await new Promise(r => setTimeout(r, 600));

  // 2. Check existence of new buttons
  const buttonsInfo = await page.evaluate(() => {
    return {
      hasAttachBtn: !!document.getElementById('btnJitongAttachImage'),
      hasFileInput: !!document.getElementById('jitongImageFileInput'),
      hasSnapChip: !!document.getElementById('btnChipSnapChart'),
      hasReadPageChip: !!document.getElementById('btnChipReadPage'),
      avatarSrc: document.querySelector('.jitong-header-avatar-img')?.src
    };
  });
  console.log('UI elements check:', buttonsInfo);

  // 3. Test Clicking "📸 截取圖表並分析"
  console.log('Clicking "📸 截取圖表並分析" chip...');
  await page.click('#btnChipSnapChart');

  console.log('Waiting for vision response from OpenRouter...');
  for (let i = 0; i < 35; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const isThinking = await page.evaluate(() => !!document.querySelector('[id^="thinking_"]'));
    if (!isThinking) {
      console.log(`Thinking finished at ${i + 1}s`);
      break;
    }
  }

  // 4. Verify message content and attached image
  const chatState = await page.evaluate(() => {
    const userImg = document.querySelector('.jitong-user-attached-img');
    const botBubbles = Array.from(document.querySelectorAll('.jitong-msg.bot .jitong-msg-bubble'));
    const lastBotText = botBubbles.length ? botBubbles[botBubbles.length - 1].innerText : '';
    return {
      userHasImage: !!userImg,
      userImgSrcPrefix: userImg ? userImg.src.slice(0, 30) : null,
      lastBotTextPrefix: lastBotText.slice(0, 200)
    };
  });
  console.log('Chat State after Vision:', chatState);

  // 5. Take screenshot of the result
  await page.screenshot({
    path: '/Users/chenchunchih/.gemini/antigravity/brain/c94a8ac3-56eb-4e5b-bbf2-98acfad3ce44/jitong_vision_end_to_end.png'
  });
  console.log('Saved jitong_vision_end_to_end.png');

  await browser.close();
  console.log('Test completed successfully!');
})();
