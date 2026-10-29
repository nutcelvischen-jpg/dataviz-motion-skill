const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FFMPEG_PATH = path.join(__dirname, 'bin', 'ffmpeg');
const AUDIO_PATH = path.join(__dirname, 'soundtrack_45s.wav');
const OUTPUT_MP4 = path.join(__dirname, 'dataviz_analytics_45s.mp4');
const HTML_PATH = 'file://' + path.join(__dirname, 'index.html');

const FPS = 30;
const DURATION_SEC = 45;
const TOTAL_FRAMES = FPS * DURATION_SEC; // 1350 frames
const BATCH_SIZE = 45; // 45 frames per roundtrip (1.5s of video per batch)

async function main() {
  console.log('========================================================');
  console.log('🎬 數據分析原子 (Data Atoms) 45秒 MP4 動態影片渲染器');
  console.log(`規格: 1920x1080 @ ${FPS} FPS | 總時長: ${DURATION_SEC} 秒 (${TOTAL_FRAMES} 幀)`);
  console.log(`輸出檔案: ${OUTPUT_MP4}`);
  console.log('========================================================\n');

  if (!fs.existsSync(AUDIO_PATH)) {
    console.error('❌ 找不到音樂檔 soundtrack_45s.wav，請先執行 generate_audio_45s.py');
    process.exit(1);
  }

  // 1. Launch FFmpeg process
  console.log('🚀 啟動 FFmpeg 轉碼管線 (H.264 + AAC)...');
  const ffmpeg = spawn(FFMPEG_PATH, [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', 'mjpeg',
    '-r', String(FPS),
    '-i', 'pipe:0',
    '-i', AUDIO_PATH,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '256k',
    '-shortest',
    '-movflags', '+faststart',
    OUTPUT_MP4
  ], {
    stdio: ['pipe', 'inherit', 'inherit']
  });

  ffmpeg.on('error', (err) => {
    console.error('FFmpeg 錯誤:', err);
  });

  // 2. Launch Headless Chrome
  console.log('🌐 啟動 Headless Chrome 渲染核心...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas=false',
      '--enable-gpu-rasterization'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.goto(HTML_PATH, { waitUntil: 'load' });

  // Wait 1.5s for Google WebFonts (Plus Jakarta Sans, Noto Sans TC) to settle
  await new Promise(r => setTimeout(r, 1500));

  console.log('🎨 開始逐幀渲染 Canvas 動態圖表...');
  const startTime = Date.now();

  let renderedFrames = 0;

  for (let batchStart = 0; batchStart < TOTAL_FRAMES; batchStart += BATCH_SIZE) {
    const batchCount = Math.min(BATCH_SIZE, TOTAL_FRAMES - batchStart);
    const indices = [];
    for (let i = 0; i < batchCount; i++) {
      indices.push(batchStart + i);
    }

    const base64List = await page.evaluate((batchIndices) => {
      const canvas = document.getElementById('motionCanvas');
      const list = [];
      for (const idx of batchIndices) {
        renderFrame(idx);
        const url = canvas.toDataURL('image/jpeg', 0.90);
        list.push(url.slice(23)); // Remove "data:image/jpeg;base64,"
      }
      return list;
    }, indices);

    for (const b64 of base64List) {
      const buf = Buffer.from(b64, 'base64');
      const canWrite = ffmpeg.stdin.write(buf);
      if (!canWrite) {
        await new Promise(r => ffmpeg.stdin.once('drain', r));
      }
    }

    renderedFrames += batchCount;
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
    const pct = ((renderedFrames / TOTAL_FRAMES) * 100).toFixed(1);
    const fpsSpeed = (renderedFrames / (elapsedSec || 0.1)).toFixed(1);
    process.stdout.write(`\r⏳ 渲染進度: ${renderedFrames}/${TOTAL_FRAMES} 幀 [${pct}%] | 已耗時: ${elapsedSec}s | 速度: ${fpsSpeed} FPS`);
  }

  console.log('\n\n✅ 所有幀渲染完成，正在封閉寫入管線並完成 MP4 封裝...');
  await browser.close();
  ffmpeg.stdin.end();

  await new Promise((resolve, reject) => {
    ffmpeg.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg 退出代碼: ${code}`));
    });
  });

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  const stats = fs.statSync(OUTPUT_MP4);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log('\n========================================================');
  console.log(`🎉 恭喜！45 秒 MP4 影片製作成功！`);
  console.log(`檔案路徑: ${OUTPUT_MP4}`);
  console.log(`檔案大小: ${sizeMB} MB`);
  console.log(`總耗時: ${totalTime} 秒`);
  console.log('========================================================\n');
}

main().catch(err => {
  console.error('執行失敗:', err);
  process.exit(1);
});
