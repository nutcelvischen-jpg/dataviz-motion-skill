const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FFMPEG_PATH = path.join(__dirname, '..', 'bin', 'ffmpeg');
const AUDIO_PATH = path.join(__dirname, '..', 'media/master_soundtrack_antigravity_guide_60s.wav');
const OUTPUT_DIR = path.join(__dirname, '..', 'videos');
const OUTPUT_MP4 = path.join(OUTPUT_DIR, 'eStat_API申請與連線手把手教學.mp4');
const HTML_URL = 'http://localhost:8080/estat_api_tutorial_simulator.html';

const FPS = 20;
const DURATION_SEC = 24;
const TOTAL_FRAMES = FPS * DURATION_SEC; // 480 frames

async function main() {
  console.log('========================================================');
  console.log('🎬 e-Stat API 申請與避坑操作 螢幕錄影影片渲染器');
  console.log(`規格: 1920x1080 @ ${FPS} FPS | 總時長: ${DURATION_SEC} 秒 (${TOTAL_FRAMES} 幀)`);
  console.log(`輸出目標: ${OUTPUT_MP4}`);
  console.log('========================================================\n');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 1. Launch FFmpeg process with audio mix
  console.log('🚀 啟動 FFmpeg 轉碼管線 (H.264 + AAC)...');
  const ffmpegArgs = [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', 'mjpeg',
    '-r', String(FPS),
    '-i', 'pipe:0'
  ];

  if (fs.existsSync(AUDIO_PATH)) {
    ffmpegArgs.push(
      '-i', AUDIO_PATH,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '19',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-filter_complex', `[1:a]atrim=0:${DURATION_SEC},afade=t=out:st=${DURATION_SEC - 2}:d=2,volume=0.3[a]`,
      '-map', '0:v:0',
      '-map', '[a]',
      '-shortest'
    );
  } else {
    ffmpegArgs.push(
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '19',
      '-pix_fmt', 'yuv420p'
    );
  }

  ffmpegArgs.push('-movflags', '+faststart', OUTPUT_MP4);

  const ffmpeg = spawn(FFMPEG_PATH, ffmpegArgs, { stdio: ['pipe', 'inherit', 'inherit'] });

  ffmpeg.on('error', (err) => {
    console.error('❌ FFmpeg 啟動失敗:', err);
    process.exit(1);
  });

  // 2. Launch Puppeteer Headless Chrome
  console.log('🌐 啟動無頭 Chrome 瀏覽器...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1920,1080',
      '--hide-scrollbars'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  console.log(`🔗 載入教學模擬器頁面: ${HTML_URL}`);
  await page.goto(HTML_URL, { waitUntil: 'networkidle0' });

  // 暫停頁面原本的定時器，由我們以精確影格控制時間
  await page.evaluate(() => {
    if (window.intervalId) clearInterval(window.intervalId);
    window.isPlaying = false;
  });

  console.log(`\n📸 開始逐幀擷取 (總共 ${TOTAL_FRAMES} 幀)...`);
  const startTime = Date.now();

  for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
    const simTime = (frame / FPS); // 當前秒數
    const intSecond = Math.floor(simTime);

    // 呼叫頁面更新函式
    await page.evaluate((sec) => {
      if (typeof updateAnimation === 'function') {
        updateAnimation(sec);
      }
    }, intSecond);

    // 截圖
    const screenshotBuf = await page.screenshot({
      type: 'jpeg',
      quality: 90
    });

    const canWrite = ffmpeg.stdin.write(screenshotBuf);
    if (!canWrite) {
      await new Promise((r) => ffmpeg.stdin.once('drain', r));
    }

    if (frame % 20 === 0 || frame === TOTAL_FRAMES - 1) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const pct = (((frame + 1) / TOTAL_FRAMES) * 100).toFixed(1);
      const speed = ((frame + 1) / (elapsed || 0.1)).toFixed(1);
      process.stdout.write(`\r⏳ 渲染進度: ${frame + 1}/${TOTAL_FRAMES} 幀 [${pct}%] | 已耗時: ${elapsed}s | 速度: ${speed} FPS`);
    }
  }

  console.log('\n\n✅ 螢幕畫面逐幀擷取完畢，正在關閉瀏覽器與完成 FFmpeg 壓制...');
  await browser.close();
  ffmpeg.stdin.end();

  await new Promise((resolve, reject) => {
    ffmpeg.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg 退出代碼: ${code}`));
    });
  });

  // 建立根目錄捷徑
  const linkPath = path.join(__dirname, '..', 'media/eStat_API申請與連線手把手教學_24s.mp4');
  try {
    if (fs.existsSync(linkPath)) fs.unlinkSync(linkPath);
    fs.symlinkSync(path.relative(path.dirname(linkPath), OUTPUT_MP4), linkPath);
  } catch (e) {
    // ignore symlink error
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  const stats = fs.statSync(OUTPUT_MP4);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log('\n========================================================');
  console.log(`🎉 恭喜！e-Stat API 螢幕錄影教學影片製作成功！`);
  console.log(`輸出影片: ${OUTPUT_MP4}`);
  console.log(`影片大小: ${sizeMB} MB`);
  console.log(`總耗時: ${totalTime} 秒`);
  console.log('========================================================\n');
}

main().catch(err => {
  console.error('執行錯誤:', err);
  process.exit(1);
});
