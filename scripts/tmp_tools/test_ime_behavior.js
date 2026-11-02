const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:8080/data_atoms.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  // Open chat
  await page.click('#jitongFloatingTrigger');
  await new Promise(r => setTimeout(r, 300));

  console.log('=== Test 1: Simulating IME Composition (中文選字階段) ===');
  // Dispatch compositionstart on textarea
  const composingResult = await page.evaluate(() => {
    const textarea = document.getElementById('jitongInput');
    textarea.value = '你好';
    
    // Simulate IME compositionstart
    textarea.dispatchEvent(new CompositionEvent('compositionstart'));
    
    // User presses Enter to confirm character selection while isComposing = true
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      keyCode: 229, // standard IME code
      bubbles: true,
      cancelable: true
    });
    textarea.dispatchEvent(enterEvent);

    const msgCount = document.querySelectorAll('.jitong-msg').length;
    const valueStillPresent = textarea.value;
    return { msgCount, valueStillPresent };
  });

  console.log('During IME composition Enter:', composingResult);
  if (composingResult.msgCount === 1 && composingResult.valueStillPresent === '你好') {
    console.log('✅ PASS: Enter during IME composition did NOT trigger send and kept text for user to confirm!');
  } else {
    console.error('❌ FAIL: Enter during composition triggered send prematurely!');
  }

  console.log('=== Test 2: Simulating Actual Send after IME Finish ===');
  const sendResult = await page.evaluate(async () => {
    const textarea = document.getElementById('jitongInput');
    // Simulate IME compositionend (選字完成)
    textarea.dispatchEvent(new CompositionEvent('compositionend'));

    // Now user presses Enter to actually send the message
    const sendEnterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      keyCode: 13,
      bubbles: true,
      cancelable: true
    });
    textarea.dispatchEvent(sendEnterEvent);

    await new Promise(r => setTimeout(r, 50));

    const msgCount = document.querySelectorAll('.jitong-msg').length;
    const valueAfterSend = textarea.value;
    return { msgCount, valueAfterSend };
  });

  console.log('After actual Enter send:', sendResult);
  if (sendResult.msgCount > 1 && sendResult.valueAfterSend === '') {
    console.log('✅ PASS: Message was sent cleanly and textarea was completely cleared with zero residue!');
  } else {
    console.error('❌ FAIL: Text was not cleared or message not sent!');
  }

  await browser.close();
})();
