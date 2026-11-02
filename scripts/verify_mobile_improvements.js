const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const pagesToTest = [
    { name: 'curriculum', url: 'http://localhost:8080/curriculum_1105_workflow.html' },
    { name: 'data_analysis', url: 'http://localhost:8080/data_analysis.html' },
    { name: 'estat_api', url: 'http://localhost:8080/estat_api_tutorial_simulator.html' },
    { name: 'estat_catalog', url: 'http://localhost:8080/estat_catalog_and_research_guide.html' },
    { name: 'data_atoms', url: 'http://localhost:8080/data_atoms.html' }
  ];

  const page = await browser.newPage();
  // Standard iPhone 14/15 viewport
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  for (const item of pagesToTest) {
    console.log(`Testing mobile view for ${item.name}...`);
    await page.goto(item.url, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    // Capture initial mobile view
    await page.screenshot({
      path: `/Users/chenchunchih/.gemini/antigravity/brain/c94a8ac3-56eb-4e5b-bbf2-98acfad3ce44/mobile_v2_${item.name}_top.png`,
      fullPage: false
    });

    // Check overflow
    const overflowInfo = await page.evaluate(() => {
      return {
        scrollWidth: document.body.scrollWidth,
        innerWidth: window.innerWidth,
        hasHorizontalOverflow: document.body.scrollWidth > window.innerWidth
      };
    });
    console.log(`[${item.name}] overflow:`, overflowInfo);

    // Scroll down 400px and capture scrolled view
    await page.evaluate(() => window.scrollBy(0, 450));
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({
      path: `/Users/chenchunchih/.gemini/antigravity/brain/c94a8ac3-56eb-4e5b-bbf2-98acfad3ce44/mobile_v2_${item.name}_scrolled.png`,
      fullPage: false
    });
  }

  // Test mobile chat widget bottom sheet
  await page.goto('http://localhost:8080/data_atoms.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  // Capture closed FAB state
  await page.screenshot({
    path: `/Users/chenchunchih/.gemini/antigravity/brain/c94a8ac3-56eb-4e5b-bbf2-98acfad3ce44/mobile_v2_jitong_fab_closed.png`,
    fullPage: false
  });

  // Click FAB to open bottom sheet
  await page.click('#jitongFloatingTrigger');
  await new Promise(r => setTimeout(r, 600));

  // Capture opened bottom sheet
  await page.screenshot({
    path: `/Users/chenchunchih/.gemini/antigravity/brain/c94a8ac3-56eb-4e5b-bbf2-98acfad3ce44/mobile_v2_jitong_bottomsheet_opened.png`,
    fullPage: false
  });

  await browser.close();
  console.log('All mobile verifications complete!');
})();
