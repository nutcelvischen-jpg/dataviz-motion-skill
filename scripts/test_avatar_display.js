const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to http://localhost:8080/data_atoms.html...');
  await page.goto('http://localhost:8080/data_atoms.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  // Wait for floating trigger
  await page.waitForSelector('#jitongFloatingTrigger', { timeout: 5000 });

  // Check avatar image loaded inside trigger
  const triggerImgLoaded = await page.evaluate(() => {
    const img = document.querySelector('.jitong-avatar-img');
    return img ? { src: img.src, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, complete: img.complete } : null;
  });
  console.log('Trigger avatar image status:', triggerImgLoaded);

  // Focus and capture trigger
  const trigger = await page.$('#jitongFloatingTrigger');
  if (trigger) {
    await trigger.screenshot({
      path: '<LOCAL_PATH>/jitong_avatar_trigger_zoom.png'
    });
    console.log('Saved jitong_avatar_trigger_zoom.png');
  }

  // Click floating button to open chat window
  await page.click('#jitongFloatingTrigger');
  await new Promise(r => setTimeout(r, 800));

  // Check header avatar and message avatar
  const avatarsStatus = await page.evaluate(() => {
    const headerImg = document.querySelector('.jitong-header-avatar-img');
    const msgImg = document.querySelector('.jitong-msg-avatar');
    return {
      header: headerImg ? { src: headerImg.src, naturalWidth: headerImg.naturalWidth, complete: headerImg.complete } : null,
      msg: msgImg ? { src: msgImg.src, naturalWidth: msgImg.naturalWidth, complete: msgImg.complete } : null
    };
  });
  console.log('Header & message avatar status:', avatarsStatus);

  // Take screenshot of opened chat window
  const chatWindow = await page.$('#jitongChatWindow');
  if (chatWindow) {
    await chatWindow.screenshot({
      path: '<LOCAL_PATH>/jitong_avatar_widget_zoom.png'
    });
    console.log('Saved jitong_avatar_widget_zoom.png');
  }

  // Capture full page with opened chat window
  await page.screenshot({
    path: '<LOCAL_PATH>/jitong_avatar_full_page.png'
  });
  console.log('Saved jitong_avatar_full_page.png');

  await browser.close();
  console.log('Verification completed successfully!');
})();
