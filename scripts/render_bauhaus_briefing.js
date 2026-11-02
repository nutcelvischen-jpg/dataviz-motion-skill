const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FFMPEG_PATH = path.resolve(__dirname, '../bin/ffmpeg');
const OUT_MP4 = path.resolve(__dirname, '../videos/data_briefing_bauhaus_34s.mp4');
const AUDIO_WAV = path.resolve(__dirname, '../videos/master_soundtrack_bauhaus_34s.wav');

const FPS = 30;
const DURATION = 34.0;
const TOTAL_FRAMES = Math.floor(DURATION * FPS); // 1020 frames

(async () => {
  console.log(`=== Rendering Bauhaus Motion Briefing (${TOTAL_FRAMES} frames @ ${FPS}fps) ===`);

  if (!fs.existsSync(AUDIO_WAV)) {
    console.error(`Error: Audio file ${AUDIO_WAV} does not exist!`);
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  const htmlPath = 'file://' + path.resolve(__dirname, '../motion_briefing_bauhaus/index.html');
  await page.goto(htmlPath, { waitUntil: 'networkidle0' });

  // Wait 1s for web fonts (Plus Jakarta Sans, JetBrains Mono) to settle
  await new Promise(r => setTimeout(r, 1000));

  // Pause timeline before rendering
  await page.evaluate(() => {
    if (window.tl) window.tl.pause();
  });

  // Start FFmpeg pipe process
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

  console.log(`Piping frames into FFmpeg -> ${OUT_MP4}...`);
  const startTime = Date.now();

  for (let f = 0; f < TOTAL_FRAMES; f++) {
    const sec = f / FPS;
    await page.evaluate((s) => window.seekFrame(s), sec);

    const buffer = await page.screenshot({ type: 'png', omitBackground: false });
    ffmpeg.stdin.write(buffer);

    if (f % 150 === 0 || f === TOTAL_FRAMES - 1) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const pct = ((f / TOTAL_FRAMES) * 100).toFixed(1);
      console.log(`Progress: ${pct}% (frame ${f}/${TOTAL_FRAMES}) · ${elapsed}s elapsed`);
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

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✅ Bauhaus Briefing Video rendered successfully in ${totalTime}s! Output: ${OUT_MP4}`);
})();
