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

  // Mobile viewport: iPhone 14 / modern standard (390 x 844)
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  for (const item of pagesToTest) {
    console.log(`Auditing mobile view for ${item.name} at ${item.url}...`);
    await page.goto(item.url, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));

    // Capture initial mobile view
    await page.screenshot({
      path: `<LOCAL_PATH>/mobile_${item.name}_initial.png`,
      fullPage: false
    });

    // Check if body has horizontal overflow (scrollWidth > innerWidth)
    const overflowInfo = await page.evaluate(() => {
      return {
        bodyScrollWidth: document.body.scrollWidth,
        windowInnerWidth: window.innerWidth,
        hasHorizontalOverflow: document.body.scrollWidth > window.innerWidth,
        viewportMeta: document.querySelector('meta[name="viewport"]')?.content
      };
    });
    console.log(`${item.name} overflow status:`, overflowInfo);
  }

  // Also test digital_jitong chat widget opened on mobile
  await page.goto('http://localhost:8080/data_atoms.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.click('#jitongFloatingTrigger');
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({
    path: `<LOCAL_PATH>/mobile_jitong_widget_opened.png`,
    fullPage: false
  });

  await browser.close();
  console.log('Mobile audit complete.');
})();
