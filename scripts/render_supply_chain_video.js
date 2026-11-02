const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FFMPEG_PATH = path.resolve(__dirname, '../bin/ffmpeg');
const OUT_MP4 = path.resolve(__dirname, '../videos/briefing_supply_chain_34s.mp4');
const AUDIO_WAV = path.resolve(__dirname, '../videos/master_soundtrack_supply_chain_34s.wav');

const FPS = 30;
const DURATION = 34.0;
const TOTAL_FRAMES = Math.floor(DURATION * FPS); // 1020 frames

(async () => {
  console.log(`=== Rendering Supply Chain Briefing (${TOTAL_FRAMES} frames @ ${FPS}fps) ===`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  const htmlPath = 'file://' + path.resolve(__dirname, '../motion_briefing_bauhaus/supply_chain.html');
  await page.goto(htmlPath, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));

  await page.evaluate(() => {
    if (window.tl) window.tl.pause();
  });

  const ffmpegArgs = [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', 'png',
    '-r', String(FPS),
    '-i', '-',
    '-i', AUDIO_WAV,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    OUT_MP4
  ];

  const ffmpeg = spawn(FFMPEG_PATH, ffmpegArgs, { stdio: ['pipe', 'inherit', 'inherit'] });
  const startTime = Date.now();

  for (let f = 0; f < TOTAL_FRAMES; f++) {
    const sec = f / FPS;
    await page.evaluate((s) => window.seekFrame(s), sec);
    const buffer = await page.screenshot({ type: 'png', omitBackground: false });
    ffmpeg.stdin.write(buffer);

    if (f % 200 === 0 || f === TOTAL_FRAMES - 1) {
      const pct = ((f / TOTAL_FRAMES) * 100).toFixed(1);
      console.log(`Progress: ${pct}% (${f}/${TOTAL_FRAMES})`);
    }
  }

  ffmpeg.stdin.end();

  await new Promise((resolve, reject) => {
    ffmpeg.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}`));
    });
  });

  await browser.close();
  console.log(`✅ Supply Chain Video rendered successfully -> ${OUT_MP4}`);
})();
