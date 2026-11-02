const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to http://localhost:8080/data_atoms.html ...');
  await page.goto('http://localhost:8080/data_atoms.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  // 1. Check floating button
  const hasTrigger = await page.evaluate(() => {
    const el = document.getElementById('jitongFloatingTrigger');
    return !!el && el.innerText.includes('數位乩童');
  });
  console.log('Floating trigger present:', hasTrigger);

  // 2. Click trigger to open chat window
  await page.click('#jitongFloatingTrigger');
  await new Promise(r => setTimeout(r, 400));

  const isOpen = await page.evaluate(() => {
    return document.getElementById('jitongChatWindow').classList.contains('open');
  });
  console.log('Chat window opened:', isOpen);

  await page.screenshot({ path: '/Users/chenchunchih/.gemini/antigravity/brain/c94a8ac3-56eb-4e5b-bbf2-98acfad3ce44/jitong_widget_opened.png' });
  console.log('Saved jitong_widget_opened.png');

  // 3. Click quick question chip
  await page.evaluate(() => {
    const chip = document.querySelector('.jitong-chip-btn');
    if (chip) chip.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const msgCount = await page.evaluate(() => {
    return document.querySelectorAll('.jitong-msg').length;
  });
  console.log('Total chat messages count:', msgCount);

  // 4. Click settings gear
  await page.click('#btnJitongSettings');
  await new Promise(r => setTimeout(r, 400));

  const settingsOpen = await page.evaluate(() => {
    return document.getElementById('jitongSettingsPanel').classList.contains('open');
  });
  console.log('Settings panel opened:', settingsOpen);

  await page.screenshot({ path: '/Users/chenchunchih/.gemini/antigravity/brain/c94a8ac3-56eb-4e5b-bbf2-98acfad3ce44/jitong_widget_settings.png' });
  console.log('Saved jitong_widget_settings.png');

  await browser.close();
})();
